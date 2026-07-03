import { useEffect, useState } from "react"
import http from "../api/http"

function ActivityTable() {

  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {

    fetchActivities()

  }, [])

  const fetchActivities = async () => {

    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")

      const response = await http.get(
        "/activity?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setActivities(response.data.data)

    } catch (error) {

      setError(error.response?.data?.message || "Failed to load activity")

    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Loading activity...</p>
  }

  return (
    <div>
      {error ? <p>{error}</p> : null}

      <table border="1">

        <thead>
          <tr>
            <th>Date</th>
            <th>Platform</th>
            <th>Type</th>
            <th>Count</th>
          </tr>
        </thead>

        <tbody>

          {activities.map((activity) => (

            <tr key={activity.id}>

              <td>{new Date(activity.date).toLocaleString()}</td>
              <td>{activity.platform}</td>
              <td>{activity.type}</td>
              <td>{activity.count}</td>

            </tr>

          ))}

        </tbody>
      </table>
    </div>
  )
}

export default ActivityTable