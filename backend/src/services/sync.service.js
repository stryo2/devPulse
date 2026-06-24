import prisma from "../lib/prisma.js"



import { GithubAdapter }
from "../adapters/github.adapter.js"

import { LeetcodeAdapter }
from "../adapters/leetcode.adapter.js"

import { CodeforcesAdapter }
from "../adapters/codeforces.adapter.js"



import {
  normalizeGithubActivities
}
from "../normalizers/github.normalizer.js"

import {
  normalizeLeetcodeActivities
}
from "../normalizers/leetcode.normalizer.js"

import {
  normalizeCodeforcesActivities
}
from "../normalizers/codeforces.normalizer.js"



const github = new GithubAdapter()

const leetcode = new LeetcodeAdapter()

const codeforces = new CodeforcesAdapter()



export const syncUserActivity = async () => {

  try {

    const githubConnection =
  await prisma.connectedPlatform.findFirst({

    where: {
      platform: "github"
    }

  })
    // FETCH DATA FROM ALL PLATFORMS
    const results = await Promise.allSettled([

      github.fetch( githubConnection.username),

      leetcode.fetch("your_leetcode_username"),

      codeforces.fetch("tourist")

    ])



    let allActivities = []



    // GITHUB
    const githubResult = results[0]

    if (githubResult.status === "fulfilled") {

      const githubActivities =
        normalizeGithubActivities(
          githubResult.value
        )

      allActivities = [
        ...allActivities,
        ...githubActivities
      ]
    }



    // LEETCODE
    const leetcodeResult = results[1]

    if (leetcodeResult.status === "fulfilled") {

      const leetcodeActivities =
        normalizeLeetcodeActivities(
          leetcodeResult.value
        )

      allActivities = [
        ...allActivities,
        ...leetcodeActivities
      ]
    }



    // CODEFORCES
    const codeforcesResult = results[2]

    if (codeforcesResult.status === "fulfilled") {

      const codeforcesActivities =
        normalizeCodeforcesActivities(
          codeforcesResult.value
        )

      allActivities = [
        ...allActivities,
        ...codeforcesActivities
      ]
    }



    // SAVE TO DATABASE
    for (const activity of allActivities) {

      await prisma.activitySnapshot.create({

        data: activity

      })
    }



    return {

      success: true,

      totalActivities: allActivities.length,

      activities: allActivities

    }

  } catch (error) {

    console.log(error.message)

    throw error

  }
}