import http from "./http"

/**
 * GET /api/analytics/summary → { window, connectedPlatforms, github, leetcode,
 * codeforces }. An unconnected platform is null, not an empty object.
 */
export const fetchSummary = async (days, { signal } = {}) => {
  const response = await http.get("/analytics/summary", {
    params: { days },
    signal
  })

  return response.data.data
}
