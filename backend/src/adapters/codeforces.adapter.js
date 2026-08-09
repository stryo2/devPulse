import { BaseAdapter } from "./base.adapter.js"

import { http } from "../utils/http.js"

import { withRetry } from "../utils/retry.js"



export class CodeforcesAdapter extends BaseAdapter {

  async fetch(username) {
    const normalizedUsername = username?.trim()

    if (!normalizedUsername) {
      throw new Error("Codeforces username is required")
    }

    try {

      const response = await withRetry(() =>
        http.get(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(normalizedUsername)}`
        )
      )

      if (response.data?.status !== "OK" || !response.data?.result?.[0]) {
        const notFound = new Error(
          response.data?.comment ||
          `Codeforces user "${normalizedUsername}" was not found`
        )

        notFound.statusCode = 404

        throw notFound
      }

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

      // Codeforces answers an unknown handle with HTTP 400, so axios rejects
      // before the status check above can run.
      if (error.response?.status === 400) {

        const notFound = new Error(
          error.response.data?.comment ||
          `Codeforces user "${normalizedUsername}" was not found`
        )

        notFound.statusCode = 404

        console.log(notFound.message)

        throw notFound
      }

      console.error("Codeforces fetch failed:", error.message)

      throw error

    }
  }
}
