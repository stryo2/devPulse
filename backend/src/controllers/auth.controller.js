import { registerUser } from "../services/auth.service.js"
import { loginUser } from "../services/auth.service.js"
import { registerSchema } from "../validators/auth.validator.js"

export const register = async (req, res) => {

  try {
    registerSchema.parse(req.body)
    const { email, password } = req.body

    const user = await registerUser(email, password)

    res.status(201).json({
      success: true,
      user
    })

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    })

  }

}
export const login = async (req, res) => {

  try {

    const { email, password } = req.body

    const data = await loginUser(email, password)

    res.status(200).json({
      success: true,
      ...data
    })

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    })

  }

}

export const me = async (req, res) => {

  res.status(200).json({
    success: true,
    user: req.user
  })

}