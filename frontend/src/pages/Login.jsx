import { useState } from "react"
import { useNavigate } from "react-router-dom"
import http from "../api/http"
import { Link } from "react-router-dom"

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

      const response = await http.post("/auth/login", {
        email,
        password
      })

      localStorage.setItem("token", response.data.token)

      navigate("/dashboard")

    } catch (error) {

      setError(error.response?.data?.message || "Login failed")

    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Login</h1>

      {error ? <p>{error}</p> : null}

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}

export default Login