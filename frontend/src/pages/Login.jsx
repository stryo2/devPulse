import { useState } from "react"
import { useNavigate } from "react-router-dom"
import http from "../api/http"
import { Link } from "react-router-dom"
import { clearToken, setToken } from "../lib/session"
import ThemeToggle from "../components/ThemeToggle"
import AuthArt from "../components/AuthArt"
import EyeIcon from "../components/EyeIcon"
import "../styles/dashboard.css"

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
      <div className="auth__theme">
        <ThemeToggle />
      </div>

      <div className="auth-split">

        <AuthArt />

        <div className="auth-split__form">

          <h1 className="auth-split__title">Welcome back</h1>
          <p className="auth-split__subtitle">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>

          {error ? <div className="alert">{error}</div> : null}

          <form className="auth__form" onSubmit={handleLogin}>

            <div className="field">
              <label className="field__label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="input input--lg"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="login-password">
                Password
              </label>
              <div className="input-affix">
                <input
                  id="login-password"
                  className="input input--lg"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-affix__btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <EyeIcon crossed={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

          </form>

          <div className="auth-split__divider">
            <span>Your activity from</span>
          </div>

          <ul className="auth-split__platforms">
            <li><span className="auth-split__dot dot--github" />GitHub</li>
            <li><span className="auth-split__dot dot--leetcode" />LeetCode</li>
            <li><span className="auth-split__dot dot--codeforces" />Codeforces</li>
          </ul>

        </div>
      </div>
    </div>
  )
}

export default Login
