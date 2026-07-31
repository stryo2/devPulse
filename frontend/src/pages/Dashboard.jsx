import ConnectPlatforms from "./ConnectPlatforms"
import ActivityTable from "../components/ActivityTable"
import AnalyticsPanel from "../components/analytics/AnalyticsPanel"
import ThemeToggle from "../components/ThemeToggle"
import http from "../api/http"
import { useCallback, useEffect, useRef, useState } from "react"
import "../styles/dashboard.css"

// A sync is queued, not immediate, and there is no job-status endpoint yet — so
// the page re-reads a few times rather than guessing one delay.
const REFRESH_DELAYS_MS = [1500, 4000, 8000, 12000]

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  // Bumping this re-runs every data read on the page.
  const [refreshKey, setRefreshKey] = useState(0)
  const timersRef = useRef([])

  const refreshNow = useCallback(() => setRefreshKey((key) => key + 1), [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // Pending timers must not fire into an unmounted page.
  useEffect(() => clearTimers, [clearTimers])

  const triggerSync = async () => {

    try {
      setLoading(true)
      setError("")
      setNotice("")

      await http.post("/sync/trigger", {})

      setNotice("Sync queued. This page will update as data arrives.")

      clearTimers()
      timersRef.current = REFRESH_DELAYS_MS.map((delay) =>
        setTimeout(refreshNow, delay)
      )

    } catch (error) {

      setError(error.response?.data?.message || "Sync failed")

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">

      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">DevPulse</h1>
          <div className="dashboard__subtitle">
            Your developer activity across GitHub, LeetCode and Codeforces
          </div>
        </div>

        <div className="dashboard__actions">
          <ThemeToggle />

          <button
            type="button"
            className="btn btn--primary"
            onClick={triggerSync}
            disabled={loading}
          >
            {loading ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="notice">{notice}</div> : null}

      <AnalyticsPanel
        refreshKey={refreshKey}
        onSync={triggerSync}
        isSyncing={loading}
      />

      {/* A connect changes what the analytics endpoint returns, so re-read. */}
      <ConnectPlatforms onConnected={refreshNow} />

      <ActivityTable refreshKey={refreshKey} />

    </div>
  )
}

export default Dashboard
