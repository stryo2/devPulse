import { Worker } from "bullmq";
import redis from "../lib/redis.js";
import { env } from "../config/env.js";
import { SYNC_QUEUE_NAME } from "../queues/sync.queue.js";
import { SYNC_ALL_JOB_NAME } from "../queues/sync.scheduler.js";
import {
  syncUserActivity,
  enqueueScheduledSyncs,
} from "../services/sync.service.js";

export const processSyncJob = async (job) => {
  // The scheduled tick carries no userId — it fans out into per-user jobs that
  // re-enter through the branch below.
  if (job.name === SYNC_ALL_JOB_NAME) {
    const { users, submitted } = await enqueueScheduledSyncs();

    console.log(
      `Scheduled sync fan-out: submitted ${submitted} job(s) for ${users} user(s)`
    );

    return;
  }

  // Return rather than throw: an unrecognised job is a routing mistake, and
  // retrying it cannot fix that.
  if (job.name !== "sync-user") {
    console.warn(`Ignoring unrecognised job name: ${job.name}`);

    return;
  }

  console.log(`Processing sync for ${job.data.userId}`);

  await syncUserActivity(job.data.userId);

  console.log("Sync completed");
};

let worker = null;

export const createSyncWorker = () => {
  if (worker) {
    return worker;
  }

  worker = new Worker(SYNC_QUEUE_NAME, processSyncJob, {
    connection: redis,
    concurrency: env.SYNC_WORKER_CONCURRENCY,
    // An idle worker blocks on Redis for drainDelay seconds at a time. The
    // default of 5 costs ~518k commands/month, over Upstash's free quota by
    // itself. Queued jobs still wake it immediately, so this adds no latency.
    drainDelay: 60,
    stalledInterval: 300000,
  });

  worker.on("ready", () => {
    console.log(`Sync worker is listening on queue: ${SYNC_QUEUE_NAME}`);
  });

  worker.on("error", (error) => {
    console.error("Sync worker error:", error);
  });

  worker.on("failed", (job, error) => {
    console.error("Sync job failed", {
      id: job?.id,
      name: job?.name,
      error: error.message,
    });
  });

  return worker;
};

export const closeSyncWorker = async () => {
  if (!worker) {
    return;
  }

  await worker.close();
  worker = null;
};
