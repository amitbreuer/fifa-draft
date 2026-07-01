# FIFA Draft — Application Overview

> A Telegram Mini App for running a multiplayer FIFA/EA FC snake draft. Friends join a room, take turns picking real players, and build their squads on an interactive pitch.

---

## Table of Contents

1. [What the App Is](#what-the-app-is)
2. [High-Level Architecture](#high-level-architecture)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [How the Backend Works](#how-the-backend-works)
6. [Data Model](#data-model)
7. [Authentication Flow](#authentication-flow)
8. [End-to-End Flows (UI → Backend)](#end-to-end-flows-ui--backend)
9. [Real-Time Updates](#real-time-updates)
10. [What Changes at Scale / Off the Free Tier](#what-changes-at-scale--off-the-free-tier)

---

## What the App Is

FIFA Draft is a **Telegram Mini App** (a web app running inside Telegram). A user opens it from a Telegram bot, creates a draft room, and shares a 6-character code (or deep link) with friends. Everyone joins, the creator starts the draft, and players take turns picking footballers in a **snake draft** order. Each manager arranges their picks into a formation on a football pitch.

There is also a **local single-player mode** that stores everything in the browser (`localStorage`) with no server involved.

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      TELEGRAM CLIENT                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Angular Mini App (projects/client)                     │  │
│  │   - Lobby / Settings / Draft / Summary components        │  │
│  │   - Services: DraftApi, DraftPolling, Telegram, Player   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬─────────────────────────────────┘
                               │ HTTPS (REST + X-Telegram-Init-Data header)
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                 EXPRESS API SERVER (projects/server)           │
│                                                                │
│  /api/drafts   → draftRouter  (auth-protected)                 │
│  /api/players  → playerRouter (static JSON, in-memory cache)   │
│  /bot/webhook  → botRouter    (grammy Telegram bot)            │
│                                                                │
│  authMiddleware → validates Telegram initData (HMAC)           │
│  notifications  → sends Telegram push when it's your turn      │
└──────────────┬──────────────────────────────┬─────────────────┘
               │ Drizzle ORM                   │ grammy Bot API
               ▼                               ▼
       ┌───────────────┐              ┌──────────────────┐
       │  PostgreSQL   │              │  Telegram Bot    │
       │  users        │              │  (notifications, │
       │  drafts       │              │   deep links)    │
       │  draftManagers│              └──────────────────┘
       │  picks        │
       └───────────────┘

  Player datasets (JSON files on disk) served from projects/server/data/
```

The repo is a **monorepo** with three packages:

| Package | Path | Role |
|---------|------|------|
| `client` | `projects/client` | Angular + PrimeNG front-end (the Mini App) |
| `server` | `projects/server` | Express REST API + Telegram bot |
| `shared` | `projects/shared` | Types/logic shared between client and server |

---

## Tech Stack

**Frontend**
- Angular (standalone components, RxJS)
- PrimeNG UI components
- Telegram Web App SDK (`window.Telegram.WebApp`) for auth, buttons, haptics
- `localStorage` for single-player persistence

**Backend**
- Node.js + Express 5
- Drizzle ORM over PostgreSQL (`pg`)
- grammy (Telegram Bot framework) via webhook
- Player data served from static JSON files, cached in an in-memory `Map`

---

## Features

### Draft Mechanics
- **Snake draft** — pick order reverses each round (R1: 1→2→3, R2: 3→2→1) for fairness.
- **Multi-manager rooms** — up to 10 managers per draft.
- **Configurable rounds** — default 18 rounds (11 starters + 7 bench).
- **Turn enforcement** — only the current manager can submit a pick; the server validates it.
- **Presence tracking** — `lastSeenAt` is updated so the app knows who is online.

### Player Database
- Full EA FC player pool with ratings, stats, positions, clubs, nationalities.
- Multiple datasets supported (e.g. `fc-2026`), listed via `/api/players/datasets`.
- Player details dialog and side-by-side comparison.
- Filtering by position, club, nationality, and drafted status.

### Squad Building
- 30+ formations with an interactive pitch.
- Smart repositioning when switching formations.
- Drag & drop between field positions and bench.
- Undo within a turn.

### Multiplayer / Telegram Integration
- Create/join rooms via 6-character short code or Telegram deep link (`/start CODE`).
- Telegram-native auth (no passwords).
- Push notification when it's your turn **if you're offline**.
- Haptic feedback and native Main/Back buttons.

### Persistence
- Online drafts persisted in PostgreSQL, resumable via "My Drafts".
- Local single-player drafts persisted in `localStorage`.

---

## How the Backend Works

The server (`projects/server/src/index.ts`) is a small Express app with three route groups:

### 1. `/api/drafts` — `draftRouter` (auth required)
The core of the app. Every route runs `authMiddleware` first. Key endpoints:

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/mine` | List drafts the user belongs to (sorted: my-turn → active → waiting → complete) |
| `POST` | `/` | Create a draft; creator auto-joins as manager slot 0 |
| `GET` | `/:code` | Draft info + managers |
| `POST` | `/:code/join` | Join a waiting draft (max 10 managers) |
| `POST` | `/:code/start` | Creator starts the draft (status → `active`) |
| `GET` | `/:code/state` | **Poll** endpoint — full state (draft, managers, all picks); also updates `lastSeenAt` |
| `POST` | `/:code/pick` | Submit a pick; validates turn, inserts pick, advances snake turn |
| `PUT` | `/:code/squad` | Save formation / field positions / bench |
| `DELETE` | `/:code` | Delete a draft (creator only) |

**The pick handler is the heart of the logic.** On `POST /:code/pick` it:
1. Verifies the draft is `active` and it's the caller's turn (`manager.slotIndex === draft.currentManagerIndex`).
2. Rejects already-drafted players.
3. Inserts the pick with a computed `pickOrder`.
4. Advances the turn using snake logic (increment/decrement index, flip direction at the ends, bump round).
5. Marks the draft `complete` when `nextRound > maxRounds`.
6. If the next manager is offline, fires a Telegram notification.

### 2. `/api/players` — `playerRouter` (public)
Serves player datasets from JSON files in `projects/server/data/`. Files are read once and cached in an in-memory `Map`, so subsequent requests are served from memory. This data is static and read-heavy.

### 3. `/bot/webhook` — `botRouter` (grammy)
Handles Telegram bot updates. The `/start` command shows Create/Join buttons that open the Mini App, supports deep links (`/start CODE` → join prompt), and stores the user's `chatId` so the server can send "it's your turn" notifications later.

---

## Data Model

Four PostgreSQL tables (Drizzle schema in `projects/server/src/db/schema.ts`):

```
users                     drafts                        draft_managers            picks
─────                     ──────                        ──────────────            ─────
id (PK)                   id (uuid PK)                  id (PK)                   id (PK)
telegram_id (unique)      short_code (unique)           draft_id → drafts         draft_id → drafts
telegram_chat_id          name                          user_id → users           manager_id → draft_managers
username                  creator_id → users            slot_index                player_id
first_name                status (waiting/active/       formation                 round
created_at                        complete)             field_positions (jsonb)   pick_order
                          max_managers                  bench_player_ids (jsonb)  created_at
                          max_rounds                    last_seen_at
                          dataset_id
                          current_manager_index
                          current_round
                          is_snake_direction
                          last_pick_at
```

- **`users`** — one row per Telegram user; `telegram_chat_id` enables push notifications.
- **`drafts`** — one room; holds turn state (`current_manager_index`, `current_round`, `is_snake_direction`) and status.
- **`draft_managers`** — a user's seat in a draft; stores their squad (`formation`, `field_positions`, `bench_player_ids`) and presence (`last_seen_at`).
- **`picks`** — one row per drafted player, ordered by `pick_order`.

Note: player data itself is **not** in the DB — only the `player_id` is stored in `picks`. Player details come from the static JSON datasets.

---

## Authentication Flow

There are no passwords. Auth is based on Telegram's signed `initData`.

```
1. Telegram loads the Mini App and injects window.Telegram.WebApp.initData
   (a signed string containing the user object + a hash).

2. Angular's DraftApiService attaches it to every request:
      X-Telegram-Init-Data: <initData>
   (In dev, it instead sends X-Dev-Telegram-Id: 12345.)

3. Server authMiddleware validates it:
      - Rebuilds the data-check-string from the params (sorted, minus hash)
      - secretKey = HMAC_SHA256("WebAppData", BOT_TOKEN)
      - expectedHash = HMAC_SHA256(secretKey, dataCheckString)
      - If expectedHash === hash → trust the embedded user object
      - Extracts { telegramId, username, firstName } onto req.user

4. If validation fails and NODE_ENV !== development → 401 Unauthorized.
```

This proves the request genuinely came from Telegram for that user, without any login step. The bot token is the shared secret that makes the signature verifiable.

---

## End-to-End Flows (UI → Backend)

### Flow A: Create a draft
```
Lobby (create mode)
  → onCreateDraft()
  → DraftApiService.createDraft(name, maxRounds, datasetId)
  → POST /api/drafts           [authMiddleware]
      - find/create user
      - insert draft (status='waiting', shortCode=random)
      - insert creator as draft_manager slot 0
      ← { id, shortCode, name }
  → UI switches to "waiting" mode, starts polling GET /state every 2s
```

### Flow B: Join a draft
```
Lobby (join mode) — code typed, or deep link /start CODE, or ?code= query
  → onJoin()
  → DraftApiService.joinDraft(code)
  → POST /api/drafts/:code/join   [authMiddleware]
      - validate draft is 'waiting'
      - reject if full (>=10) or already joined
      - insert draft_manager with next slotIndex
      ← { message, slotIndex }
  → UI switches to "waiting" mode, polls /state until status='active'
```

### Flow C: Start the draft
```
Waiting room (creator only)
  → onStartDraft()
  → POST /api/drafts/:code/start  [authMiddleware]
      - verify caller is creator
      - set status='active'
  → Creator navigates to /draft?code=CODE
  → All other clients see status='active' via their next poll and navigate too
```

### Flow D: Make a pick (the core loop)
```
Draft component — it's my turn
  1. Browse/filter players (data from GET /api/players/:datasetId, cached client-side)
  2. Select a player, place on field/bench (local UI state, undoable)
  3. onFinishTurn()
       → DraftApiService.submitPick(code, playerId)
       → POST /api/drafts/:code/pick   [authMiddleware]
             - validate turn + player availability
             - insert pick, advance snake turn, maybe complete
             - notify next manager if offline
             ← { nextManagerIndex, round, status }
       → DraftApiService.updateSquad(code, {formation, fieldPositions, benchPlayerIds})
       → PUT /api/drafts/:code/squad   (persists the arranged squad)
  4. DraftPollingService keeps polling GET /state every 3s
       - other managers' clients see the new pick + new currentManagerIndex
       - the next manager's UI flips to "Your turn!"
```

### Flow E: Completion & summary
```
Last pick pushes nextRound > maxRounds
  → server sets status='complete'
  → clients polling /state see 'complete'
  → navigate to /summary?code=CODE to view all final squads
```

---

## Real-Time Updates

**Current implementation: HTTP polling.**

- `DraftPollingService` calls `GET /drafts/:code/state` every **3 seconds** during a draft.
- The lobby waiting room polls every **2 seconds** until the draft goes active.
- Each `/state` response returns the **full** state (draft + managers + all picks) and updates the caller's `lastSeenAt` (presence).
- Offline players are covered by **Telegram push notifications** — when a pick advances the turn to someone whose `lastSeenAt` is stale (>10s), the server messages them via the bot.

**Why polling is the right fit here:** the app targets a **Google Cloud Run free tier** deployment with rare, casual usage. Polling lets the instance scale to zero between requests, each poll is a cheap ~50ms request, and a turn-based draft doesn't care about sub-second latency. A dedicated real-time transport (SSE/WebSockets) would keep an instance alive continuously and break the free-tier cost model.

> See [`SSE-ARCHITECTURE.md`](./SSE-ARCHITECTURE.md) for a deep dive on the Server-Sent Events alternative and why it was **not** adopted for the free-tier deployment.

---

## What Changes at Scale / Off the Free Tier

If this app grew into a high-traffic product — or if you simply chose to pay for always-on infrastructure and wanted the "textbook right" design — here's how each layer would evolve.

### 1. Real-time transport
| Now | At scale |
|-----|----------|
| 3s polling, full-state responses | **WebSockets** (Socket.IO) or **SSE** pushing only diffs. Near-instant (~50ms) updates, no wasted requests. |

- For a turn-based game, **SSE** is usually enough (server→client push; mutations stay REST).
- For richer real-time (chat, typing indicators, live cursors) or bi-directional needs, **WebSockets**.
- Either way you drop the constant `/state` polling load entirely.

### 2. Horizontal scaling & connection fan-out
An in-memory room registry (`Map<code, connections>`) only works on a single instance. With many instances behind a load balancer, a pick handled by instance A must reach clients connected to instance B.
- **Redis Pub/Sub** (or NATS/Kafka) as a message backplane: each instance subscribes to a room channel; publishing a pick fans out to every instance, which pushes to its local connections.
- Managed options: **Ably**, **Pusher**, or **Cloud Run + Redis (Memorystore)**.

### 3. Compute / hosting
| Now | At scale |
|-----|----------|
| Cloud Run scale-to-zero, 1 instance | Min instances ≥ 1 (no cold starts), autoscaling on CPU/connections, or a persistent container platform (GKE, ECS, Fly.io) that keeps long-lived connections. |

Real-time connections need `min-instances ≥ 1` and generous request timeouts, which is exactly what breaks the free tier — hence the current polling choice.

### 4. Database
| Now | At scale |
|-----|----------|
| Single PostgreSQL, per-request queries | Connection **pooling** (PgBouncer), **read replicas** for `GET /state`-style reads, indexes on `drafts.short_code`, `draft_managers.draft_id`, `picks.draft_id`. |

- Add a **cache layer** (Redis) for hot draft state so reads don't always hit Postgres.
- Consider moving turn-state into Redis and periodically snapshotting to Postgres if pick throughput becomes high.

### 5. Player data delivery
| Now | At scale |
|-----|----------|
| JSON files read from disk, in-memory cache per instance, served by the API | Push datasets to a **CDN** (Cloudflare/Cloud CDN) or object storage (GCS/S3). They're static and immutable — perfect for edge caching with long TTLs and versioned URLs. |

This offloads a large chunk of bandwidth from the API entirely.

### 6. Concurrency & correctness
At low volume, a race on two picks is unlikely. At scale, make the pick handler **atomic**:
- Wrap validate-turn + insert-pick + advance-turn in a **DB transaction** with row-level locking (`SELECT ... FOR UPDATE` on the draft row), or
- Use an **optimistic version/`updated_at` check** so two simultaneous picks can't both succeed.

### 7. Notifications
| Now | At scale |
|-----|----------|
| Synchronous Telegram send inside the pick handler | Offload to a **queue** (Cloud Tasks / SQS / BullMQ) so a slow/failed Telegram API call never blocks or fails a pick. Add retries and dead-lettering. |

### 8. Observability & resilience
- Structured logging, metrics, and tracing (OpenTelemetry) once there are many concurrent rooms.
- Rate limiting on mutations, health/readiness probes, graceful shutdown that flushes open connections.

### The "right" real-world design for this kind of app
For a genuinely multiplayer, real-time, scalable version:

```
Clients ──WebSocket/SSE──► Stateless app instances (autoscaled)
                                │        │
                                │        └── Redis (Pub/Sub backplane + hot-state cache)
                                │
                                └── PostgreSQL (source of truth, pooled, read replicas)

Static player data ──► CDN / object storage
Notifications ──► async queue ──► Telegram / push providers
```

But for the current goal — a free, always-available app for occasional use — **the existing polling + Cloud Run scale-to-zero design is the correct, cost-optimal choice.** The sophistication above is only justified once real concurrent load exists.
