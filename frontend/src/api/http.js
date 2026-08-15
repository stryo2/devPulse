import axios from "axios"
import { clearToken, getToken } from "../lib/session"

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

// A production bundle silently pointing at localhost is hard to diagnose.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set; falling back to localhost")
}

const http = axios.create({ baseURL })

// Never overwrite a header a caller set explicitly — older components pass their
// own and must keep working.
http.interceptors.request.use((config) => {
  const token = getToken()

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Without this a dead token stays in localStorage and every request fails
// silently, stranding the user on a dashboard with no route back to a session.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()

      // Full reload rather than a router navigate: no router context here, and a
      // hard reset clears state derived from the dead session. Guarded against
      // reloading the login page in a loop.
      if (window.location.pathname !== "/") {
        window.location.replace("/")
      }
    }

    return Promise.reject(error)
  }
)

export default http
