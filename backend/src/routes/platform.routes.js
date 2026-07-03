import express from "express"
import {
  connectGithub,
  githubCallback,
  connectLeetcode,
  connectCodeforces
} from "../controllers/platform.controller.js"
import authenticate from "../middleware/auth.middleware.js"

const router = express.Router()

// Connect route requires authentication
router.get("/github/connect", authenticate, connectGithub)
router.post("/leetcode/connect", authenticate, connectLeetcode)
router.post("/codeforces/connect", authenticate, connectCodeforces)

// Callback route is public (GitHub redirects here)
router.get("/github/callback", githubCallback)

export default router