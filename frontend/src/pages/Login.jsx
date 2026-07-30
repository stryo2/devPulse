import { useState } from "react"
import { useNavigate } from "react-router-dom"
import http from "../api/http"
import { Link } from "react-router-dom"
import { clearToken, setToken } from "../lib/session"
import "../styles/dashboard.css"

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {

      // Drop the previous session first, so a failed login can't leave the old
      // user's token in place.
      clearToken()

      const response = await http.post("/auth/login", {
        email,
        password
      })

      setToken(response.data.token)

      navigate("/dashboard")

    } catch (error) {

      setError(error.response?.data?.message || "Login failed")

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">

        <h1 className="auth__title">Welcome back</h1>
        <p className="auth__subtitle">Sign in to your DevPulse dashboard</p>

        {error ? <div className="alert">{error}</div> : null}

        <form className="auth__form" onSubmit={handleLogin}>

          <div className="field">
            <label className="field__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

        </form>

        <p className="auth__footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>

      </div>
    </div>
  )
}

export default Login
