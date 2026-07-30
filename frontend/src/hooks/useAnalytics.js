import { useCallback, useEffect, useState } from "react"
import { fetchSummary } from "../api/analytics"

/**
 * Loads the analytics summary for a trailing window.
 *
 * Loading is derived, not stored: the hook is loading whenever the settled
 * request key differs from the one current props ask for. That keeps setState
 * out of the effect body and makes the flag impossible to desync from the data.
 *
 * `isInitialLoad` is distinct from `isRefreshing` because a skeleton is only
 * correct when nothing is on screen yet; a refetch dims the previous render
 * instead, so the layout never jumps.
 */
export const useAnalytics = (days, refreshKey = 0) => {
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState({ key: null, data: null, error: "" })

  // Folding `refreshKey` into the key makes an upstream refresh just another
  // request, with the same in-flight handling.
  const key = `${days}:${reloadToken}:${refreshKey}`
  const isLoading = settled.key !== key

  const refetch = useCallback(() => setReloadToken((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    fetchSummary(days, { signal: controller.signal })
      .then((summary) => setSettled({ key, data: summary, error: "" }))
      .catch((requestError) => {
        // An aborted request is a superseded range change, not a failure.
        if (requestError.name === "CanceledError" || controller.signal.aborted) {
          return
        }

        // Keep the last good data so a failed refresh doesn't blank the page.
        setSettled((previous) => ({
          key,
          data: previous.data,
          error:
            requestError.response?.data?.message || "Failed to load analytics"
        }))
      })

    return () => controller.abort()
  }, [days, reloadToken, refreshKey, key])

  return {
    data: settled.data,
    // Hide a stale error while a retry is in flight.
    error: isLoading ? "" : settled.error,
    refetch,
    isInitialLoad: isLoading && !settled.data,
    isRefreshing: isLoading && Boolean(settled.data)
  }
}
