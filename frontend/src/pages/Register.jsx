import { useState } from "react"
import { useNavigate } from "react-router-dom"
import http from "../api/http"

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

      await http.post("/auth/register", {
        email,
        password
      })

      navigate("/")

    } catch (error) {

      setError(error.response?.data?.message || "Registration failed")

    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <h1>Register</h1>

      {error ? <p>{error}</p> : null}

      <form onSubmit={handleRegister}>

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
          {loading ? "Registering..." : "Register"}
        </button>

      </form>

    </div>
  )
}

export default Register