// App tokens rather than Recharts' default chrome. Enhances but never gates —
// every value here is also reachable via the card's table view.
function VizTooltip({ active, payload, label, labelFormatter, valueSuffix }) {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0].value

  return (
    <div className="viz-tooltip">
      <div className="viz-tooltip__label">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="viz-tooltip__value">
        {new Intl.NumberFormat().format(value)}
        {valueSuffix ? ` ${valueSuffix}` : ""}
      </div>
    </div>
  )
}

export default VizTooltip
