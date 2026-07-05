# Deployment Plan — Cloud Run + Firebase Hosting

> Deploying the FIFA Draft app on the **Google Cloud free tier**.
> **Architecture:** Angular static SPA on **Firebase Hosting** (CDN) + Express API on **Cloud Run** (scale-to-zero) + **Neon** PostgreSQL (already provisioned).

Track progress by ticking the boxes. See [`APP-OVERVIEW.md`](./APP-OVERVIEW.md) for architecture and [`SSE-ARCHITECTURE.md`](./SSE-ARCHITECTURE.md) for the real-time discussion. Exact copy-paste commands for the 👤 steps live in [`DEPLOYMENT-COMMANDS.md`](./DEPLOYMENT-COMMANDS.md).

---

## ✅ Live deployment (first deploy completed 2026-07-05)

| Resource | Value |
|---|---|
| GCP project | `fifa-draft-app` (project number `553968852510`) |
| Region | `me-west1` |
| Artifact Registry | `me-west1-docker.pkg.dev/fifa-draft-app/fifa-draft/api` |
| Cloud Run service | `fifa-draft-api` → **https://fifa-draft-api-h6qnm5aqqq-zf.a.run.app** |
| Firebase project | `fifa-draft-app` (Firebase added to the same GCP project) |
| Firebase Hosting site | `galactico-draft-app` → **https://galactico-draft-app.web.app** |
| Database | Neon PostgreSQL (schema in sync via `db:push`) |
| Secrets | Secret Manager: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN` |

**Gotchas hit during the first deploy (and their fixes):**
1. **API-enable failed right after project creation** (`SERVICE_CONFIG_NOT_FOUND_OR_PERMISSION_DENIED`) — propagation lag. Fix: wait ~60s and enable APIs one at a time.
2. **`db:push` needs `DATABASE_URL` exported** — `drizzle.config.ts` reads `process.env` but does **not** load `.env.local`. Export it into the shell first.
3. **Container failed to start with NO logs** — the image was built on Apple Silicon (arm64); Cloud Run only runs **linux/amd64**. Fix: `docker build --platform linux/amd64 …` (now documented in the runbook). CI runners are amd64, so this only affects local manual builds.
4. **Firebase Hosting "no site name or target name"** — a fresh Firebase project has no Hosting site. Fix: enable `firebasehosting.googleapis.com`, then `firebase hosting:sites:create`. The chosen site id (`galactico-draft-app`) is pinned in `firebase.json` (`hosting.site`).

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

## Phase 0 — Prerequisites ✅ DONE

- [x] 👤 Google Cloud project created (`fifa-draft-app`), billing account linked
- [x] 👤 `gcloud` CLI installed and authenticated
- [x] 👤 Firebase CLI installed and authenticated
- [x] 👤 Enable APIs: `run`, `artifactregistry`, `cloudbuild`, `secretmanager`, `iamcredentials`, `firebase`, `firebasehosting`
- [x] 👤 Neon PostgreSQL database reachable (already provisioned)
- [x] 👤 Telegram bot created via @BotFather; have the bot token

---

## Phase 1 — Secret hygiene

`projects/server/.env.local` holds **live credentials in plaintext** (Neon DB password, Telegram bot token). It is **gitignored and was never committed** (not in git history), so it did not leak to the remote. Production loads them from Secret Manager, not a file.

- [x] 👤 Rotation: skipped for the Neon DB (reused); a **fresh Telegram bot** was created for this deployment
- [x] 🤖 Confirm `.env.local` stays gitignored (it is) and is never committed ✅
- [x] 👤 Secrets injected via **Secret Manager** (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`), not baked into the image

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

## Phase 3 — Database migration ✅ DONE

- [x] 👤 Point `DATABASE_URL` at the Neon connection string (exported into shell; `drizzle.config.ts` does not auto-load `.env.local`)
- [x] 👤 Run `npm run db:push` to sync the Drizzle schema to Neon → **"No changes"** (already in sync)
- [x] 👤 Verify the 4 tables exist: `users`, `drafts`, `draft_managers`, `picks`

---

## Phase 4 — Deploy the API to Cloud Run ✅ DONE

- [x] 🤖 Runbook with exact commands added ([`DEPLOYMENT-COMMANDS.md`](./DEPLOYMENT-COMMANDS.md) §4)
- [x] 👤 Store secrets in Secret Manager (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`) + grant the runtime SA `secretmanager.secretAccessor`
- [x] 👤 Create Artifact Registry repo `fifa-draft` in `me-west1`
- [x] 👤 Build **for linux/amd64** and push, then deploy:
  ```bash
  IMAGE="me-west1-docker.pkg.dev/fifa-draft-app/fifa-draft/api"
  docker build --platform linux/amd64 -f projects/server/Dockerfile -t "$IMAGE:manual" .
  docker push "$IMAGE:manual"
  gcloud run deploy fifa-draft-api \
    --image "$IMAGE:manual" --region me-west1 --allow-unauthenticated \
    --min-instances 0 --max-instances 1 \
    --set-env-vars NODE_ENV=production \
    --set-secrets DATABASE_URL=DATABASE_URL:latest,TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest
  ```
- [x] 👤 Cloud Run URL: **https://fifa-draft-api-h6qnm5aqqq-zf.a.run.app**
- [x] 👤 `GET /health` → `{"status":"ok"}` ✅
- [x] 👤 `GET /api/players/datasets` → dataset list ✅ (confirms `data/` shipped)

---

## Phase 5 — Deploy the client to Firebase Hosting ✅ DONE

- [x] 🤖 Add `firebase.json` + `.firebaserc` (public dir = `projects/client/dist/fifa-draft-app/browser`, SPA rewrite → `index.html`, `hosting.site` = `galactico-draft-app`)
- [x] 🤖 Relax Angular production budgets so `build:client` passes (initial bundle is ~2.8 MB)
- [x] 👤 `.firebaserc` default project → `fifa-draft-app`
- [x] 👤 `environment.prod.ts` `apiUrl` → `https://fifa-draft-api-h6qnm5aqqq-zf.a.run.app`
- [x] 👤 Add Firebase to the GCP project (`firebase projects:addfirebase`) + create Hosting site (`galactico-draft-app`)
- [x] 👤 Build the client: `npm run build:client`
- [x] 👤 Deploy: `firebase deploy --only hosting` → **https://galactico-draft-app.web.app**
- [x] 👤 Set Cloud Run `FRONTEND_URL` **and** `WEBAPP_URL` to the Hosting URL (CORS + Telegram links)

---

## Phase 6 — Telegram wiring ✅ DONE

- [x] 👤 Register the bot webhook → `.../bot/webhook` (verified `getWebhookInfo`)
- [x] 👤 Set the persistent **Menu Button** (`setChatMenuButton`, type `web_app`) to the Firebase URL
- [x] 👤 `WEBAPP_URL` on Cloud Run points to `https://galactico-draft-app.web.app`

> Note: the `/start` **inline** buttons only appear after pressing Start; the always-visible app button is the **Menu Button**, set separately via BotFather or `setChatMenuButton`.

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
4. ~~**Secrets were in plaintext** in `.env.local`~~ ✅ **Resolved** — production reads `DATABASE_URL` + `TELEGRAM_BOT_TOKEN` from Secret Manager; a fresh Telegram bot was created for this deploy. `.env.local` remains local-only and gitignored.

---

## Still open (post–first-deploy)

- [ ] 👤 **CI/CD activation** (Phase 6.5): set up Workload Identity Federation + deployer SAs and add the GitHub secrets/vars so pushes auto-deploy. Until then, deploys are manual (runbook §4–5).
- [ ] 👤 **End-to-end verification** (Phase 7): run a full two-player draft through Telegram.
