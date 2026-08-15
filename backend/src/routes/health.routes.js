import { Router } from "express"
import prisma from "../lib/prisma.js"
import redis from "../lib/redis.js"

const router = Router()

// No I/O on purpose: a query here would keep Neon awake and burn its CU quota.
router.get("/", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() })
})

const withTimeout = (promise, ms) => {
  let timer

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("timed out")), ms)
    })
  ]).finally(() => clearTimeout(timer))
}

const check = async (run) => {
  try {
    await withTimeout(run(), 3000)
    return "up"
  } catch (error) {
    return `down: ${error.message}`
  }
}

router.get("/ready", async (req, res) => {
  const [database, cache] = await Promise.all([
    check(() => prisma.$queryRaw`SELECT 1`),
    check(() => redis.ping())
  ])

  const ready = database === "up" && cache === "up"

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "degraded",
    database,
    redis: cache
  })
})

export default router
