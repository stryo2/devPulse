import ChartCard from "./ChartCard"
import ContributionHeatmap from "./ContributionHeatmap"
import ActivityAreaChart from "./charts/ActivityAreaChart"
import CategoryBarChart from "./charts/CategoryBarChart"
import { EmptyState } from "./StateViews"
import { formatDayLong } from "./charts/vizChrome"

const TYPE_LABELS = {
  push: "Pushes",
  pull_request: "Pull requests",
  issue: "Issues",
  star: "Stars"
}

function GithubPanel({ github, days, onSync, isSyncing }) {
  if (!github) {
    return null
  }

  if (github.totalEvents === 0) {
    return (
      <EmptyState
        title="No GitHub activity in this range"
        action={
          onSync ? (
            <button
              type="button"
              className="btn"
              onClick={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing…" : "Sync now"}
            </button>
          ) : null
        }
      >
        Try a wider range, or run a sync to pull in recent events.
      </EmptyState>
    )
  }

  const byType = Object.entries(github.byType)
    .map(([type, value]) => ({ label: TYPE_LABELS[type] ?? type, value }))
    .sort((a, b) => b.value - a.value)

  const repos = github.repos.map((entry) => ({
    label: entry.repo,
    value: entry.count
  }))

  return (
    <>
      <div className="chart-grid chart-grid--full">
        <ChartCard
          title="Contribution calendar"
          subtitle={`${github.totalEvents} events over ${days} days · UTC`}
          note={
            github.reposTruncated
              ? "Repository list truncated at 100 entries."
              : undefined
          }
          tableColumns={["Date", "Events"]}
          tableRows={github.daily
            .filter((day) => day.count > 0)
            .map((day) => [formatDayLong(day.date), day.count])}
        >
          <ContributionHeatmap daily={github.daily} />
        </ChartCard>
      </div>

      <div className="chart-grid stack-sm">
        <ChartCard
          title="Daily activity"
          subtitle="Events per day"
          tableColumns={["Date", "Events"]}
          tableRows={github.daily.map((day) => [
            formatDayLong(day.date),
            day.count
          ])}
        >
          <ActivityAreaChart data={github.daily} />
        </ChartCard>

        <ChartCard
          title="Activity by type"
          subtitle="Events in range"
          tableColumns={["Type", "Events"]}
          tableRows={byType.map((row) => [row.label, row.value])}
        >
          <CategoryBarChart data={byType} valueSuffix="events" />
        </ChartCard>
      </div>

      {repos.length ? (
        <div className="chart-grid chart-grid--full stack-sm">
          <ChartCard
            title="Most active repositories"
            subtitle="Events in range"
            tableColumns={["Repository", "Events"]}
            tableRows={repos.map((row) => [row.label, row.value])}
          >
            <CategoryBarChart
              data={repos.slice(0, 8)}
              valueSuffix="events"
              height={repos.length > 4 ? "" : "chart-frame--short"}
            />
          </ChartCard>
        </div>
      ) : null}
    </>
  )
}

export default GithubPanel
