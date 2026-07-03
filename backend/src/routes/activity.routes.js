import express from "express"
import authenticate from "../middleware/auth.middleware.js"
import { listActivity } from "../controllers/activity.controller.js"

const router = express.Router()

router.get("/", authenticate, listActivity)

export default router