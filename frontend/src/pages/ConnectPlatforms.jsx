import http from "../api/http"
import { useState } from "react"

function ConnectPlatforms({ onConnected }) {

  // No token state here — the interceptor in api/http.js attaches the current
  // one per call, so a session established after mount is still picked up.
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [leetcodeUsername, setLeetcodeUsername] = useState("")
  const [codeforcesUsername, setCodeforcesUsername] = useState("")

  const connectGitHub = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await http.get("/platforms/github/connect")

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

      await http.post("/platforms/leetcode/connect", {
        username: leetcodeUsername
      })

      setLeetcodeUsername("")
      onConnected?.()
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

      await http.post("/platforms/codeforces/connect", {
        username: codeforcesUsername
      })

      setCodeforcesUsername("")
      onConnected?.()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to connect Codeforces")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="dashboard__section">

      <h2 className="dashboard__section-title">Connect platforms</h2>

      {error ? <div className="alert">{error}</div> : null}

      <div className="chart-grid">

        <div className="card">
          <div className="connect-card__head">
            <span
              className="stat__dot dot--github"
              aria-hidden="true"
            />
            <h3 className="card__title">GitHub</h3>
          </div>
          <div className="card__subtitle">
            Authorise via OAuth to sync your event history
          </div>

          <div className="connect-row">
            <button
              type="button"
              className="btn btn--block"
              onClick={connectGitHub}
              disabled={loading}
            >
              {loading ? "Connecting…" : "Connect GitHub"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="connect-card__head">
            <span
              className="stat__dot dot--leetcode"
              aria-hidden="true"
            />
            <h3 className="card__title">LeetCode</h3>
          </div>
          <div className="card__subtitle">
            Track solved problems by difficulty
          </div>

          <div className="connect-row">
            <input
              className="input"
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              placeholder="LeetCode username"
              aria-label="LeetCode username"
            />
            <button
              type="button"
              className="btn"
              onClick={connectLeetcode}
              disabled={loading}
            >
              Connect
            </button>
          </div>
        </div>

        <div className="card">
          <div className="connect-card__head">
            <span
              className="stat__dot dot--codeforces"
              aria-hidden="true"
            />
            <h3 className="card__title">Codeforces</h3>
          </div>
          <div className="card__subtitle">Track your rating and rank</div>

          <div className="connect-row">
            <input
              className="input"
              value={codeforcesUsername}
              onChange={(e) => setCodeforcesUsername(e.target.value)}
              placeholder="Codeforces handle"
              aria-label="Codeforces handle"
            />
            <button
              type="button"
              className="btn"
              onClick={connectCodeforces}
              disabled={loading}
            >
              Connect
            </button>
          </div>
        </div>

      </div>

    </section>
  )
}

export default ConnectPlatforms
