import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import VizTooltip from "./VizTooltip"
import {
  AXIS_PROPS,
  BAR_RADIUS_HORIZONTAL,
  GRID_PROPS,
  MAX_BAR_SIZE
} from "./vizChrome"

/**
 * Horizontal bars for nominal categories — event types, repo names.
 *
 * One colour for every bar: these have no natural order, and a value ramp would
 * double-encode length as hue. See DifficultyBarChart for the ordered case that
 * does earn a ramp. Horizontal because the labels are long.
 */
function CategoryBarChart({ data, valueSuffix, height = "chart-frame--short" }) {
  return (
    <div className={`chart-frame ${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
        >
          <CartesianGrid {...GRID_PROPS} vertical horizontal={false} />

          <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />

          <YAxis
            type="category"
            dataKey="label"
            {...AXIS_PROPS}
            width={132}
            interval={0}
          />

          <Tooltip
            content={<VizTooltip valueSuffix={valueSuffix} />}
            cursor={{ fill: "var(--accent-bg)" }}
          />

          <Bar
            dataKey="value"
            fill="var(--viz-series)"
            maxBarSize={MAX_BAR_SIZE}
            radius={BAR_RADIUS_HORIZONTAL}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryBarChart
