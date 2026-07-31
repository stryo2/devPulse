import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import http from "../api/http"
import { clearToken, setToken } from "../lib/session"
import ThemeToggle from "../components/ThemeToggle"
import "../styles/dashboard.css"

function Register() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

      <div className="auth__card">

        <h1 className="auth__title">Create your account</h1>
        <p className="auth__subtitle">
          Track your activity across GitHub, LeetCode and Codeforces
        </p>

        {error ? <div className="alert">{error}</div> : null}

        <form className="auth__form" onSubmit={handleRegister}>

          <div className="field">
            <label className="field__label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className="input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

        </form>

        <p className="auth__footer">
          Already have an account? <Link to="/">Sign in</Link>
        </p>

      </div>
    </div>
  )
}

export default Register
