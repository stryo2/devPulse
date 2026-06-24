import { BaseAdapter } from "./base.adapter.js"

import { http } from "../utils/http.js"

import { withRetry } from "../utils/retry.js"



export class CodeforcesAdapter extends BaseAdapter {

  async fetch(username) {

    try {

      const response = await withRetry(() =>
        http.get(
          `https://codeforces.com/api/user.info?handles=${username}`
        )
      )

      const user = response.data.result[0]

      return {

        platform: "codeforces",

        profile: {

          username: user.handle,

          rank: user.rank,

          rating: user.rating,

          maxRating: user.maxRating,

          contribution: user.contribution,

        }

      }

    } catch (error) {

      console.log(error.message)

      throw error

    }
  }
}