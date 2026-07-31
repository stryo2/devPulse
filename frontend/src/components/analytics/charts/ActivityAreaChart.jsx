import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import VizTooltip from "./VizTooltip"
import {
  AXIS_PROPS,
  GRID_PROPS,
  formatDayLong,
  formatDayShort
} from "./vizChrome"

// Single series, so no legend — the card title already names what is plotted.
function ActivityAreaChart({ data }) {
  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="date"
            {...AXIS_PROPS}
            tickFormatter={formatDayShort}
            minTickGap={32}
          />

          <YAxis {...AXIS_PROPS} allowDecimals={false} width={44} />

          <Tooltip
            content={<VizTooltip labelFormatter={formatDayLong} valueSuffix="events" />}
            cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--viz-series)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="var(--viz-series)"
            fillOpacity={0.1}
            dot={false}
            // Surface ring keeps the hover marker legible where it crosses the
            // line, and counts toward the hit target.
            activeDot={{
              r: 4,
              fill: "var(--viz-series)",
              stroke: "var(--card-bg)",
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityAreaChart
