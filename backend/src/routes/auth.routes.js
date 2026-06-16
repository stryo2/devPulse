import express from "express"
import { register } from "../controllers/auth.controller.js"
import { login } from "../controllers/auth.controller.js"
import authenticate from "../middleware/auth.middleware.js"
import { me } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.get("/me", authenticate, me)

export default router