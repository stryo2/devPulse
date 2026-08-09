import "../config/env.js";
import redis from "../lib/redis.js";
import { registerSyncSchedule } from "../queues/sync.scheduler.js";
import { createSyncWorker, closeSyncWorker } from "./sync.processor.js";

createSyncWorker();

await registerSyncSchedule();

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down sync worker...`);

  try {
    await closeSyncWorker();
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
