# DevPulse — Deployment

| | URL |
|---|---|
| Frontend (Vercel) | https://dev-pulse-lake.vercel.app |
| Backend (Render) | https://devpulse-api-ly4m.onrender.com |
| Database | Neon · AWS `ap-southeast-1` |
| Queue | Upstash Redis · `ap-southeast-1`, Regional, eviction off |

Both platforms deploy from `main`. All four services live in Singapore.

Stack (all free tier): **Vercel** (frontend) · **Render** (backend) ·
**Neon** (Postgres) · **Upstash** (Redis) · **GitHub Actions** (CI + scheduling).

Render's free tier has no background-worker service and no cron, so:

- the BullMQ worker runs **inside the API process** (`RUN_WORKER_IN_PROCESS=true`)
- scheduling comes from a GitHub Actions cron calling `POST /api/sync/run-all`

---

## Local development

The frontend runs on the host; everything else runs in Docker.

```bash
docker compose up --build
docker compose exec api npx prisma migrate deploy   # first run only
cd frontend && npm run dev
```

Host ports: API `3000`, Postgres `5433`, Redis `6380`. Postgres and Redis are
shifted off their defaults because the host already runs Postgres on 5432.

Secrets come from `backend/.env` (see `backend/.env.example`). Compose overrides
`DATABASE_URL`, `DIRECT_URL` and `REDIS_URL` to point at the container network.

Reset everything:

```bash
docker compose down -v && docker compose up --build
```

---

## Pre-deploy smoke test

Re-run this after any infrastructure change. Every step must pass before
provisioning cloud resources, and again after each deployment milestone.

### Boot and configuration

- [ ] `docker compose down -v && docker compose up --build` succeeds from scratch
- [ ] `docker compose exec api npx prisma migrate deploy` applies all migrations
- [ ] Removing a required env var makes **both** the API and the worker exit 1
      with a named error (not a stack trace)
- [ ] An `ENCRYPTION_KEY` that is not 64 hex characters is rejected at boot

### Health

- [ ] `GET /health` → `200`, and issues **no** database query
- [ ] `GET /health/ready` → `200` with database and redis both `up`
- [ ] `docker compose stop redis` → `/health/ready` returns `503` naming redis
- [ ] `docker compose start redis` → back to `200`

### Auth and API

- [ ] Register a new user → `201` with a token
- [ ] Log in with the same credentials → token returned
- [ ] Authenticated `GET /api/activity?limit=5` → `200`
- [ ] Same request without a token → `401`
- [ ] `GET /api/nope` → JSON `404`, not an HTML error page
- [ ] Malformed JSON body → JSON error, **no stack trace in the response**
- [ ] Logs contain the user's UUID and **never** their email address

### CORS

- [ ] `Origin: http://localhost:5173` → response carries `Access-Control-Allow-Origin`
- [ ] `Origin: https://evil.com` → no such header, and **not** a 500

### Queue and worker

- [ ] `POST /api/sync/trigger` (user token) → job appears in the worker logs
- [ ] `POST /api/sync/run-all` without the secret → `401`
- [ ] With `CRON_SECRET` → `200` and per-user jobs process
- [ ] Calling it twice in a row dedupes the second batch
- [ ] `RUN_WORKER_IN_PROCESS=true` on the api service alone still processes jobs
- [ ] `docker compose stop api` → graceful shutdown in the logs, no forced kill

### End to end

- [ ] GitHub OAuth round-trip completes and the platform shows as connected
- [ ] A sync populates activity and the analytics dashboard renders

---

## Environment variables

`backend/.env.example` is the authoritative list. Deployment-specific values:

| Variable | Local | Render (production) |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `3000` | injected by Render |
| `DATABASE_URL` | compose Postgres | Neon **pooled** + `?sslmode=require&pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | same as above | Neon **direct** (no `-pooler`) + `?sslmode=require` |
| `REDIS_URL` | `redis://redis:6379` | `rediss://default:<pw>@<id>.upstash.io:6379` |
| `API_BASE_URL` | `http://localhost:3000` | `https://<service>.onrender.com` — no trailing slash |
| `FRONTEND_URL` | `http://localhost:5173` | the Vercel URL |
| `CORS_ORIGINS` | `http://localhost:5173` | the Vercel URL |
| `CORS_PREVIEW_PATTERN` | unset | `^https://<project>-[a-z0-9-]+\.vercel\.app$` |
| `RUN_WORKER_IN_PROCESS` | `false` | `true` |
| `SYNC_SCHEDULE_ENABLED` | `true` | `false` — Actions owns scheduling |
| `SYNC_WORKER_CONCURRENCY` | `5` | `2` |
| `JWT_SECRET` / `ENCRYPTION_KEY` / `CRON_SECRET` | dev values | **fresh** values, never reused from dev |

Two coupling rules that break things silently when violated:

1. `API_BASE_URL` must exactly equal the origin of the GitHub OAuth App's
   callback URL. GitHub matches `redirect_uri` byte for byte.
2. `ENCRYPTION_KEY` cannot be rotated without invalidating every stored GitHub
   token — users would have to reconnect.

---

## Gotchas that cost time

**GitHub OAuth App: leave "Expire user access tokens" unchecked.** GitHub's
newer UI enables it by default. The code stores only `access_token` and has no
refresh logic, so tokens would expire ~8h after a user connects and every sync
would 401 until they reconnected.

**`VITE_API_BASE_URL` is baked in at build time.** Setting it on Vercel does
nothing until a rebuild. A deployment missing it silently ships a bundle
pointing at localhost — `http.js` logs a warning in that case.

**Vercel's "Redeploy" reuses that deployment's commit.** Changing the
production branch does not retroactively apply; push a new commit instead.

**Render env vars are literal.** Quotes pasted around a value become part of
it, which silently breaks `CORS_ORIGINS` matching.

**Render snapshots env vars when a build starts.** Variables saved mid-build
apply only to the next deploy.

**`prisma` lives in `dependencies`, not `devDependencies`.** Render sets
`NODE_ENV=production`, so `npm ci` skips devDependencies and the `postinstall`
`prisma generate` would fail with the CLI missing.

---

## Free-tier limits to watch

| Service | Limit | Consequence |
|---|---|---|
| Render | 750 instance-hours/mo, workspace-wide | one always-on service ≈ 720h; a second is impossible |
| Render | spins down after ~15 min idle | first request takes 30–60s |
| Neon | 100 CU-hours/mo, suspends after ~5 min idle | never let a health check or pinger touch the database |
| Neon | 0.5 GB storage | `ActivitySnapshot` grows forever; needs a retention policy |
| Upstash | 500k commands/mo | BullMQ defaults alone exceed this — `drainDelay` is set to 60s for this reason |
| Vercel | Hobby is non-commercial | must upgrade if the project ever earns money |
