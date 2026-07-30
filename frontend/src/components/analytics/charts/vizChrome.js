/*
 * Shared chart chrome. Component-free so fast refresh stays happy — the tooltip
 * lives in VizTooltip.jsx.
 *
 * Colours are `var(--token)` rather than resolved hex: custom properties work in
 * SVG presentation attributes, so light/dark swaps happen in CSS with no
 * re-render.
 */

// Overrides Recharts' default strokeDasharray="3 3" — dashed gridlines read as
// "projection" or "threshold" when this is just a grid.
export const GRID_PROPS = {
  stroke: "var(--viz-grid)",
  strokeDasharray: "0",
  vertical: false
}

export const AXIS_PROPS = {
  stroke: "var(--viz-axis)",
  tick: { fill: "var(--viz-muted)", fontSize: 12 },
  tickLine: false
}

// Bars are capped rather than filling their band, so the leftover reads as air.
export const MAX_BAR_SIZE = 24

/** Rounded data-end, square at the baseline. */
export const BAR_RADIUS_HORIZONTAL = [0, 4, 4, 0]
export const BAR_RADIUS_VERTICAL = [4, 4, 0, 0]

/** Parse a YYYY-MM-DD key as UTC so a local timezone can't shift the day. */
export const parseUtcDate = (key) => new Date(`${key}T00:00:00Z`)

export const formatDayShort = (key) =>
  parseUtcDate(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  })

export const formatDayLong = (key) =>
  parseUtcDate(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  })
