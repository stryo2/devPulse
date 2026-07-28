import { BaseAdapter } from "./base.adapter.js"
import { http } from "../utils/http.js"
import { withRetry } from "../utils/retry.js"

export class GithubAdapter extends BaseAdapter {
async getProfile(username) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}`)
  )

  return {
    username: response.data.login,
    followers: response.data.followers,
    following: response.data.following,
    publicRepos: response.data.public_repos,
  }
}
async getRepos(username) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}/repos`)
  )

  return response.data.map((repo) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
  }))
}
async getEvents(username) {

  const response = await withRetry(() =>
    http.get(`https://api.github.com/users/${username}/events`)
  )

  return response.data.map((event) => ({
    id: event.id,
    type: event.type,
    repo: event.repo?.name,
    createdAt: event.created_at,
  }))
}
 async fetch(username) {

  try {

    const [profile, repos, events] = await Promise.all([
      this.getProfile(username),
      this.getRepos(username),
      this.getEvents(username),
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
