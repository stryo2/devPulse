import express from "express"
import authenticate from "../middleware/auth.middleware.js"
import { triggerSync } from "../controllers/sync.controller.js"

const router = express.Router()

router.post("/trigger", authenticate, triggerSync)

export default router