import Redis from "ioredis";
import { env } from "../config/env.js";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on("connect", () => {
  console.log(`Redis connected: ${env.REDIS_HOST_PORT}`);
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

export default redis;
