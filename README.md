<div align="center">

# DevPulse

**Your developer activity across GitHub, LeetCode and Codeforces — in one dashboard.**

Your work as a developer is scattered. Commits live on GitHub, problem-solving lives on LeetCode,
competitive results live on Codeforces. DevPulse pulls all three into a single account, keeps a
historical record, and turns it into analytics you can actually read.

[![Node.js](https://img.shields.io/badge/Node.js-20.19+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![BullMQ](https://img.shields.io/badge/BullMQ-5-E5533D)](https://docs.bullmq.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Features

**🔗 Three-platform integration** — GitHub via OAuth, LeetCode via its public GraphQL API, and
Codeforces via `user.info`. Each platform is fetched by a dedicated adapter and passed through a
normalizer before it touches the database.

**🔐 GitHub OAuth + JWT auth** — Email/password accounts secured with bcrypt, session state carried
by JWT. GitHub access tokens are encrypted at rest with AES-256-CBC using a fresh IV per token, and
the OAuth `state` parameter is itself a signed JWT — it both identifies the user across the public
callback and serves as the CSRF check.

**📊 Analytics dashboard** — A trailing-window summary over 7, 30, 90 or 365 days: event totals,
activity by type, a GitHub-style contribution calendar, per-repository breakdowns, LeetCode solve
counts by difficulty, and Codeforces rating movement.

**🕓 Historical activity tracking** — Every sync writes immutable rows to `ActivitySnapshot`, keyed
by `(userId, platform, sourceKey)` so repeated syncs are idempotent. Nothing is overwritten, so the
record grows into a real timeline.

**⚙️ Background sync with BullMQ + Redis** — Syncs never block a request. The API enqueues a job and
returns; a separate worker process does the fetching, with exponential backoff and three attempts.

**⏰ Scheduled synchronization** — A cron-driven job scheduler fans out into one sync job per
connected user. Deduplication keys guarantee a slow sync can never overlap its own next run.

**📈 Charts and visualizations** — Built on Recharts, with a hand-rolled SVG contribution heatmap.
Every chart has a toggleable table view, because a tooltip should never be the only way to read a
value.

**📱 Responsive UI with light + dark modes** — A token-driven design system (colour, type, spacing,
radius, elevation) that adapts to `prefers-color-scheme` and respects `prefers-reduced-motion`.

**🗄️ PostgreSQL + Prisma** — Analytics aggregate in SQL rather than in JavaScript, so results stay
exact regardless of how many rows a user accumulates.

---

## Screenshots


|                                                                                               |                                                                                               |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ![Dashboard overview](docs/screenshots/dashboard.png)                                         | ![Contribution calendar](docs/screenshots/heatmap.png)                                        |
| **Dashboard overview** — KPI tiles for each connected platform with the range filter applied. | **Contribution calendar** — GitHub events per day, bucketed against the window's own maximum. |
| ![Platform charts](docs/screenshots/charts.png)                                               | ![Connect platforms](docs/screenshots/connect.png)                                            |
| **Activity charts** — Daily trend, activity by type, and most-active repositories.            | **Connect platforms** — OAuth for GitHub, username handoff for LeetCode and Codeforces.       |

| ![Light mode](docs/screenshots/light-mode.png)                                                                          |
| ----------------------------------------------------------------------------------------------------------------------- |
| **Light mode** — The full token set inverts; chart colours are a selected light ramp, not an inversion of the dark one. |

---

## Tech Stack

### Frontend

| Technology     | Purpose                             |
| -------------- | ----------------------------------- |
| React 19       | UI framework                        |
| Vite 8         | Build tool and dev server           |
| React Router 7 | Client-side routing                 |
| Recharts 3     | Charting library                    |
| Axios          | HTTP client with auth interceptors  |
| Plain CSS      | Custom design system — no framework |

### Backend

| Technology    | Purpose                     |
| ------------- | --------------------------- |
| Node.js (ESM) | Runtime                     |
| Express 5     | HTTP server and routing     |
| Prisma 6      | ORM, migrations and raw SQL |
| Zod 4         | Request validation          |
| Axios         | Outbound platform requests  |

### Database

| Technology     | Purpose           |
| -------------- | ----------------- |
| PostgreSQL     | Primary datastore |
| Prisma Migrate | Schema versioning |

### Background Jobs

| Technology      | Purpose                              |
| --------------- | ------------------------------------ |
| BullMQ 5        | Queue, worker and cron job scheduler |
| Redis (ioredis) | Queue backend                        |

### Authentication

| Technology    | Purpose                               |
| ------------- | ------------------------------------- |
| jsonwebtoken  | Session tokens and signed OAuth state |
| bcrypt        | Password hashing (cost 10)            |
| Node `crypto` | AES-256-CBC token encryption at rest  |
| GitHub OAuth  | Platform authorization                |

### Tooling

| Technology | Purpose                                          |
| ---------- | ------------------------------------------------ |
| ESLint 10  | Linting, with React Hooks and Fast Refresh rules |
| nodemon    | Backend and worker hot reload                    |

### Deployment

Not yet configured — DevPulse currently runs locally. Containerization and a hosted deployment are
tracked in [Future Improvements](#future-improvements).

---

## Architecture

DevPulse separates **reading** from **fetching**. An HTTP request never waits on a third-party API:
the API enqueues work and returns immediately, a worker performs the fetch, and the dashboard reads
whatever has landed in the database.

```
User → OAuth → API → Queue → Worker → Database → Analytics → Dashboard
```

```mermaid
flowchart TB
    subgraph client["Client"]
        UI["React Dashboard<br/>Vite · Recharts"]
    end

    subgraph api["API — Express"]
        AUTH["Auth<br/>JWT · bcrypt"]
        PLAT["Platforms<br/>GitHub OAuth"]
        SYNC["Sync trigger"]
        ANALYTICS["Analytics<br/>summary"]
    end

    subgraph jobs["Background Jobs"]
        QUEUE[("Redis<br/>BullMQ queue")]
        CRON["Job Scheduler<br/>cron tick"]
        WORKER["Sync Worker<br/>concurrency 5"]
    end

    subgraph ext["External APIs"]
        GH["GitHub<br/>REST"]
        LC["LeetCode<br/>GraphQL"]
        CF["Codeforces<br/>user.info"]
    end

    DB[("PostgreSQL<br/>Prisma")]

    UI -->|"Bearer JWT"| AUTH
    UI --> PLAT
    UI -->|"POST /sync/trigger"| SYNC
    UI -->|"GET /analytics/summary"| ANALYTICS

    PLAT -->|"encrypted token"| DB
    SYNC -->|"enqueue sync-user"| QUEUE
    CRON -->|"sync-all tick"| QUEUE
    QUEUE --> WORKER
    WORKER -->|"fan-out per user"| QUEUE

    WORKER -->|"adapter + retry"| GH
    WORKER -->|"adapter + retry"| LC
    WORKER -->|"adapter + retry"| CF
    GH -->|"normalizer"| WORKER
    LC -->|"normalizer"| WORKER
    CF -->|"normalizer"| WORKER
    WORKER -->|"createMany skipDuplicates"| DB

    ANALYTICS -->|"SQL aggregates"| DB
    DB --> ANALYTICS
    ANALYTICS --> UI
```

### The integration model

This is the single most important design decision in the project, and it is deliberate:

| Platform       | What a row means             | `timestamp` is           | Valid for                              |
| -------------- | ---------------------------- | ------------------------ | -------------------------------------- |
| **GitHub**     | one discrete event           | real upstream event time | time series, per-day charts, calendars |
| **LeetCode**   | a cumulative counter changed | detection time           | totals, windowed deltas, growth        |
| **Codeforces** | profile state changed        | detection time           | current state, rating movement         |

GitHub is **event-based**; LeetCode and Codeforces are **snapshot-based**. This is not an
incomplete integration — those APIs expose cumulative state, not history. The analytics engine
reports each platform under the model it actually uses rather than pretending all three are alike.

---

## Project Structure

```
DevPulse/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Four applied migrations
│   │   └── schema.prisma        # User, ConnectedPlatform, ActivitySnapshot
│   └── src/
│       ├── adapters/            # One per platform — raw API access + retry
│       ├── normalizers/         # Platform payload → ActivitySnapshot rows
│       ├── controllers/         # HTTP handlers
│       ├── services/            # analytics, sync, auth, platform logic
│       ├── queues/              # BullMQ queue + cron job scheduler
│       ├── workers/             # Sync worker process (runs separately)
│       ├── middleware/          # JWT authentication
│       ├── validators/          # Zod request schemas
│       ├── utils/               # crypto, retry, shared axios client
│       ├── lib/                 # Prisma and Redis singletons
│       └── index.js             # Express entry point
│
├── frontend/
│   └── src/
│       ├── api/                 # Axios instance + endpoint wrappers
│       ├── components/
│       │   └── analytics/       # Panels, stat tiles, chart cards
│       │       └── charts/      # Recharts wrappers + shared chart chrome
│       ├── hooks/               # useAnalytics — request-key based loading
│       ├── lib/                 # Session handling, LeetCode helpers
│       ├── pages/               # Login, Register, Dashboard
│       ├── styles/              # Dashboard styles + validated chart palette
│       └── index.css            # Design tokens
│
└── docs/                        # Planning documents
```

**Where the layers split:** adapters know how an API is shaped, normalizers know how the database is
shaped, and nothing else needs to know either. Adding a fourth platform means one adapter, one
normalizer, and a branch in the sync service.

---

## Installation

### Prerequisites

- **Node.js 20.19+** — required by Vite 8 (`^20.19.0 || >=22.12.0`) and ESLint 10
  (`^20.19.0 || ^22.13.0 || >=24`). Node 22.13+ satisfies both comfortably.
- **PostgreSQL 14+** running locally or reachable by URL
- **Redis 6+** running locally or reachable by host/port
- A **GitHub OAuth App** ([create one](https://github.com/settings/developers))

### 1. Clone and install

```bash
git clone https://github.com/stryo2/devPulse.git
cd devPulse

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the GitHub OAuth App

In your OAuth App settings, set the **Authorization callback URL** to:

```
http://localhost:3000/api/platforms/github/callback
```

Copy the **Client ID** and generate a **Client Secret**.

### 3. Create `backend/.env`

See [Environment Variables](#environment-variables) for the full reference.

```bash
cd backend
cp .env.example .env
```

Generate a valid encryption key (must be exactly 64 hex characters):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set up the database

```bash
cd backend
npx prisma migrate deploy   # apply existing migrations
npx prisma generate         # generate the client
```

> The frontend currently points at `http://localhost:3000/api`, hardcoded in
> [`frontend/src/api/http.js`](frontend/src/api/http.js). Change it there if your backend runs
> elsewhere.

---

## Environment Variables

All variables live in `backend/.env`. The six **required** ones are validated at boot — the server
exits immediately if any is missing, rather than failing on the first request that needs it.

### Required

| Variable               | Description                                                  | Example                                          |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                                 | `postgresql://user:pass@localhost:5432/devpulse` |
| `JWT_SECRET`           | Signing secret for session tokens and OAuth state            | `a-long-random-string`                           |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App client ID                                   | `Iv1.abc123...`                                  |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret                               | `secret...`                                      |
| `ENCRYPTION_KEY`       | AES-256 key for tokens at rest — **exactly 64 hex chars**    | `4f8c...` (32 bytes)                             |
| `API_BASE_URL`         | Public base URL of the API, used to build the OAuth callback | `http://localhost:3000`                          |

### Optional

| Variable                 | Default                 | Description                                                        |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `PORT`                   | `3000`                  | API listen port                                                    |
| `FRONTEND_URL`           | `http://localhost:5173` | Where the OAuth callback redirects on success                      |
| `REDIS_HOST`             | `127.0.0.1`             | Redis host                                                         |
| `REDIS_PORT`             | `6379`                  | Redis port                                                         |
| `SYNC_SCHEDULE_ENABLED`  | `true`                  | Set to `false` to disable scheduled syncs and remove the scheduler |
| `SYNC_SCHEDULE_CRON`     | `0 */6 * * *`           | Cron pattern for the fan-out tick (every 6 hours)                  |
| `SYNC_SCHEDULE_TIMEZONE` | `UTC`                   | Timezone the cron pattern is evaluated in                          |
| `SYNC_FANOUT_BATCH_SIZE` | `500`                   | Users enqueued per `addBulk` batch                                 |

> ⚠️ An invalid `SYNC_SCHEDULE_CRON` causes the worker to **exit on startup** by design — a worker
> that silently never schedules anything is far harder to notice than a crash.

---

## Running the Project

DevPulse runs as **three processes** plus two services. The worker is separate from the API on
purpose: it is what keeps a slow third-party API from blocking an HTTP request.

### Services

```bash
# PostgreSQL and Redis — however you run them locally, e.g.
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name devpulse-db postgres:16
docker run -d -p 6379:6379 --name devpulse-redis redis:7
```

### Database

```bash
cd backend
npx prisma migrate deploy     # apply migrations
npx prisma studio             # optional — browse data in the browser
```

### Backend API

```bash
cd backend
npm run dev                   # nodemon, http://localhost:3000
# npm start                   # production
```

### Worker

```bash
cd backend
npm run worker:dev            # nodemon
# npm run worker              # production
```

The worker registers the cron schedule at boot. **Without it running, nothing ever syncs** — jobs
simply queue up in Redis.

### Frontend

```bash
cd frontend
npm run dev                   # http://localhost:5173
npm run build                 # production bundle
npm run lint                  # ESLint
```

> CORS is currently restricted to `http://localhost:5173` in
> [`backend/src/index.js`](backend/src/index.js).

---

## API Overview

All authenticated routes expect `Authorization: Bearer <token>`. Responses follow a
`{ success, ... }` envelope.

### Auth

| Method | Endpoint             | Auth | Description                                             |
| ------ | -------------------- | :--: | ------------------------------------------------------- |
| `POST` | `/api/auth/register` |  —   | Create an account. Returns a JWT. Password min 6 chars. |
| `POST` | `/api/auth/login`    |  —   | Sign in. Returns a JWT valid for 7 days.                |
| `GET`  | `/api/auth/me`       |  ✅  | Return the decoded token payload.                       |

### Platforms

| Method | Endpoint                            | Auth | Description                                                                                              |
| ------ | ----------------------------------- | :--: | -------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/platforms/github/connect`     |  ✅  | Returns a GitHub `authorizationUrl` to redirect to.                                                      |
| `GET`  | `/api/platforms/github/callback`    |  —   | OAuth callback. Public by necessity; the signed `state` identifies the user. Redirects to the dashboard. |
| `POST` | `/api/platforms/leetcode/connect`   |  ✅  | Body `{ username }`. Validates against LeetCode before saving.                                           |
| `POST` | `/api/platforms/codeforces/connect` |  ✅  | Body `{ username }`. Validates the handle before saving.                                                 |

### Sync

| Method | Endpoint            | Auth | Description                                                           |
| ------ | ------------------- | :--: | --------------------------------------------------------------------- |
| `POST` | `/api/sync/trigger` |  ✅  | Enqueue a sync for the current user. Returns `{ jobId }` immediately. |

### Data

| Method | Endpoint                         | Auth | Description                                                   |
| ------ | -------------------------------- | :--: | ------------------------------------------------------------- |
| `GET`  | `/api/activity?limit=50`         |  ✅  | Recent activity, newest first. `limit` caps at 100.           |
| `GET`  | `/api/analytics/summary?days=30` |  ✅  | Full analytics summary. `days` accepts 1–365, defaults to 30. |
| `GET`  | `/health`                        |  —   | Liveness probe.                                               |

<details>
<summary><b>Example — <code>GET /api/analytics/summary?days=30</code></b></summary>

```jsonc
{
  "success": true,
  "data": {
    "window": { "days": 30, "from": "…", "to": "…", "timezone": "UTC" },
    "connectedPlatforms": ["github", "leetcode"],

    "github": {
      "model": "event",
      "totalEvents": 42,
      "byType": { "push": 31, "pull_request": 6, "issue": 3, "star": 2 },
      "daily": [{ "date": "2026-07-01", "count": 3 }], // zero-filled, exactly `days` entries
      "repos": [{ "repo": "owner/name", "count": 12 }], // sorted desc, capped at 100
      "reposTruncated": false,
    },

    "leetcode": {
      "model": "snapshot",
      "current": { "All": 160, "Easy": 76, "Medium": 82, "Hard": 2 },
      "solvedInWindow": { "All": 12, "Easy": 5, "Medium": 7, "Hard": 0 },
      "partialWindow": false,
      "asOf": "2026-07-27T19:51:23.818Z",
    },

    "codeforces": null, // null means NOT CONNECTED — never "connected but empty"
  },
}
```

</details>

---

## Analytics

The analytics engine has one rule that governs everything: **`null` means exactly one thing — the
user has not connected that platform.** A connected platform always returns a block, zeroed if it
has never been synced, flagged with `asOf: null`. "Absent" and "zero" are different facts, and the
UI must be able to tell them apart.

### How each platform is computed

**GitHub — event-based.** All counting happens in SQL (`groupBy` plus two raw aggregate queries),
so no rows are transferred merely to be counted and results stay exact at any volume. The daily
series is zero-filled against a generated date spine, so every day in the requested range is
present and charts need no gap handling. The window is snapped to a UTC day boundary — without
that, `days=30` produces 31 buckets.

**LeetCode and Codeforces — snapshot-based.** These APIs expose cumulative state with no history,
so "solved in the last N days" can only be a difference between two observations:

```
solvedInWindow = current − (count as of windowStart)
```

`DISTINCT ON` selects the latest row per difficulty, plus a second query for the last row _before_
the window start as a baseline.

### `partialWindow` — an honesty flag

If no snapshot exists from before the window began, the baseline falls back to zero and the delta
equals the running total. That is not a bug — the measurement history is simply younger than the
requested range. The engine sets `partialWindow: true` to say so explicitly.

The practical consequence: a freshly connected account reports the same figure for 7, 30, 90 and
365 days. Ranges begin reporting genuine deltas as history accumulates behind them — with the
default 6-hour schedule, the 7-day figure becomes meaningful within a week.

Codeforces degrades differently on purpose: `ratingChangeInWindow` returns `null` rather than
`rating − 0`, because a rating is not cumulative from zero.

### Deliberate limits

- **Repositories cap at 100** per window, sorted by count descending, with `reposTruncated: true`
  when exceeded. Never a silent undercount, and the frontend picks its own top N.
- **Streaks and time-of-day are not implemented.** A cross-platform streak would measure how often
  the _worker_ ran, not how often you worked — it would change whenever `SYNC_SCHEDULE_CRON` is
  edited. See [`docs/PHASE5-ANALYTICS-PLAN.md`](docs/PHASE5-ANALYTICS-PLAN.md) for the GitHub-only
  design that would make them valid.

---

## Background Jobs

```mermaid
sequenceDiagram
    autonumber
    participant C as Cron Scheduler
    participant Q as BullMQ Queue<br/>(Redis)
    participant W as Sync Worker
    participant P as Platform APIs
    participant DB as PostgreSQL

    C->>Q: sync-all tick (every 6h)
    Q->>W: deliver sync-all
    W->>DB: find users with connections
    W->>Q: addBulk sync-user jobs<br/>(deduplicated per user)
    Q->>W: deliver sync-user
    W->>DB: read + decrypt GitHub token
    W->>P: fetch via adapters (retry w/ backoff)
    P-->>W: raw payloads
    W->>W: normalize → ActivitySnapshot rows
    W->>DB: createMany skipDuplicates
```

### The queue

A single queue, `devpulse-sync`, carries two job types:

| Job         | Payload      | Behaviour                                                                 |
| ----------- | ------------ | ------------------------------------------------------------------------- |
| `sync-all`  | none         | The scheduled tick. Fans out into one `sync-user` job per connected user. |
| `sync-user` | `{ userId }` | Fetches, normalizes and persists that user's platforms.                   |

Defaults: **3 attempts** with exponential backoff from 1s, completed jobs retained 24h (max 1000),
failed jobs retained 7 days (max 5000). Worker concurrency is **5**. An unrecognised job name is
logged and returned rather than thrown — a routing mistake cannot be fixed by retrying it.

### Preventing duplicate work

Two mechanisms, addressing different problems:

1. **Scheduler idempotency.** The cron entry uses a fixed id, `devpulse-sync-all`, upserted at
   worker boot. Restarts, redeploys and additional worker replicas all converge on that one entry
   instead of stacking duplicate schedules.

2. **Per-user deduplication.** Each fan-out job carries the key `sync-user:{userId}` with
   `keepLastIfActive`, capping a user at one active plus one waiting job. A sync that runs longer
   than the schedule interval can never overlap its own next run.

Disabling the schedule (`SYNC_SCHEDULE_ENABLED=false`) actively **removes** the scheduler from Redis
rather than skipping registration — otherwise flipping the flag off would leave a live scheduler
running and appear to do nothing.

### Idempotent writes

Rows are inserted with `createMany({ skipDuplicates: true })` against the unique constraint
`(userId, platform, sourceKey)`. Re-syncing the same window is therefore free of duplicates, which
is what makes a frequent schedule safe.

---

## Future Improvements

- [ ] **Insight-driven analytics** — streaks, consistency scoring, best coding day/time, and
      period-over-period comparison. Fully specified in
      [`docs/PHASE5-ANALYTICS-PLAN.md`](docs/PHASE5-ANALYTICS-PLAN.md).
- [ ] **Growth curves from snapshot history** — every historical snapshot row is currently discarded
      in favour of the latest value; those rows _are_ the growth curve.
- [ ] **`lastSyncedAt` on `ConnectedPlatform`** — without it, a worker outage is indistinguishable
      from user inactivity.
- [ ] **Job status endpoint** — the dashboard currently polls on a fixed delay after triggering a sync.
- [ ] **Automated tests** — unit coverage for the analytics pure functions and adapter normalizers.
- [ ] **Dockerized setup** — `docker-compose` for Postgres, Redis, API, worker and frontend.
- [ ] **CI pipeline** — lint, build and migration checks on every push.
- [ ] **Production deployment** — hosted API, worker and frontend with environment-driven config.
- [ ] **Configurable frontend API URL** — replace the hardcoded `localhost:3000` base URL.
- [ ] **Token refresh and disconnect** — let users revoke or re-authorize a platform from the UI.
- [ ] **Additional platforms** — GitLab, HackerRank, Stack Overflow.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch: `git checkout -b feat/your-feature`
2. Make your changes, keeping to the existing structure — adapters stay platform-shaped,
   normalizers stay database-shaped
3. Run `npm run lint` in `frontend/` and confirm `npm run build` passes
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`,
   `refactor:`, `docs:`
5. Open a pull request describing what changed and why

**Two conventions worth knowing before you start:**

- **The event/snapshot distinction is intentional.** Before proposing that LeetCode or Codeforces
  adopt submission-history APIs, read the [integration model](#the-integration-model) — the current
  design is a decision, not an oversight.
- **The chart palette is validated.** The `--viz-*` tokens in
  [`frontend/src/styles/dashboard.css`](frontend/src/styles/dashboard.css) were checked for contrast
  and colour-vision separation against both light and dark surfaces. Re-run that validation before
  changing them.

---

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

**Built by [stryo2](https://github.com/stryo2)**

If DevPulse is useful to you, a ⭐ is appreciated.

</div>
