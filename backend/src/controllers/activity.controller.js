import prisma from "../lib/prisma.js"

export const listActivity = async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100)

    const activities = await prisma.activitySnapshot.findMany({
      where: {
        userId
      },
      orderBy: {
        timestamp: "desc"
      },
      take: limit
    })

    return res.status(200).json({
      success: true,
      data: activities.map((activity) => ({
        id: activity.id,
        date: activity.timestamp,
        platform: activity.platform,
        type: activity.activityType,
        count: activity.metadata?.solvedCount ?? 1
      }))
    })
  } catch (error) {
    console.error("Activity list error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to load activity"
    })
  }
}