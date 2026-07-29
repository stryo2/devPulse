import express from "express"
import authenticate from "../middleware/auth.middleware.js"
import { getSummary } from "../controllers/analytics.controller.js"

const router = express.Router()

router.get("/summary", authenticate, getSummary)

export default router
