export const normalizeGithubActivities = (
  githubData
) => {

  const activities = []

  for (const event of githubData.events) {

    if (event.type === "PushEvent") {

      activities.push({

        sourceKey: event.id,

        platform: "github",

        activityType: "push",

        title: `Pushed commits to ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    if (event.type === "PullRequestEvent") {

      activities.push({

        sourceKey: event.id,

        platform: "github",

        activityType: "pull_request",

        title: `Opened pull request in ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    if (event.type === "IssuesEvent") {

      activities.push({

        sourceKey: event.id,

        platform: "github",

        activityType: "issue",

        title: `Created issue in ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    // GitHub calls a star a WatchEvent; "watching" is a different feature.
    if (event.type === "WatchEvent") {

      activities.push({

        sourceKey: event.id,

        platform: "github",

        activityType: "star",

        title: `Starred repository ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }

  }

  return activities
}