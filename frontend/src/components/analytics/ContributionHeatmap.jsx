import { useMemo } from "react"
import { formatDayLong, parseUtcDate } from "./charts/vizChrome"

const CELL = 12
const GAP = 3
const STEP = CELL + GAP
const WEEKDAY_LABEL_WIDTH = 26
const MONTH_LABEL_HEIGHT = 16

// Level 0 sits outside the ramp on a neutral token, so "no activity" never reads
// as a low value.
const LEVELS = [
  "var(--viz-heat-0)",
  "var(--viz-heat-1)",
  "var(--viz-heat-2)",
  "var(--viz-heat-3)",
  "var(--viz-heat-4)"
]

// Bucketed against the window's own maximum, so a quiet month still uses the
// full ramp instead of flattening into one shade.
const levelFor = (count, max) => {
  if (count <= 0) {
    return 0
  }

  if (max <= 1) {
    return 4
  }

  const ratio = count / max

  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/**
 * Calendar grid: columns are weeks, rows are weekdays.
 *
 * Hand-rolled rather than Recharts because there is no axis to scale — x is a
 * week index and y is a weekday.
 */
function ContributionHeatmap({ daily }) {
  const { columns, monthLabels, max, total } = useMemo(() => {
    if (!daily?.length) {
      return { columns: [], monthLabels: [], max: 0, total: 0 }
    }

    const maxCount = daily.reduce((peak, day) => Math.max(peak, day.count), 0)
    const sum = daily.reduce((acc, day) => acc + day.count, 0)

    // Pad the first week so the grid starts on the correct weekday.
    const leadingBlanks = parseUtcDate(daily[0].date).getUTCDay()
    const cells = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...daily
    ]

    const weeks = []
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7))
    }

    // One label per month, placed on the week where that month first appears.
    const labels = []
    let lastMonth = null

    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(Boolean)

      if (!firstDay) {
        return
      }

      const date = parseUtcDate(firstDay.date)
      const month = date.getUTCMonth()

      if (month !== lastMonth) {
        lastMonth = month
        labels.push({
          x: weekIndex * STEP,
          text: date.toLocaleDateString(undefined, {
            month: "short",
            timeZone: "UTC"
          })
        })
      }
    })

    return { columns: weeks, monthLabels: labels, max: maxCount, total: sum }
  }, [daily])

  if (!columns.length) {
    return null
  }

  const width = WEEKDAY_LABEL_WIDTH + columns.length * STEP
  const height = MONTH_LABEL_HEIGHT + 7 * STEP

  return (
    <div>
      <div className="heatmap">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Contribution calendar: ${total} events across ${daily.length} days`}
        >
          {monthLabels.map((label) => (
            <text
              key={`${label.text}-${label.x}`}
              x={WEEKDAY_LABEL_WIDTH + label.x}
              y={11}
              fontSize={11}
              fill="var(--viz-muted)"
            >
              {label.text}
            </text>
          ))}

          {["Mon", "Wed", "Fri"].map((day, index) => (
            <text
              key={day}
              x={0}
              y={MONTH_LABEL_HEIGHT + (index * 2 + 1) * STEP + CELL - 2}
              fontSize={11}
              fill="var(--viz-muted)"
            >
              {day}
            </text>
          ))}

          {columns.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return null
              }

              return (
                <rect
                  key={day.date}
                  x={WEEKDAY_LABEL_WIDTH + weekIndex * STEP}
                  y={MONTH_LABEL_HEIGHT + dayIndex * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={LEVELS[levelFor(day.count, max)]}
                >
                  {/* Native title so assistive tech reaches the value too. */}
                  <title>{`${formatDayLong(day.date)}: ${day.count} event${
                    day.count === 1 ? "" : "s"
                  }`}</title>
                </rect>
              )
            })
          )}
        </svg>
      </div>

      <div className="heatmap__legend">
        <span className="heatmap__legend-label">Less</span>
        {LEVELS.map((level, index) => (
          <span
            key={index}
            className={`heatmap__legend-swatch heatmap__legend-swatch--${index}`}
            aria-hidden="true"
          />
        ))}
        <span className="heatmap__legend-label">More</span>
      </div>
    </div>
  )
}

export default ContributionHeatmap
