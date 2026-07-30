import express from "express"
import {
  connectGithub,
  githubCallback,
  connectLeetcode,
  connectCodeforces
} from "../controllers/platform.controller.js"
import authenticate from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/github/connect", authenticate, connectGithub)
router.post("/leetcode/connect", authenticate, connectLeetcode)
router.post("/codeforces/connect", authenticate, connectCodeforces)

// Public: GitHub redirects the browser here, so there is no Authorization
// header — the signed `state` param identifies the user instead.
router.get("/github/callback", githubCallback)

export default router