import prisma from "../lib/prisma.js"
import { GithubAdapter } from "../adapters/github.adapter.js"
import { LeetcodeAdapter } from "../adapters/leetcode.adapter.js"
import { CodeforcesAdapter } from "../adapters/codeforces.adapter.js"
import { normalizeGithubActivities } from "../normalizers/github.normalizer.js"
import { normalizeLeetcodeActivities } from "../normalizers/leetcode.normalizer.js"
import { normalizeCodeforcesActivities } from "../normalizers/codeforces.normalizer.js"
import { decryptStoredToken } from "../utils/crypto.js"
import syncQueue from "../queues/sync.queue.js"

const DEFAULT_FANOUT_BATCH_SIZE = 500

const fanoutBatchSize = () => {
  const configured = Number(process.env.SYNC_FANOUT_BATCH_SIZE)

  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_FANOUT_BATCH_SIZE
}

/**
 * Fans a scheduled tick out into one sync job per user with a connected
 * platform. The deduplication key caps each user at one active plus one waiting
 * job, so a slow sync can never overlap its own next run.
 */
export const enqueueScheduledSyncs = async () => {
  const connections = await prisma.connectedPlatform.findMany({
    distinct: ["userId"],
    select: { userId: true }
  })

  const batchSize = fanoutBatchSize()
  let submitted = 0

  for (let start = 0; start < connections.length; start += batchSize) {
    const batch = connections.slice(start, start + batchSize).map(({ userId }) => ({
      name: "sync-user",
      data: { userId, scheduled: true },
      opts: {
        deduplication: {
          id: `sync-user:${userId}`,
          keepLastIfActive: true
        }
      }
    }))

    await syncQueue.addBulk(batch)

    submitted += batch.length
  }

  // `submitted` is what was handed to the queue, not what it accepted —
  // deduplication silently collapses jobs for users who already have one pending.
  return { users: connections.length, submitted }
}

const github = new GithubAdapter()
const leetcode = new LeetcodeAdapter()
const codeforces = new CodeforcesAdapter()

export const syncUserActivity = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User id is required")
    }

    const connections = await prisma.connectedPlatform.findMany({
      where: { userId }
    })

    const results = await Promise.allSettled(
      connections.map(async (connection) => {
        if (connection.platform === "github") {
          const accessToken = decryptStoredToken(connection.accessToken)

          if (!accessToken) {
            console.warn(
              `No usable GitHub token for user ${userId}, falling back to unauthenticated request`
            )
          }

          return {
            platform: "github",
            data: await github.fetch(connection.username, accessToken)
          }
        }

        if (connection.platform === "leetcode") {
          return {
            platform: "leetcode",
            data: await leetcode.fetch(connection.username)
          }
        }

        if (connection.platform === "codeforces") {
          return {
            platform: "codeforces",
            data: await codeforces.fetch(connection.username)
          }
        }

        return null
      })
    )

    const activities = []

    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) {
        continue
      }

      const { platform, data } = result.value

      if (platform === "github") {
        activities.push(
          ...normalizeGithubActivities(data).map((activity) => ({
            ...activity,
            userId
          }))
        )
      }

      if (platform === "leetcode") {
        activities.push(
          ...normalizeLeetcodeActivities(data).map((activity) => ({
            ...activity,
            userId
          }))
        )
      }

      if (platform === "codeforces") {
        activities.push(
          ...normalizeCodeforcesActivities(data).map((activity) => ({
            ...activity,
            userId
          }))
        )
      }
    }

    if (activities.length > 0) {
      await prisma.activitySnapshot.createMany({
        data: activities,
        skipDuplicates: true
      })
    }

    return {
      success: true,
      totalActivities: activities.length,
      activities
    }
  } catch (error) {
    console.log(error.message)
    throw error
  }
}