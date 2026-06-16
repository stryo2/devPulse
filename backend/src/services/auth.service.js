import bcrypt from "bcrypt"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"

export const registerUser = async (email, password) => {

  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (existingUser) {
    throw new Error("User already exists")
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  })

  return user
}

export const generateToken = (userId) => {

  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  return token
}
export const loginUser = async (email, password) => {

  // find user
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (!user) {
    throw new Error("Invalid credentials")
  }

  // compare passwords
  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  )

  if (!isPasswordCorrect) {
    throw new Error("Invalid credentials")
  }

  // generate token
  const token = generateToken(user.id)

  return {
    token,
    user
  }

}