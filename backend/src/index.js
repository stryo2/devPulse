import { env } from "./config/env.js"
import express from "express"
import authRoutes from "./routes/auth.routes.js"
import platformRoutes from "./routes/platform.routes.js"
import activityRoutes from "./routes/activity.routes.js"
import syncRoutes from "./routes/sync.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
import healthRoutes from "./routes/health.routes.js"
import prisma from "./lib/prisma.js"
import redis from "./lib/redis.js"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { notFound, errorHandler } from "./middleware/error.middleware.js"
import { createSyncWorker, closeSyncWorker } from "./workers/sync.processor.js"

const app = express()

app.use(helmet())

// Render terminates TLS upstream, so req.ip/req.protocol come from X-Forwarded-*.
app.set("trust proxy", 1)

const isAllowedOrigin = (origin) =>
  env.CORS_ORIGINS.includes(origin) ||
  Boolean(env.CORS_PREVIEW_PATTERN?.test(origin))

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
}))

app.use(morgan(env.isProduction ? "combined" : "dev"))

const PORT = env.PORT

app.use(express.json({ limit: "100kb" }))

app.use("/api/auth", authRoutes)
app.use("/api/platforms", platformRoutes)
app.use("/api/activity", activityRoutes)
app.use("/api/sync", syncRoutes)
app.use("/api/analytics", analyticsRoutes)

app.use("/health", healthRoutes)

app.use(notFound)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API Base URL: ${process.env.API_BASE_URL}`)
})

// For hosts without a separate worker process. GitHub Actions owns scheduling.
if (env.RUN_WORKER_IN_PROCESS) {
  createSyncWorker()
}

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down...`)

  setTimeout(() => {
    console.error("Shutdown timed out, forcing exit")
    process.exit(1)
  }, 10000).unref()

  try {
    await new Promise((resolve) => server.close(resolve))
    await closeSyncWorker()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  } catch (error) {
    console.error("Failed to shut down cleanly:", error.message)
    process.exit(1)
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
