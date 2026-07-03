import bcrypt from "bcrypt"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"

export const registerUser = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const error = new Error("Email already exists")
      error.code = "P2002"
      throw error
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    })

    // Generate token
    const token = generateToken(user.id)

    console.log("User registered successfully:", email)

    return {
      user: {
        id: user.id,
        email: user.email
      },
      token
    }
  } catch (error) {
    console.error("Registration error:", error.message)
    throw error
  }
}

export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured")
  }

  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  return token
}

export const loginUser = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error("Invalid credentials")
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordCorrect) {
      throw new Error("Invalid credentials")
    }

    // Generate token
    const token = generateToken(user.id)

    console.log("User logged in successfully:", email)

    return {
      token,
      user: {
        id: user.id,
        email: user.email
      }
    }
  } catch (error) {
    console.error("Login error:", error.message)
    throw error
  }
}