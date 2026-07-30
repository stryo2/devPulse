// All inside the API's validated 1-365 bound.
const RANGE_OPTIONS = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "1y" }
]

// One filter above everything it scopes, never per-chart. A segmented control
// rather than pills, since the options are mutually exclusive.
function RangeFilter({ value, onChange, disabled }) {
  return (
    <div className="filter-row">
      <span className="filter-row__label">Range</span>

      <div className="segmented" role="group" aria-label="Time range">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.days}
            type="button"
            className="segmented__option"
            aria-pressed={value === option.days}
            disabled={disabled}
            onClick={() => onChange(option.days)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default RangeFilter
