import { computeUserAnalytics } from "../services/analytics.service.js"
import { summaryQuerySchema } from "../validators/analytics.validator.js"

export const getSummary = async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const { days } = summaryQuerySchema.parse(req.query)

    const data = await computeUserAnalytics(userId, { days })

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues
      })
    }

    console.error("Analytics summary error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to load analytics"
    })
  }
}
