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
  // The scheduled tick has no userId; it fans out into per-user jobs.
  if (job.name === SYNC_ALL_JOB_NAME) {
    const { users, submitted } = await enqueueScheduledSyncs();

    console.log(
      `Scheduled sync fan-out: submitted ${submitted} job(s) for ${users} user(s)`
    );

    return;
  }

  // Return, not throw: retrying cannot fix a routing mistake.
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
    // Default 5s would exceed Upstash's free quota while idle.
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
