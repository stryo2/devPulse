import axios from "axios"

export const http = axios.create({
  timeout: 10000,
  headers: {
    Accept: "application/json"
  }
})

// Logs only; the error is rethrown so withRetry still sees the original shape.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `HTTP Error ${error.response.status}:`,
        error.response.data
      )
    } else if (error.request) {
      console.error("No response received:", error.message)
    } else {
      console.error("Request error:", error.message)
    }
    throw error
  }
)