import express from "express"
import {
  connectGithub,
  githubCallback
} from "../controllers/platform.controller.js"
import authenticate from "../middleware/auth.middleware.js"

const router = express.Router()

// Connect route requires authentication
router.get("/github/connect", authenticate,connectGithub)

// Callback route is public (GitHub redirects here)
router.get("/github/callback", githubCallback)

export default router