import { BaseAdapter } from "./base.adapter.js"
import { http } from "../utils/http.js"
import { withRetry } from "../utils/retry.js"

const buildHeaders = (accessToken) => {
  const headers = {
    "X-GitHub-Api-Version": "2022-11-28"
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

export class GithubAdapter extends BaseAdapter {
async getProfile(username, accessToken) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}`, {
      headers: buildHeaders(accessToken)
    })
  )

  return {
    username: response.data.login,
    followers: response.data.followers,
    following: response.data.following,
    publicRepos: response.data.public_repos,
  }
}
async getRepos(username, accessToken) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}/repos`, {
      headers: buildHeaders(accessToken)
    })
  )

  return response.data.map((repo) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
  }))
}
async getEvents(username, accessToken) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}/events`, {
      headers: buildHeaders(accessToken)
    })
  )

  return response.data.map((event) => ({
    id: event.id,
    type: event.type,
    repo: event.repo?.name,
    createdAt: event.created_at,
  }))
}
 async fetch(username, accessToken) {

  try {

    const [profile, repos, events] = await Promise.all([
      this.getProfile(username, accessToken),
      this.getRepos(username, accessToken),
      this.getEvents(username, accessToken),
    ])

    return {
      platform: "github",
      profile,
      repos,
      events,
    }

  } catch (error) {

    console.log(error.message)
    throw error

  }
}
}
