import "dotenv/config";
import { Worker } from "bullmq";
import redis from "../lib/redis.js";
import { SYNC_QUEUE_NAME } from "../queues/sync.queue.js";
import { syncUserActivity } from "../services/sync.service.js";
const worker = new Worker(
  SYNC_QUEUE_NAME,
  async (job) => {
  console.log(`Processing sync for ${job.data.userId}`);

  await syncUserActivity(job.data.userId);

  console.log("Sync completed");
},
  {
    connection: redis,
    concurrency: 5,
  }
);

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

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down sync worker...`);

  try {
    await worker.close();
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error("Failed to shut down sync worker cleanly:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
