import { BaseAdapter } from "./base.adapter.js"

import { http } from "../utils/http.js"

import { withRetry } from "../utils/retry.js"



export class LeetcodeAdapter extends BaseAdapter {

  async fetch(username) {
    const normalizedUsername = username?.trim()

    if (!normalizedUsername) {
      throw new Error("LeetCode username is required")
    }

    const query = `
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username

    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }

    profile {
      ranking
      reputation
    }
  }
}
`
    try {
      const response = await withRetry(() =>
        http.post(
          "https://leetcode.com/graphql",
          {
            query,
            variables: {
              username: normalizedUsername
            }
          }
        )
      )

      const errors = response.data?.errors
      const user = response.data?.data?.matchedUser

      if (errors?.length) {
        const message = errors.map((error) => error.message).join(", ")

        const graphqlError = new Error(message)

        // LeetCode reports an unknown username as a GraphQL error over HTTP 200,
        // so it must be re-classified as a client error.
        if (/does not exist|not found/i.test(message)) {
          graphqlError.statusCode = 404
        }

        throw graphqlError
      }

      if (!user) {
        const notFound = new Error(
          `LeetCode user "${normalizedUsername}" was not found`
        )

        notFound.statusCode = 404

        throw notFound
      }

      return {

  platform: "leetcode",

  profile: {

    username: user.username,

    ranking: user.profile.ranking,

    reputation: user.profile.reputation,

  },

        solvedStats: user.submitStats?.acSubmissionNum ?? []
      }
    } catch (error) {
      console.error("LeetCode fetch failed:", error.message)
      throw error
    }
  }
}
