import jwt from "jsonwebtoken"

const authenticate = (req, res, next) => {
  try {
    // Verify JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured")
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      })
    }

    // Get authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing"
      })
    }

    // Extract token
    const parts = authHeader.split(" ")
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header format"
      })
    }

    const token = parts[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user data to request
    req.user = decoded

    next()

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired"
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      })
    }

    console.error("Authentication error:", error.message)
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    })
  }
}

export default authenticate