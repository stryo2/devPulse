import "dotenv/config"
import express from "express"
import authRoutes from "./routes/auth.routes.js"
import platformRoutes from "./routes/platform.routes.js"
import activityRoutes from "./routes/activity.routes.js"
import syncRoutes from "./routes/sync.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
import cors from "cors"

// Fail at boot rather than on the first request that needs one of these.
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "ENCRYPTION_KEY",
  "API_BASE_URL"
]

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
)

if (missingEnvVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingEnvVars.join(", ")
  )
  process.exit(1)
}

const app = express()
app.use(cors({
  origin: "http://localhost:5173"
}))
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/platforms", platformRoutes)
app.use("/api/activity", activityRoutes)
app.use("/api/sync", syncRoutes)
app.use("/api/analytics", analyticsRoutes)

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API Base URL: ${process.env.API_BASE_URL}`)
})
