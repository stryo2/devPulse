import http from "../api/http"
import { useState } from "react"

function ConnectPlatforms() {

  const token = localStorage.getItem("token")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [leetcodeUsername, setLeetcodeUsername] = useState("")
  const [codeforcesUsername, setCodeforcesUsername] = useState("")

  const connectGitHub = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await http.get(
        "/platforms/github/connect",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      window.location.href = response.data.authorizationUrl
    } catch (error) {

      setError(error.response?.data?.message || "Failed to start GitHub connection")

    } finally {
      setLoading(false)
    }
  }

  const connectLeetcode = async () => {
    try {
      setLoading(true)
      setError("")

      await http.post(
        "/platforms/leetcode/connect",
        {
          username: leetcodeUsername
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setLeetcodeUsername("")
    } catch (error) {
      setError(error.response?.data?.message || "Failed to connect LeetCode")
    } finally {
      setLoading(false)
    }
  }

  const connectCodeforces = async () => {
    try {
      setLoading(true)
      setError("")

      await http.post(
        "/platforms/codeforces/connect",
        {
          username: codeforcesUsername
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setCodeforcesUsername("")
    } catch (error) {
      setError(error.response?.data?.message || "Failed to connect Codeforces")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <h2>Connect GitHub</h2>

      {error ? <p>{error}</p> : null}

      <button onClick={connectGitHub}>
        {loading ? "Connecting..." : "Connect GitHub"}
      </button>

      <div>
        <input
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          placeholder="LeetCode username"
        />
        <button onClick={connectLeetcode} disabled={loading}>
          Connect LeetCode
        </button>
      </div>

      <div>
        <input
          value={codeforcesUsername}
          onChange={(e) => setCodeforcesUsername(e.target.value)}
          placeholder="Codeforces handle"
        />
        <button onClick={connectCodeforces} disabled={loading}>
          Connect Codeforces
        </button>
      </div>

    </div>
  )
}

export default ConnectPlatforms