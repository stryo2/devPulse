import ChartCard from "./ChartCard"
import DifficultyBarChart from "./charts/DifficultyBarChart"
import { EmptyState } from "./StateViews"
import { splitSolved } from "../../lib/leetcode"

function LeetcodePanel({ leetcode, days }) {
  if (!leetcode) {
    return null
  }

  // splitSolved drops the "All" bucket; charting it beside Easy/Medium/Hard
  // would double-count.
  const { byDifficulty, total } = splitSolved(leetcode.current)
  const solvedInWindow = splitSolved(leetcode.solvedInWindow)

  if (!byDifficulty.length) {
    return (
      <EmptyState title="No LeetCode data yet">
        Run a sync to pull in your solved totals.
      </EmptyState>
    )
  }

  const data = byDifficulty.map((entry) => ({
    label: entry.difficulty,
    value: entry.count
  }))

  return (
    <div className="chart-grid chart-grid--full">
      <ChartCard
        title="LeetCode problems solved"
        subtitle={`${total} total · ${solvedInWindow.total} in the last ${days} days`}
        note={
          leetcode.partialWindow
            ? "No earlier snapshot exists, so the in-range figure is measured from zero and may cover less than the full range."
            : undefined
        }
        tableColumns={["Difficulty", "Solved", "In range"]}
        tableRows={byDifficulty.map((entry) => [
          entry.difficulty,
          entry.count,
          leetcode.solvedInWindow?.[entry.difficulty] ?? 0
        ])}
      >
        <DifficultyBarChart data={data} />
      </ChartCard>
    </div>
  )
}

export default LeetcodePanel
