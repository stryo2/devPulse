import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import http from "../api/http"
import { clearToken, setToken } from "../lib/session"
import ThemeToggle from "../components/ThemeToggle"
import AuthArt from "../components/AuthArt"
import EyeIcon from "../components/EyeIcon"
import "../styles/dashboard.css"

function Register() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e) => {

    e.preventDefault()
    setLoading(true)
    setError("")

    try {

      // Registration must never inherit an existing session — that is how a new
      // account ends up acting as the old one and overwriting its connections.
      clearToken()

      const response = await http.post("/auth/register", {
        email,
        password
      })

      setToken(response.data.token)

      navigate("/dashboard")

    } catch (error) {

      setError(error.response?.data?.message || "Registration failed")

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

          <h1 className="auth-split__title">Create an account</h1>
          <p className="auth-split__subtitle">
            Already have an account? <Link to="/">Log in</Link>
          </p>

          {error ? <div className="alert">{error}</div> : null}

          <form className="auth__form" onSubmit={handleRegister}>

            <div className="field">
              <label className="field__label" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                className="input input--lg"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="register-password">
                Password
              </label>
              <div className="input-affix">
                <input
                  id="register-password"
                  className="input input--lg"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
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
              {loading ? "Creating account…" : "Create account"}
            </button>

          </form>

          <div className="auth-split__divider">
            <span>Connect after sign-up</span>
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

export default Register
