import { Queue } from "bullmq";
import redis from "../lib/redis.js";

export const SYNC_QUEUE_NAME = "devpulse-sync";

const syncQueue = new Queue(SYNC_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
      count: 5000,
    },
  },
});

export default syncQueue;