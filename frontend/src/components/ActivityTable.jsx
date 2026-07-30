import { useEffect, useState } from "react"
import http from "../api/http"

const KNOWN_PLATFORMS = ["github", "leetcode", "codeforces"]

const dotClass = (platform) =>
  KNOWN_PLATFORMS.includes(platform) ? `dot--${platform}` : "dot--unknown"

// Stored activityTypes are snake_case; show them as words.
const humanise = (type) => type.replace(/_/g, " ")

function ActivityTable({ refreshKey = 0 }) {

  const [activities, setActivities] = useState([])
  // Starts true: the effect fetches on mount, and setting it in the effect body
  // would be a synchronous setState.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchActivities = async () => {

    try {
      const response = await http.get("/activity?limit=50")

      setActivities(response.data.data)
      setError("")

    } catch (error) {

      setError(error.response?.data?.message || "Failed to load activity")

    } finally {
      setLoading(false)
    }
  }

  // Declared after fetchActivities so the reference is initialised, not in its
  // temporal dead zone.
  useEffect(() => {

    // Every setState in fetchActivities runs after `await`, i.e. in a microtask
    // rather than synchronously during the effect — which is the cascading
    // render this rule exists to prevent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities()
  }, [refreshKey])

  return (
    <section className="dashboard__section">

      <h2 className="dashboard__section-title">Recent activity</h2>

      {error ? <div className="alert">{error}</div> : null}

      {loading ? (
        <div className="state">Loading activity…</div>
      ) : activities.length === 0 ? (
        <div className="state">
          <div className="state__title">No activity yet</div>
          <p>Connect a platform and run a sync to populate this feed.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">

            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Platform</th>
                <th scope="col">Type</th>
                <th scope="col">Count</th>
              </tr>
            </thead>

            <tbody>

              {activities.map((activity) => (

                <tr key={activity.id}>

                  <td>{new Date(activity.date).toLocaleString()}</td>

                  <td>
                    <span className="badge">
                      <span
                        className={`badge__dot ${dotClass(activity.platform)}`}
                        aria-hidden="true"
                      />
                      {activity.platform}
                    </span>
                  </td>

                  <td>{humanise(activity.type)}</td>
                  <td>{activity.count}</td>

                </tr>

              ))}

            </tbody>
          </table>
        </div>
      )}

    </section>
  )
}

export default ActivityTable
