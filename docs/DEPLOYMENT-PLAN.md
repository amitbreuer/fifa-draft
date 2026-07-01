# Deployment Plan — Cloud Run + Firebase Hosting

> Deploying the FIFA Draft app on the **Google Cloud free tier**.
> **Architecture:** Angular static SPA on **Firebase Hosting** (CDN) + Express API on **Cloud Run** (scale-to-zero) + **Neon** PostgreSQL (already provisioned).

Track progress by ticking the boxes. See [`APP-OVERVIEW.md`](./APP-OVERVIEW.md) for architecture and [`SSE-ARCHITECTURE.md`](./SSE-ARCHITECTURE.md) for the real-time discussion. Exact copy-paste commands for the 👤 steps live in [`DEPLOYMENT-COMMANDS.md`](./DEPLOYMENT-COMMANDS.md).

---

## Why this architecture

| Factor | Single Cloud Run container | **Separate (Firebase + Cloud Run)** ✅ |
|---|---|---|
| UI load when scaled to zero | Cold start blocks the whole page (1–3s blank) | UI serves instantly from CDN; only first API call pays cold start |
| Free-tier budget | Static requests burn Cloud Run CPU-seconds | Static bandwidth offloaded to Firebase; Cloud Run only handles API |
| CORS | None (same origin) | One env var (`FRONTEND_URL`) — already handled in code |
| Deploys | One step | Two steps (both scripted) |

Decisive reason: a Telegram Mini App must **open instantly**, so serving the shell from a CDN (never blocked by a cold Cloud Run instance) is the better UX for rare, casual usage.

---

## Legend

- 🤖 = agent can produce this (code/config artifact)
- 👤 = you run this (needs GCP/Firebase auth, secrets, or your accounts)

---

## Phase 0 — Prerequisites

- [ ] 👤 Google Cloud project created, billing account linked (required even for free tier)
- [ ] 👤 `gcloud` CLI installed and authenticated (`gcloud auth login`, `gcloud config set project <ID>`)
- [ ] 👤 Firebase CLI installed and authenticated (`npm i -g firebase-tools`, `firebase login`)
- [ ] 👤 Enable APIs: `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`
- [ ] 👤 Neon PostgreSQL database reachable (already provisioned)
- [ ] 👤 Telegram bot created via @BotFather; have the bot token

---

## Phase 1 — Secret hygiene (do first)

`projects/server/.env.local` holds **live credentials in plaintext** (Neon DB password, Telegram bot token). It is **gitignored and was never committed** (not in git history), so it did not leak to the remote. Rotation is prudent-but-optional since the values were surfaced in plaintext locally; regardless, production must load them from Secret Manager, not a file.

- [ ] 👤 (Recommended) **Rotate the Neon DB password** and **Telegram bot token** (@BotFather `/revoke`)
- [ ] 🤖 Confirm `.env.local` stays gitignored (it is) and is never committed ✅
- [ ] 👤 Inject secrets via **Secret Manager** / Cloud Run, never baked into the image

---

## Phase 2 — Server: containerization (code artifacts) ✅ DONE

- [x] 🤖 Rewrite `projects/server/Dockerfile` to be **monorepo-aware**:
  - build context = repo root (so the `@fifa-draft/shared` workspace resolves)
  - workspace-aware `npm ci`, then **bundle the server with esbuild** into a single self-contained CJS file
  - copy `projects/server/data/` into the image (player datasets)
  - removed the broken `COPY ../src/assets/players.json` line
  - _Result: 166 MB runtime image, no runtime `node_modules` needed → fast cold starts._
- [x] 🤖 Add `.dockerignore` (excludes `node_modules`, `.env*`, `dist`, `.angular`, `.git`, docs, client source)
- [x] 🤖 Add esbuild `build:bundle` script + devDep to `projects/server/package.json` (lockfile updated)
- [x] 🤖 Verify `PORT` handling (code reads `process.env.PORT`; Cloud Run injects 8080) ✅ already OK
- [x] 🤖 Tighten CORS: production requires `FRONTEND_URL` (warns if unset); dev still allows `*`
- [x] 🤖 **Validated locally**: `docker build` succeeds; container serves `/health`, `/api/players/datasets` (data shipped), and returns 401 on protected routes

---

## Phase 3 — Database migration

- [ ] 👤 Point `DATABASE_URL` at the (rotated) Neon connection string
- [ ] 👤 Run `npm run db:push` to sync the Drizzle schema to Neon
- [ ] 👤 Verify the 4 tables exist: `users`, `drafts`, `draft_managers`, `picks`

---

## Phase 4 — Deploy the API to Cloud Run

- [ ] 🤖 Add a deploy script / runbook (`deploy/deploy-server.sh`) wrapping the commands below
- [ ] 👤 Store secrets in Secret Manager (recommended) or pass as env vars:
  - `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `FRONTEND_URL`, `NODE_ENV=production`
- [ ] 👤 Deploy:
  ```bash
  gcloud run deploy fifa-draft-api \
    --source projects/server \
    --region <REGION> \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 1 \
    --set-env-vars NODE_ENV=production \
    --set-secrets DATABASE_URL=…,TELEGRAM_BOT_TOKEN=…
  ```
- [ ] 👤 Note the assigned Cloud Run URL (e.g. `https://fifa-draft-api-xxxx.run.app`)
- [ ] 👤 Verify `GET <cloud-run-url>/health` returns `{ status: "ok" }`
- [ ] 👤 Verify `GET <cloud-run-url>/api/players/datasets` returns the dataset list (confirms `data/` shipped)

---

## Phase 5 — Deploy the client to Firebase Hosting

- [x] 🤖 Add `firebase.json` + `.firebaserc` (public dir = `projects/client/dist/fifa-draft-app/browser`, SPA rewrite → `index.html`)
- [x] 🤖 Set `projects/client/src/environments/environment.prod.ts` `apiUrl` to a Cloud Run URL placeholder
- [ ] 👤 Replace `REPLACE_WITH_FIREBASE_PROJECT_ID` in `.firebaserc` with your Firebase project ID
- [ ] 👤 Replace `REPLACE_WITH_CLOUD_RUN_URL` in `environment.prod.ts` with the real Cloud Run URL (from Phase 4)
- [ ] 👤 Build the client: `npm run build:client`
- [ ] 👤 Deploy: `firebase deploy --only hosting`
- [ ] 👤 Note the Firebase Hosting URL (e.g. `https://<project>.web.app`)
- [ ] 👤 Set Cloud Run `FRONTEND_URL` **and** `WEBAPP_URL` to this URL, then redeploy the API (CORS + Telegram links)

---

## Phase 6 — Telegram wiring

- [ ] 👤 Register the bot webhook:
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<cloud-run-url>/bot/webhook"
  ```
- [ ] 👤 In @BotFather, set the Mini App / menu button URL to the Firebase Hosting URL
- [ ] 👤 Confirm `WEBAPP_URL` (used in bot deep links & notifications) points to the Firebase URL

---

## Phase 6.5 — CI/CD (GitHub Actions) — one monorepo pipeline, independent deploys

A single workflow (`.github/workflows/deploy.yml`) with a **change-detection job** (`dorny/paths-filter`) that decides which parts deploy — so the **client and server deploy independently** and a change to one never redeploys the other.

- [x] 🤖 `.github/workflows/deploy.yml` — jobs: `changes` → `deploy-server` (Cloud Run) + `deploy-client` (Firebase), each gated on the filter. Validated as well-formed YAML.
- [x] 🤖 Change detection also honors **manual `workflow_dispatch`** inputs (`deploy_server` / `deploy_client`) — something native `on.paths` can't do.
- [ ] 👤 Create an Artifact Registry Docker repo named `fifa-draft` in your region:
  `gcloud artifacts repositories create fifa-draft --repository-format=docker --location=<REGION>`
- [ ] 👤 Set up **Workload Identity Federation** (recommended) for GitHub → GCP, and a deployer service account with roles: `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `secretmanager.secretAccessor`.
- [ ] 👤 Add GitHub **repository secrets**: `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `FIREBASE_SERVICE_ACCOUNT`.
- [ ] 👤 Add GitHub **repository variables**: `GCP_PROJECT_ID`, `GCP_REGION`, `FIREBASE_PROJECT_ID`, `WEBAPP_URL`, `FRONTEND_URL`.
- [ ] 👤 Create Secret Manager secrets `DATABASE_URL` and `TELEGRAM_BOT_TOKEN` (referenced by the Cloud Run deploy step).
- [ ] 👤 First run: trigger via `workflow_dispatch` (tick both inputs) to confirm, then rely on push-based change detection.

> Note: the workflow does the first deploy too, but the very first Cloud Run deploy can also be done manually (Phase 4) so you can capture the URL before the client build.

---

## Phase 7 — End-to-end verification

- [ ] 👤 Open the bot in Telegram → tap Create Draft → Mini App opens (instant load from CDN)
- [ ] 👤 Create a draft, confirm a `drafts` row + creator `draft_managers` row appear in Neon
- [ ] 👤 Join from a second Telegram account via the share code / deep link
- [ ] 👤 Start the draft; verify polling reflects state across both clients
- [ ] 👤 Make a pick; confirm turn advances (snake logic) and the other client updates within ~3s
- [ ] 👤 Go offline on the next manager's turn → confirm the Telegram "your turn" notification fires
- [ ] 👤 Complete a short draft (low `maxRounds`) → confirm status `complete` + summary view

---

## Phase 8 — Hardening (optional / later)

- [x] 🤖 CI/CD pipelines created (see Phase 6.5) — GitHub Actions, client & server deploy independently
- [ ] Move player datasets to CDN/static hosting to offload API egress
- [ ] Add structured logging + Cloud Run request metrics/alerts
- [ ] Rate-limit mutation endpoints (`/pick`, `/join`, `/create`)
- [ ] Make the pick handler atomic (DB transaction + row lock) if concurrency grows
- [ ] Revisit SSE/WebSockets only if you move off scale-to-zero (see `SSE-ARCHITECTURE.md`)

---

## Environment variables reference

| Variable | Where | Example / Notes |
|---|---|---|
| `DATABASE_URL` | Cloud Run (secret) | Neon connection string (rotated) |
| `TELEGRAM_BOT_TOKEN` | Cloud Run (secret) | From @BotFather (rotated) |
| `WEBAPP_URL` | Cloud Run | Firebase Hosting URL — used in bot deep links & notifications |
| `FRONTEND_URL` | Cloud Run | Firebase Hosting URL — used for CORS |
| `NODE_ENV` | Cloud Run | `production` (disables dev-auth bypass) |
| `PORT` | Cloud Run | Injected automatically (8080); code already respects it |
| `apiUrl` | client `environment.prod.ts` | Cloud Run API URL (baked into the static build) |

---

## Known blockers being fixed

1. ~~**Dockerfile is currently broken**~~ ✅ **Fixed** — rewritten monorepo-aware with esbuild bundling; validated with a local `docker build` + container run.
2. ~~**`data/` not copied** into the image~~ ✅ **Fixed** — `data/` is copied; verified `/api/players/datasets` returns data from the running container.
3. ~~**Client hosting undecided**~~ ✅ **Resolved** — Firebase Hosting; `firebase.json`/`.firebaserc` + CI added.
4. **Secrets were in plaintext** in `.env.local` → still **TODO**: rotate in Phase 1 and move to Secret Manager.
