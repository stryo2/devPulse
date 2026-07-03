import { http } from "../utils/http.js"

export const exchangeGithubCodeForToken = async (code, redirectUri) => {
  try {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error("GitHub credentials not configured")
    }

    if (!code) {
      throw new Error("Authorization code is required")
    }

    if (!redirectUri) {
      throw new Error("Redirect URI is required")
    }

    console.log("Exchanging GitHub code for access token...")

    const response = await http.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          Accept: "application/json"
        }
      }
    )

    if (response.data.error) {
      throw new Error(`GitHub error: ${response.data.error_description}`)
    }

    if (!response.data.access_token) {
      throw new Error("No access token received from GitHub")
    }

    console.log("Access token obtained successfully")
    return response.data.access_token
  } catch (error) {
    console.error("Token exchange failed:", error.message)
    throw error
  }
}

export const fetchGithubAuthenticatedUser = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("Access token is required")
    }

    console.log("Fetching GitHub user profile...")

    const response = await http.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    )

    if (!response.data || !response.data.id) {
      throw new Error("Failed to fetch GitHub user profile")
    }

    console.log("GitHub user profile fetched successfully")
    return response.data
  } catch (error) {
    console.error("User profile fetch failed:", error.message)
    throw error
  }
}
