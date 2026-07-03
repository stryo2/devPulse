import prisma from "../lib/prisma.js"
import { GithubAdapter } from "../adapters/github.adapter.js"
import { LeetcodeAdapter } from "../adapters/leetcode.adapter.js"
import { CodeforcesAdapter } from "../adapters/codeforces.adapter.js"
import { normalizeGithubActivities } from "../normalizers/github.normalizer.js"
import { normalizeLeetcodeActivities } from "../normalizers/leetcode.normalizer.js"
import { normalizeCodeforcesActivities } from "../normalizers/codeforces.normalizer.js"

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
          return {
            platform: "github",
            data: await github.fetch(connection.username)
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