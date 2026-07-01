# Deployment Commands (Runbook)

Exact commands for the 👤 steps in [`DEPLOYMENT-PLAN.md`](./DEPLOYMENT-PLAN.md).
Run them in order. Everything is parameterized by the variables block below.

> These create real cloud resources and cost/quota implications — run them yourself with your own authenticated CLIs.

---

## 0. Variables (edit, then `source` or paste into your shell)

```bash
export PROJECT_ID="your-gcp-project"          # GCP project id
export REGION="us-central1"                    # Cloud Run + Artifact Registry region
export REPO="fifa-draft"                        # Artifact Registry repo name
export SERVICE="fifa-draft-api"                 # Cloud Run service name
export GITHUB_REPO="amitbreuer/fifa-draft"      # owner/repo
export FIREBASE_PROJECT="$PROJECT_ID"           # Firebase project (often same as GCP)
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/api"
```

---

## 1. One-time GCP project setup

```bash
gcloud auth login
gcloud config set project "$PROJECT_ID"

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com

# Artifact Registry Docker repo (matches IMAGE path used by CI)
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="FIFA Draft images"
```

---

## 2. Secrets in Secret Manager

> Use the **rotated** values (Phase 1). `printf '%s'` avoids a trailing newline.

```bash
printf '%s' 'postgresql://USER:PASS@HOST/db?sslmode=require' \
  | gcloud secrets create DATABASE_URL --data-file=-

printf '%s' '123456:AA-your-bot-token' \
  | gcloud secrets create TELEGRAM_BOT_TOKEN --data-file=-
```

Grant the **Cloud Run runtime service account** access (default compute SA):

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUNTIME_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for S in DATABASE_URL TELEGRAM_BOT_TOKEN; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:$RUNTIME_SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 3. Database migration (Neon)

```bash
# From repo root, with the (rotated) DATABASE_URL exported locally:
export DATABASE_URL='postgresql://USER:PASS@HOST/db?sslmode=require'
npm run db:push          # drizzle-kit pushes the schema to Neon
```

Verify the 4 tables exist (`users`, `drafts`, `draft_managers`, `picks`) in the Neon console.

---

## 4. First manual Cloud Run deploy (to capture the URL)

```bash
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# Build (context = repo root) and push
docker build -f projects/server/Dockerfile -t "$IMAGE:manual" .
docker push "$IMAGE:manual"

# Deploy (free-tier friendly: scale to zero, single instance)
gcloud run deploy "$SERVICE" \
  --image "$IMAGE:manual" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest"

# Capture the service URL
export API_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
echo "API_URL=$API_URL"

# Smoke test
curl -s "$API_URL/health"
curl -s "$API_URL/api/players/datasets"
```

---

## 5. Client → Firebase Hosting

```bash
npm i -g firebase-tools
firebase login

# Point .firebaserc at your project (or edit the file directly)
firebase use --add "$FIREBASE_PROJECT"

# Set the API URL the client will call (baked into the static build)
#   edit projects/client/src/environments/environment.prod.ts →
#   apiUrl: '<API_URL from step 4>'

npm run build:client
firebase deploy --only hosting

export WEB_URL="https://$FIREBASE_PROJECT.web.app"
echo "WEB_URL=$WEB_URL"
```

---

## 6. Wire the URLs back + Telegram

```bash
# Cloud Run now knows the client origin (CORS + bot links)
gcloud run services update "$SERVICE" --region "$REGION" \
  --update-env-vars "WEBAPP_URL=$WEB_URL,FRONTEND_URL=$WEB_URL"

# Register the Telegram webhook
TOKEN='123456:AA-your-bot-token'
curl -s "https://api.telegram.org/bot$TOKEN/setWebhook?url=$API_URL/bot/webhook"
```

Then in **@BotFather**: set the Mini App / menu-button URL to `$WEB_URL`.

---

## 7. CI/CD: Workload Identity Federation + deployer SA

```bash
# Deployer service account for GitHub Actions (Cloud Run)
gcloud iam service-accounts create gh-deployer --display-name="GitHub Actions deployer"
export DEPLOY_SA="gh-deployer@$PROJECT_ID.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.writer \
            roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOY_SA" --role="$ROLE"
done

# Workload Identity Federation pool + OIDC provider (no long-lived keys)
gcloud iam workload-identity-pools create github --location=global --display-name=github
export POOL=$(gcloud iam workload-identity-pools describe github --location=global --format='value(name)')

gcloud iam workload-identity-pools providers create-oidc github-oidc \
  --location=global --workload-identity-pool=github --display-name=github-oidc \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
export PROVIDER=$(gcloud iam workload-identity-pools providers describe github-oidc \
  --location=global --workload-identity-pool=github --format='value(name)')

# Let the GitHub repo impersonate the deployer SA
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL/attribute.repository/$GITHUB_REPO"

echo "GCP_WIF_PROVIDER   = $PROVIDER"
echo "GCP_SERVICE_ACCOUNT = $DEPLOY_SA"
```

### Firebase deploy credential for CI

```bash
# Service account + key for the Firebase Hosting deploy step
gcloud iam service-accounts create fb-deployer --display-name="Firebase Hosting deployer"
export FB_SA="fb-deployer@$PROJECT_ID.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$FB_SA" --role="roles/firebasehosting.admin"
gcloud iam service-accounts keys create fb-key.json --iam-account="$FB_SA"
# fb-key.json is uploaded as the FIREBASE_SERVICE_ACCOUNT secret below — then delete it.
```

---

## 8. GitHub repo secrets & variables (via `gh` CLI)

```bash
# Variables (non-secret)
gh variable set GCP_PROJECT_ID     -b "$PROJECT_ID"     -R "$GITHUB_REPO"
gh variable set GCP_REGION         -b "$REGION"         -R "$GITHUB_REPO"
gh variable set FIREBASE_PROJECT_ID -b "$FIREBASE_PROJECT" -R "$GITHUB_REPO"
gh variable set WEBAPP_URL         -b "$WEB_URL"        -R "$GITHUB_REPO"
gh variable set FRONTEND_URL       -b "$WEB_URL"        -R "$GITHUB_REPO"

# Secrets
gh secret set GCP_WIF_PROVIDER      -b "$PROVIDER"      -R "$GITHUB_REPO"
gh secret set GCP_SERVICE_ACCOUNT   -b "$DEPLOY_SA"     -R "$GITHUB_REPO"
gh secret set FIREBASE_SERVICE_ACCOUNT < fb-key.json    -R "$GITHUB_REPO"

rm -f fb-key.json   # don't leave the key on disk
```

---

## 9. Trigger CI

```bash
# Manual first run (forces both parts)
gh workflow run deploy.yml -R "$GITHUB_REPO" -f deploy_server=true -f deploy_client=true

# Thereafter: push to main → change detection deploys only what changed.
```

---

## Quick reference: what maps where

| Value | Produced in | Consumed by |
|-------|-------------|-------------|
| `API_URL` (Cloud Run) | Step 4 | client `environment.prod.ts`, Telegram webhook |
| `WEB_URL` (Firebase) | Step 5 | Cloud Run `WEBAPP_URL`/`FRONTEND_URL`, BotFather |
| `PROVIDER`, `DEPLOY_SA` | Step 7 | GitHub secrets `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT` |
| `fb-key.json` | Step 7 | GitHub secret `FIREBASE_SERVICE_ACCOUNT` |
| Secret Manager `DATABASE_URL`, `TELEGRAM_BOT_TOKEN` | Step 2 | Cloud Run `--set-secrets` |
