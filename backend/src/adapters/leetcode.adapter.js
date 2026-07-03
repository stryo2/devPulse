import { BaseAdapter } from "./base.adapter.js"

import { http } from "../utils/http.js"

import { withRetry } from "../utils/retry.js"



export class LeetcodeAdapter extends BaseAdapter {

  async fetch(username) {
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
const response = await withRetry(() =>
  http.post(
    "https://leetcode.com/graphql",
    {
      query,
      variables: {
        username
      }
    }
  )
)
const user = response.data.data.matchedUser
    try {
        return {

  platform: "leetcode",

  profile: {

    username: user.username,

    ranking: user.profile.ranking,

    reputation: user.profile.reputation,

  },

  solvedStats: user.submitStats.acSubmissionNum
      }

    } catch (error) {

      console.log(error.message)

      throw error

    }

  }
}