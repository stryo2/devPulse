import syncQueue from "../queues/sync.queue.js";

export const triggerSync = async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const job = await syncQueue.add("sync-user", {
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Sync triggered successfully",
      jobId: job.id
    })
  } catch (error) {
    console.error("Sync trigger error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Sync failed"
    })
  }
}