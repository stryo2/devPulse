const TOKEN_KEY = "token"

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Reads `exp` without verifying the signature — that is the server's job. This
// only avoids sending a token we can already see is expired; a tampered one
// still fails server-side.
const readExpiry = (token) => {
  try {
    const payload = token.split(".")[1]

    if (!payload) {
      return null
    }

    // base64url -> base64 before decoding.
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    )

    return typeof decoded.exp === "number" ? decoded.exp : null
  } catch {
    return null
  }
}

/** A malformed token counts as invalid rather than silently passing through. */
export const isTokenValid = (token) => {
  if (!token) {
    return false
  }

  const exp = readExpiry(token)

  if (exp === null) {
    return false
  }

  return exp * 1000 > Date.now()
}

export const hasValidSession = () => isTokenValid(getToken())

// Deliberate lint error to verify CI blocks merges. Reverted in the next commit.
export const ciCanary = () => {
  const unusedVariable = 42
  return "ci-canary"
}
