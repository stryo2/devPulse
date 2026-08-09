import express from "express"
import authenticate from "../middleware/auth.middleware.js"
import cronAuth from "../middleware/cronAuth.middleware.js"
import { triggerSync, runAllSyncs } from "../controllers/sync.controller.js"

const router = express.Router()

router.post("/trigger", authenticate, triggerSync)

// Shared-secret, not JWT — the caller is a scheduler, not a user.
router.post("/run-all", cronAuth, runAllSyncs)

export default router