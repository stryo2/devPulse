import axios from "axios"

export const http = axios.create({
  timeout: 10000,
  headers: {
    Accept: "application/json"
  }
})

// Add response interceptor for better error handling
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(
        `HTTP Error ${error.response.status}:`,
        error.response.data
      )
    } else if (error.request) {
      // Request made but no response
      console.error("No response received:", error.message)
    } else {
      // Request setup error
      console.error("Request error:", error.message)
    }
    throw error
  }
)