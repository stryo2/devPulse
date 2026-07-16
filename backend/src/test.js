import "dotenv/config";
import syncQueue from "./queues/sync.queue.js";
import redis from "./lib/redis.js";

async function testQueue() {
  let exitCode = 0;

  try {
    console.log("Adding test sync job...");

    const job = await syncQueue.add("sync-user", {
      userId: "test-user-123",
    });

    console.log("✅ Job added successfully!");
    console.log("Job ID:", job.id);
    console.log("Job name:", job.name);
    console.log("Job data:", job.data);
  } catch (error) {
    console.error("❌ Failed to add job:", error);

    exitCode = 1;
  } finally {
    await syncQueue.close();
    await redis.quit();

    process.exit(exitCode);
  }
}

testQueue();