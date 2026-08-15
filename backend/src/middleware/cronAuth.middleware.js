import crypto from "crypto"
import { env } from "../config/env.js"

// Equal-length buffers for timingSafeEqual, without leaking the secret's length.
const digest = (value) => crypto.createHash("sha256").update(value).digest()

const cronAuth = (req, res, next) => {
  // Unset secret must deny, never open.
  if (!env.CRON_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Cron endpoint is not configured"
    })
  }

  const header = req.get("authorization") || ""
  const provided = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.get("x-cron-secret")

  if (!provided || !crypto.timingSafeEqual(digest(provided), digest(env.CRON_SECRET))) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  next()
}

export default cronAuth
