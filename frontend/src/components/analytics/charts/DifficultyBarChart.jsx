import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import VizTooltip from "./VizTooltip"
import {
  AXIS_PROPS,
  BAR_RADIUS_VERTICAL,
  GRID_PROPS,
  MAX_BAR_SIZE
} from "./vizChrome"

// Easy -> Medium -> Hard is genuinely ordered, so it earns a ramp: one hue,
// monotone lightness, validated against both surfaces at the 2:1 floor.
const ORDINAL_RAMP = ["var(--viz-ord-1)", "var(--viz-ord-2)", "var(--viz-ord-3)"]

function DifficultyBarChart({ data }) {
  return (
    <div className="chart-frame chart-frame--short">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis dataKey="label" {...AXIS_PROPS} />

          <YAxis {...AXIS_PROPS} allowDecimals={false} width={44} />

          <Tooltip
            content={<VizTooltip valueSuffix="solved" />}
            cursor={{ fill: "var(--accent-bg)" }}
          />

          <Bar dataKey="value" maxBarSize={MAX_BAR_SIZE} radius={BAR_RADIUS_VERTICAL}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={ORDINAL_RAMP[index] ?? ORDINAL_RAMP[0]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DifficultyBarChart
