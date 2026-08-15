export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
}

// Express identifies error handlers by arity, so all four params must stay.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500

  if (status >= 500) {
    console.error("Unhandled error:", err)
  }

  // 5xx messages can carry internals.
  res.status(status).json({
    success: false,
    message: status < 500 ? err.message : "Internal server error"
  })
}
