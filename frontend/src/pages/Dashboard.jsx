import ConnectPlatforms from "./ConnectPlatforms"
import ActivityTable from "../components/ActivityTable"
import http from "../api/http"
import { useState } from "react"

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const triggerSync = async () => {

    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")

      await http.post(
        "/sync/trigger",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

    } catch (error) {

      setError(error.response?.data?.message || "Sync failed")

    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <h1>DevPulse Dashboard</h1>

      {error ? <p>{error}</p> : null}

      <ConnectPlatforms />

      <button onClick={triggerSync}>
        {loading ? "Syncing..." : "Sync"}
      </button>

      <ActivityTable />

    </div>
  )
}

export default Dashboard