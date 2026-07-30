import syncQueue from "./sync.queue.js"

// Fixed id keeps `upsertJobScheduler` idempotent: restarts, redeploys and extra
// worker replicas all converge on this one scheduler entry.
export const SYNC_SCHEDULER_ID = "devpulse-sync-all"

export const SYNC_ALL_JOB_NAME = "sync-all"

const DEFAULT_CRON = "0 */6 * * *"
const DEFAULT_TIMEZONE = "UTC"

export const isScheduleEnabled = () =>
  (process.env.SYNC_SCHEDULE_ENABLED ?? "true").toLowerCase() !== "false"

/**
 * Registers (or removes) the repeatable job that fans out per-user syncs.
 *
 * When disabled it actively removes the scheduler rather than skipping
 * registration — otherwise flipping the flag off would leave a live scheduler in
 * Redis and appear to do nothing.
 */
export const registerSyncSchedule = async () => {
  if (!isScheduleEnabled()) {
    await syncQueue.removeJobScheduler(SYNC_SCHEDULER_ID)

    console.log("Scheduled syncs disabled; scheduler removed")

    return null
  }

  const pattern = process.env.SYNC_SCHEDULE_CRON || DEFAULT_CRON
  const tz = process.env.SYNC_SCHEDULE_TIMEZONE || DEFAULT_TIMEZONE

  try {
    await syncQueue.upsertJobScheduler(
      SYNC_SCHEDULER_ID,
      { pattern, tz },
      { name: SYNC_ALL_JOB_NAME }
    )
  } catch (error) {
    // Crash rather than run a worker that silently never schedules anything —
    // that failure is far harder to notice.
    console.error(
      `Invalid sync schedule (SYNC_SCHEDULE_CRON="${pattern}", timezone="${tz}"):`,
      error.message
    )

    process.exit(1)
  }

  console.log(`Scheduled syncs registered: "${pattern}" (${tz})`)

  return { pattern, tz }
}
