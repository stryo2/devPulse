import { useState } from "react"
import GithubPanel from "./GithubPanel"
import LeetcodePanel from "./LeetcodePanel"
import RangeFilter from "./RangeFilter"
import StatTile from "./StatTile"
import { EmptyState, ErrorState, Skeleton } from "./StateViews"
import { useAnalytics } from "../../hooks/useAnalytics"
import { splitSolved } from "../../lib/leetcode"

const ACCENT = {
  github: "var(--viz-github)",
  leetcode: "var(--viz-leetcode)",
  codeforces: "var(--viz-codeforces)"
}

const NOT_CONNECTED = "Not connected"
const NEVER_SYNCED = "Connected — not synced yet"

// `asOf: null` means connected but never synced. Without this the tile would
// read "0 problems solved" — a claim about the user, not about missing data.
const isUnsynced = (block) => Boolean(block) && block.asOf === null

function AnalyticsPanel({ refreshKey = 0, onSync, isSyncing }) {
  const [days, setDays] = useState(30)
  const { data, error, refetch, isInitialLoad, isRefreshing } = useAnalytics(
    days,
    refreshKey
  )

  const syncButton = onSync ? (
    <button
      type="button"
      className="btn btn--primary"
      onClick={onSync}
      disabled={isSyncing}
    >
      {isSyncing ? "Syncing…" : "Sync now"}
    </button>
  ) : null

  const body = () => {
    if (isInitialLoad) {
      return (
        <>
          <div className="kpi-grid stack-lg">
            <Skeleton variant="tile" count={4} />
          </div>
          <div className="chart-grid chart-grid--full stack-sm">
            <Skeleton variant="chart" />
          </div>
        </>
      )
    }

    if (error) {
      return (
        <div className="stack-lg">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )
    }

    if (!data) {
      return null
    }

    const { github, leetcode, codeforces, connectedPlatforms } = data

    if (!connectedPlatforms.length) {
      return (
        <div className="stack-lg">
          <EmptyState title="No platforms connected yet">
            Connect GitHub, LeetCode or Codeforces below, then run a sync to see
            your analytics here.
          </EmptyState>
        </div>
      )
    }

    const solved = splitSolved(leetcode?.current)
    const solvedInRange = splitSolved(leetcode?.solvedInWindow)

    const nothingSyncedYet =
      (!github || github.totalEvents === 0) &&
      (!leetcode || isUnsynced(leetcode)) &&
      (!codeforces || isUnsynced(codeforces))

    // A breakdown, not a sum: events, solved problems and a rating are three
    // different units.
    const breakdown = [
      {
        label: "GitHub events",
        accent: ACCENT.github,
        value: github ? github.totalEvents : "—"
      },
      {
        label: "LeetCode solved",
        accent: ACCENT.leetcode,
        value: leetcode && !isUnsynced(leetcode) ? solved.total : "—"
      },
      {
        label: "Codeforces rating",
        accent: ACCENT.codeforces,
        value: codeforces?.current?.rating ?? "—"
      }
    ]

    return (
      <div className={isRefreshing ? "is-refreshing" : undefined}>
        {nothingSyncedYet ? (
          <div className="notice">
            Your platforms are connected, but no activity has been pulled in yet.
            Run a sync to populate this dashboard.
            {syncButton ? (
              <div className="notice__action">{syncButton}</div>
            ) : null}
          </div>
        ) : null}

        <div className="kpi-grid stack-lg">
          <StatTile
            label="GitHub"
            accent={ACCENT.github}
            value={github ? github.totalEvents : null}
            meta={github ? `events in the last ${days} days` : NOT_CONNECTED}
          />

          <StatTile
            label="LeetCode"
            accent={ACCENT.leetcode}
            value={leetcode && !isUnsynced(leetcode) ? solved.total : null}
            delta={
              leetcode && !isUnsynced(leetcode) ? solvedInRange.total : undefined
            }
            deltaLabel={`in the last ${days} days`}
            meta={
              !leetcode
                ? NOT_CONNECTED
                : isUnsynced(leetcode)
                  ? NEVER_SYNCED
                  : "problems solved"
            }
          />

          <StatTile
            label="Codeforces"
            accent={ACCENT.codeforces}
            value={codeforces?.current?.rating ?? null}
            delta={codeforces?.ratingChangeInWindow ?? undefined}
            deltaLabel={`in the last ${days} days`}
            meta={
              !codeforces
                ? NOT_CONNECTED
                : isUnsynced(codeforces)
                  ? NEVER_SYNCED
                  : `${codeforces.current.rank ?? "unrated"} · peak ${
                      codeforces.current.maxRating ?? "—"
                    }`
            }
          />

          <StatTile
            label="Platforms"
            value={connectedPlatforms.length}
            meta="of 3 connected"
            breakdown={breakdown}
          />
        </div>

        <div className="stack-sm">
          <GithubPanel
            github={github}
            days={days}
            onSync={onSync}
            isSyncing={isSyncing}
          />
        </div>

        <div className="stack-sm">
          <LeetcodePanel leetcode={leetcode} days={days} />
        </div>
      </div>
    )
  }

  return (
    <section className="dashboard__section">
      <h2 className="dashboard__section-title">Analytics</h2>

      <RangeFilter value={days} onChange={setDays} disabled={isInitialLoad} />

      {body()}
    </section>
  )
}

export default AnalyticsPanel
