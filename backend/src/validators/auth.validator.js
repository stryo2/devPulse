import { z } from "zod"

export const registerSchema = z.object({
  email: z
    .string("Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters")
})

export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  password: z.string("Password is required")
})