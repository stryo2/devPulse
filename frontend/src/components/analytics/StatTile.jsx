const compact = (value) => {
  if (value === null || value === undefined) {
    return "—"
  }

  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value)
  }

  return new Intl.NumberFormat().format(value)
}

// `accent` renders as a dot beside the label, never on the text — a light
// categorical hue is illegible as type.
function StatTile({ label, accent, value, unit, delta, deltaLabel, meta, breakdown }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta)

  return (
    <section className="card">
      <div className="stat__label">
        {accent ? (
          <span
            className="stat__dot"
            style={{ background: accent }}
            aria-hidden="true"
          />
        ) : null}
        {label}
      </div>

      <div className="stat__value">
        {compact(value)}
        {unit ? <span className="stat__unit"> {unit}</span> : null}
      </div>

      {hasDelta ? (
        <div className="stat__meta">
          <span className={`stat__delta${delta > 0 ? " stat__delta--up" : ""}`}>
            {delta > 0 ? "+" : ""}
            {compact(delta)}
          </span>
          {deltaLabel ? ` ${deltaLabel}` : null}
        </div>
      ) : null}

      {meta ? <div className="stat__meta">{meta}</div> : null}

      {breakdown?.length ? (
        <div className="stat__breakdown">
          {breakdown.map((row) => (
            <div className="stat__breakdown-row" key={row.label}>
              <span className="stat__breakdown-key">
                {row.accent ? (
                  <span
                    className="stat__dot"
                    style={{ background: row.accent }}
                    aria-hidden="true"
                  />
                ) : null}
                {row.label}
              </span>
              <span className="stat__breakdown-value">{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default StatTile
