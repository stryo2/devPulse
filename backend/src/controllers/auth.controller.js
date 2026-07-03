import { registerUser } from "../services/auth.service.js"
import { loginUser } from "../services/auth.service.js"
import { loginSchema, registerSchema } from "../validators/auth.validator.js"

export const register = async (req, res) => {
  try {
    registerSchema.parse(req.body)
    const { email, password } = req.body

    const result = await registerUser(email, password)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result
    })
  } catch (error) {
    console.error("Register endpoint error:", error.message)
    
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      })
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const login = async (req, res) => {
  try {
    loginSchema.parse(req.body)
    const { email, password } = req.body

    const result = await loginUser(email, password)

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result
    })
  } catch (error) {
    console.error("Login endpoint error:", error.message)

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      })
    }
    
    res.status(401).json({
      success: false,
      message: error.message
    })
  }
}

export const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    res.status(200).json({
      success: true,
      user: req.user
    })
  } catch (error) {
    console.error("Me endpoint error:", error.message)
    
    res.status(500).json({
      success: false,
      message: "Failed to get user info"
    })
  }
}