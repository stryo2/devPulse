import bcrypt from "bcrypt"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"

export const registerUser = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Mirrors Prisma's unique-violation code so the controller can map both
      // this and a race-lost insert to the same response.
      const error = new Error("Email already exists")
      error.code = "P2002"
      throw error
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    })

    const token = generateToken(user.id)

    console.log("User registered successfully:", user.id)

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
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Same message for unknown email and wrong password, so the response can't
    // be used to enumerate registered addresses.
    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordCorrect) {
      throw new Error("Invalid credentials")
    }

    const token = generateToken(user.id)

    console.log("User logged in successfully:", user.id)

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