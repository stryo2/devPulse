import jwt from "jsonwebtoken"

const authenticate = (req, res, next) => {

  try {

    // get authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      })
    }

    // extract token
    const token = authHeader.split(" ")[1]

    // verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // attach user data
    req.user = decoded

    next()

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    })

  }

}

export default authenticate