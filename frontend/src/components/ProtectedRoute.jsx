import { Navigate } from "react-router-dom"
import { clearToken, getToken, isTokenValid } from "../lib/session"

function ProtectedRoute({ children }) {
  const token = getToken()

  // Presence alone is not a session — an expired token would otherwise admit the
  // user to a dashboard where every request 401s.
  if (!isTokenValid(token)) {
    if (token) {
      clearToken()
    }

    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
