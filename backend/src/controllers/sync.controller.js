import syncQueue from "../queues/sync.queue.js";
import { enqueueScheduledSyncs } from "../services/sync.service.js";

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

/**
 * Fan-out entrypoint for an external scheduler. Returns as soon as the jobs are
 * queued — the caller must not wait for every user's platform APIs.
 */
export const runAllSyncs = async (req, res) => {
  try {
    const { users, submitted } = await enqueueScheduledSyncs()

    console.log(`Cron fan-out: submitted ${submitted} job(s) for ${users} user(s)`)

    return res.status(200).json({ success: true, users, submitted })
  } catch (error) {
    console.error("Cron fan-out error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Fan-out failed"
    })
  }
}