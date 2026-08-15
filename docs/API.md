# DevPulse — API Reference

Base URL is `${API_BASE_URL}/api`. Authenticated routes expect
`Authorization: Bearer <token>`. Responses follow a `{ success, ... }` envelope; errors return
`{ success: false, message }`.

## Auth

| Method | Endpoint | Auth | Description |
|---|---|:--:|---|
| `POST` | `/api/auth/register` | — | Create an account. Returns a JWT. Password min 6 chars. |
| `POST` | `/api/auth/login` | — | Sign in. Returns a JWT valid for 7 days. |
| `GET` | `/api/auth/me` | ✅ | Return the decoded token payload. |

## Platforms

| Method | Endpoint | Auth | Description |
|---|---|:--:|---|
| `GET` | `/api/platforms/github/connect` | ✅ | Returns a GitHub `authorizationUrl` to redirect to. |
| `GET` | `/api/platforms/github/callback` | — | OAuth callback. Public by necessity; the signed `state` identifies the user. Redirects to the dashboard. |
| `POST` | `/api/platforms/leetcode/connect` | ✅ | Body `{ username }`. Validates against LeetCode before saving. |
| `POST` | `/api/platforms/codeforces/connect` | ✅ | Body `{ username }`. Validates the handle before saving. |

## Sync

| Method | Endpoint | Auth | Description |
|---|---|:--:|---|
| `POST` | `/api/sync/trigger` | ✅ JWT | Enqueue a sync for the current user. Returns `{ jobId }` immediately. |
| `POST` | `/api/sync/run-all` | ✅ `CRON_SECRET` | Fan out one sync job per connected user. Returns `{ users, submitted }` without waiting for them to finish. |

`/api/sync/run-all` is guarded by a shared secret rather than a JWT, because the caller is a
scheduler with no user. It sends `Authorization: Bearer <CRON_SECRET>` (or `X-Cron-Secret`) and is
compared in constant time. If `CRON_SECRET` is unset the endpoint refuses every request rather than
running open.

## Data

| Method | Endpoint | Auth | Description |
|---|---|:--:|---|
| `GET` | `/api/activity?limit=50` | ✅ | Recent activity, newest first. `limit` caps at 100. |
| `GET` | `/api/analytics/summary?days=30` | ✅ | Full analytics summary. `days` accepts 1–365, defaults to 30. |

## Health

| Method | Endpoint | Auth | Description |
|---|---|:--:|---|
| `GET` | `/health` | — | Liveness. Performs **no** I/O — see [DEPLOYMENT.md](DEPLOYMENT.md). |
| `GET` | `/health/ready` | — | Readiness. Checks Postgres and Redis, returns 503 with a per-dependency breakdown when either is down. |

---

## Example — `GET /api/analytics/summary?days=30`

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

`null` for a platform means **not connected**. A connected platform that has never synced returns a
zeroed block with `asOf: null`. See [ARCHITECTURE.md](ARCHITECTURE.md) for the reasoning.
