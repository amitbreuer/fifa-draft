# SSE (Server-Sent Events) Architecture

## Overview

This document describes the SSE-based real-time update architecture for the fifa-draft app, replacing the current HTTP polling approach.

> For the full app architecture, backend, and flows, see [`APP-OVERVIEW.md`](./APP-OVERVIEW.md).

---

## Current Approach: HTTP Polling (every 3s)

`DraftPollingService` calls `GET /drafts/:code/state` every 3 seconds via `timer(0, 3000)`. Each response returns the **full state** (draft, managers, all picks). The server also uses the poll to update `lastSeenAt` for presence.

### Pros

- Dead simple to implement and debug
- Works through all proxies/firewalls/CDNs
- Stateless server — easy to scale horizontally
- Doubles as a presence heartbeat (`lastSeenAt`)

### Cons

- **Wasted bandwidth** — most polls return unchanged data (no picks between polls)
- **Up to 3s latency** — other players don't see a pick immediately
- **DB load scales as `O(players × rooms)`** — every client hits the DB every 3s, even when idle
- Full state on every response (all picks, all managers) — no diffing

---

## SSE Approach

SSE uses a **long-lived HTTP connection** where the server can push text events to the client at any time. The client opens the connection once, and the server writes to it whenever state changes. The connection stays open until the client disconnects or the server closes it.

The HTTP response looks like this on the wire:

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: state
data: {"id":"abc","status":"active","currentManagerIndex":2,...}

event: state
data: {"id":"abc","status":"active","currentManagerIndex":3,...}
```

Each `event:` + `data:` block is pushed when something happens. Between pushes, the connection is idle but open.

---

## Server-Side Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SERVER                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Room Registry (in-memory Map)            │    │
│  │                                                  │    │
│  │  "A3K9XP" → Set<Response> [client1, client2...]  │    │
│  │  "B7M2QR" → Set<Response> [client3, client4...]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────┐      ┌───────────────────────┐       │
│  │  REST Routes │      │  SSE Route            │       │
│  │              │      │                       │       │
│  │ POST /pick   │──┐   │ GET /drafts/:code/sse │       │
│  │ POST /join   │  │   │  - opens connection   │       │
│  │ POST /start  │  │   │  - registers client   │       │
│  └──────────────┘  │   │  - sends initial state│       │
│                    │   └───────────────────────┘       │
│                    │                                    │
│                    ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │          broadcastToRoom(code, state)            │   │
│  │  - queries fresh state from DB                   │   │
│  │  - iterates over all clients in the room         │   │
│  │  - writes SSE event to each Response object      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key data structure:** A `Map<string, Set<Response>>` — keyed by draft `shortCode`, holding all active SSE connections (Express `Response` objects) for that room.

---

## Full Draft Flow (Step by Step)

### Phase 1: Room Creation & Joining

```
Player A creates draft → POST /api/drafts → returns { shortCode: "A3K9XP" }
Player A opens draft page → GET /api/drafts/A3K9XP/sse
```

**Server on SSE connect:**

1. Set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. Look up (or create) the room entry: `rooms.get("A3K9XP")` → `Set<Response>`
3. Add this `res` object to the Set
4. Query DB for current draft state
5. Write initial state event: `res.write("event: state\ndata: ${JSON.stringify(state)}\n\n")`
6. Update `lastSeenAt` for this manager
7. Listen for `req.on('close', ...)` → remove `res` from the Set when client disconnects

```
Player B joins → POST /api/drafts/A3K9XP/join → { slotIndex: 1 }
```

**Server on join (inside the POST handler):**

1. Insert manager into DB (same as today)
2. After successful insert → call `broadcastToRoom("A3K9XP")`
3. `broadcastToRoom` queries fresh state from DB, then writes to ALL connections in the room:
   ```ts
   for (const client of rooms.get("A3K9XP")) {
     client.write(`event: state\ndata: ${JSON.stringify(freshState)}\n\n`);
   }
   ```
4. Player A's client immediately receives the event — sees Player B in the lobby

### Phase 2: Draft Starts

```
Player A (creator) → POST /api/drafts/A3K9XP/start
```

**Server:**

1. Update draft status to `'active'` in DB
2. Call `broadcastToRoom("A3K9XP")`
3. All connected clients receive the new state with `status: 'active'`, `currentManagerIndex: 0`
4. Each client's UI reacts: Player A sees "Your turn!", Player B sees "Waiting for Player A"

### Phase 3: Picks (the core loop)

```
Player A picks Messi → POST /api/drafts/A3K9XP/pick { playerId: 231747 }
```

**Server (inside POST /pick handler):**

1. Validate it's Player A's turn (same as today)
2. Insert pick into DB
3. Advance turn (snake logic) → update `currentManagerIndex`, `currentRound`, etc.
4. Call `broadcastToRoom("A3K9XP")`
5. Fresh state is pushed to ALL clients in the room
6. Player B's client instantly receives the event:
   - Sees Messi is taken
   - Sees `currentManagerIndex` now points to them
   - UI shows "Your turn!"
7. If Player B is **not connected** (no SSE connection in the Set) → send Telegram notification (same as today, using `lastSeenAt` threshold)

**Latency comparison:**

- Polling: Player B waits up to 3 seconds to learn it's their turn
- SSE: Player B knows within ~50ms of the pick being submitted

### Phase 4: Draft Completes

```
Last pick is made → POST /pick
```

**Server:**

1. Snake logic determines `nextRound > maxRounds` → set `status: 'complete'`
2. `broadcastToRoom("A3K9XP")` → all clients see `status: 'complete'`
3. Optionally: close all SSE connections for that room and delete the room entry (cleanup)

---

## Event Flow Diagram

```
Client A (picker)                Server                    Client B (waiting)
     │                              │                              │
     │── POST /pick ───────────────►│                              │
     │                              │── insert pick, advance turn  │
     │                              │── broadcastToRoom() ────────►│
     │◄── 200 { nextManager: 1 } ──│                              │
     │                              │── SSE: event: state ────────►│
     │◄── SSE: event: state ────────│                              │
     │                              │                              │
     │  (both clients now have      │                              │
     │   identical fresh state)     │                              │
```

---

## Presence Handling

Replace the poll-based `lastSeenAt` with SSE connection presence:

| Event | Action |
|-------|--------|
| Client connects to SSE | Update `lastSeenAt = now()` in DB |
| Client disconnects (`req.on('close')`) | Optionally mark manager as offline |
| Heartbeat (every 15-30s) | Server writes `event: ping\ndata: {}\n\n` to keep connection alive AND update `lastSeenAt` |

The heartbeat serves two purposes:

1. Prevents proxies/load balancers from killing idle connections (most timeout after 60-120s of silence)
2. Acts as a presence signal — if the write fails, the client is gone → remove from room

---

## Reconnection (Built-In)

The browser's `EventSource` API automatically reconnects if the connection drops. You can control the retry interval:

```
res.write("retry: 3000\n\n");  // client will retry in 3s if disconnected
```

On reconnect, the server sends the full current state again (step 5 of the connect flow). No missed events — the client always gets the latest snapshot.

---

## What Changes from Current Code

| Component | Current (Polling) | With SSE |
|-----------|-------------------|----------|
| `DraftPollingService` | `timer(0, 3000)` + HTTP GET | Replaced by `EventSource` that receives pushed events |
| `GET /state` endpoint | Hit every 3s by every client | **Removed** — replaced by `GET /sse` |
| `POST /pick`, `/join`, `/start` | Return response to caller only | Same, **plus** call `broadcastToRoom()` after DB mutation |
| Server memory | Stateless | Holds a `Map<string, Set<Response>>` of active connections |
| DB queries | `O(clients × 1/3s)` = constant load | Only on actual events (pick, join, start) — **orders of magnitude less** |
| Latency | 0–3000ms | ~50ms |

---

## Scaling Considerations

**Single server instance (current setup):** The in-memory `Map` works perfectly. No additional infrastructure needed.

**Multiple server instances (future):** Clients may connect to different servers. Solutions:

- **Redis Pub/Sub:** When server A handles a pick, it publishes to a Redis channel. Server B subscribes, receives the event, and pushes to its local clients.
- **Sticky sessions:** Ensure all clients in a room hit the same server (simpler but less resilient).

For a Telegram Mini App draft game, a single server is almost certainly sufficient for a long time.

---

## Alternative Approaches Considered

### WebSockets (e.g., Socket.IO or raw `ws`)

| Pros | Cons |
|------|------|
| Near-instant updates (~50ms) | Stateful connections — harder to scale (need sticky sessions or Redis pub/sub) |
| Zero wasted traffic | More complex error handling (reconnection, heartbeats) |
| Bi-directional | Doesn't work well behind some corporate proxies |
| Can send diffs instead of full state | Need separate presence mechanism or use WS heartbeats |

### Long Polling

| Pros | Cons |
|------|------|
| Works everywhere (plain HTTP) | Higher latency than WS/SSE (~100-500ms) |
| Less traffic than short polling | Server holds open connections (thread/memory) |
| Simpler than WebSockets | Timeout tuning can be tricky with proxies |
| Still stateless-friendly | Presence needs a separate mechanism |

### Why SSE Was Chosen

- Mutations (pick, join, start) are simple REST POSTs — no need for bi-directional communication
- Built-in browser reconnection via `EventSource` API
- Works through most proxies (it's standard HTTP)
- Simpler than WebSockets for a turn-based game
- Dramatically reduces DB load compared to polling
