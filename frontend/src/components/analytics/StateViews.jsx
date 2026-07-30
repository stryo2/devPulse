export function Skeleton({ variant = "tile", count = 1 }) {
  return Array.from({ length: count }, (unused, index) => (
    <div key={index} className={`skeleton skeleton--${variant}`} />
  ))
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error">
      <div className="state__title">Couldn&apos;t load analytics</div>
      <p>{message}</p>
      {onRetry ? (
        <div className="state__action">
          <button type="button" className="btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <div className="state__title">{title}</div>
      {children ? <p>{children}</p> : null}
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  )
}
