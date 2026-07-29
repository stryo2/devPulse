import { z } from "zod"

export const summaryQuerySchema = z.object({
  days: z.coerce
    .number("Days must be a number")
    .int("Days must be a whole number")
    .min(1, "Days must be at least 1")
    .max(365, "Days must be at most 365")
    .default(30)
})
