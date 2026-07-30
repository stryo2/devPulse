import { useState } from "react"

/**
 * Card wrapper for a single chart. The table toggle is not optional polish — a
 * tooltip must never be the only way to read a value, so any card given
 * `tableColumns` + `tableRows` exposes a twin of what the chart plots.
 */
function ChartCard({
  title,
  subtitle,
  note,
  tableColumns,
  tableRows,
  children
}) {
  const [showTable, setShowTable] = useState(false)

  const hasTable = Boolean(tableColumns?.length && tableRows?.length)

  return (
    <section className="card">
      <div className="card__head">
        <div>
          <h3 className="card__title">{title}</h3>
          {subtitle ? <div className="card__subtitle">{subtitle}</div> : null}
        </div>

        {hasTable ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            aria-expanded={showTable}
            onClick={() => setShowTable((open) => !open)}
          >
            {showTable ? "Hide values" : "Show values"}
          </button>
        ) : null}
      </div>

      {children}

      {hasTable && showTable ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {tableColumns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {note ? <p className="card__note">{note}</p> : null}
    </section>
  )
}

export default ChartCard
