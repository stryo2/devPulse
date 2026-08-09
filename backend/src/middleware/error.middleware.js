export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
}

// Must keep all four parameters — Express identifies error handlers by arity.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500

  // 4xx is the caller's mistake — not worth a stack trace in production logs.
  if (status >= 500) {
    console.error("Unhandled error:", err)
  }

  // 5xx messages can carry internals, so those get a fixed string.
  res.status(status).json({
    success: false,
    message: status < 500 ? err.message : "Internal server error"
  })
}
