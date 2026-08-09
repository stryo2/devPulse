// Imported first by every entrypoint so bad config fails at boot, not mid-request.
import "dotenv/config"

const REQUIRED = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "ENCRYPTION_KEY",
  "API_BASE_URL"
]

const problems = REQUIRED.filter((name) => !process.env[name]).map(
  (name) => `${name} is missing`
)

const encryptionKey = process.env.ENCRYPTION_KEY

if (encryptionKey && !/^[0-9a-f]{64}$/i.test(encryptionKey)) {
  problems.push(
    `ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${encryptionKey.length}`
  )
}

// REDIS_HOST/REDIS_PORT are the local fallback; managed providers give one URL.
const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${
    process.env.REDIS_PORT || 6379
  }`

// Host alone is safe to log; the URL carries the password.
let redisHostPort = ""

try {
  redisHostPort = new URL(redisUrl).host
} catch {
  problems.push("REDIS_URL is not a valid URL (expected redis:// or rediss://)")
}

const corsOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

// Vercel gives every preview deploy a fresh URL, so exact origins aren't enough.
let corsPreviewPattern = null

if (process.env.CORS_PREVIEW_PATTERN) {
  try {
    corsPreviewPattern = new RegExp(process.env.CORS_PREVIEW_PATTERN)
  } catch {
    problems.push("CORS_PREVIEW_PATTERN is not a valid regular expression")
  }
}

if (problems.length > 0) {
  console.error("Invalid environment configuration:")

  for (const problem of problems) {
    console.error(`  - ${problem}`)
  }

  process.exit(1)
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
  ENCRYPTION_KEY: encryptionKey,
  REDIS_URL: redisUrl,
  REDIS_HOST_PORT: redisHostPort,
  CORS_ORIGINS: corsOrigins,
  CORS_PREVIEW_PATTERN: corsPreviewPattern,
  // Render's free tier has no background worker service, so the API can host it.
  RUN_WORKER_IN_PROCESS: process.env.RUN_WORKER_IN_PROCESS === "true",
  SYNC_WORKER_CONCURRENCY: Number(process.env.SYNC_WORKER_CONCURRENCY) || 5,
  CRON_SECRET: process.env.CRON_SECRET || null,
  isProduction: process.env.NODE_ENV === "production"
})
