import { syncUserActivity } from "../services/sync.service.js"

export const triggerSync = async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const result = await syncUserActivity(userId)

    return res.status(200).json({
      success: true,
      message: "Sync triggered successfully",
      ...result
    })
  } catch (error) {
    console.error("Sync trigger error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Sync failed"
    })
  }
}