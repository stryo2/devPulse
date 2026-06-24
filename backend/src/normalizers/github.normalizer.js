export const normalizeGithubActivities = (
  githubData
) => {

  const activities = []

  for (const event of githubData.events) {

    // PUSH EVENTS
    if (event.type === "PushEvent") {

      activities.push({

        platform: "github",

        activityType: "push",

        title: `Pushed commits to ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    // PULL REQUEST EVENTS
    if (event.type === "PullRequestEvent") {

      activities.push({

        platform: "github",

        activityType: "pull_request",

        title: `Opened pull request in ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    // ISSUE EVENTS
    if (event.type === "IssuesEvent") {

      activities.push({

        platform: "github",

        activityType: "issue",

        title: `Created issue in ${event.repo}`,

        timestamp: new Date(event.createdAt),

        metadata: {
          repo: event.repo
        }

      })
    }



    // STAR EVENTS
    if (event.type === "WatchEvent") {

      activities.push({

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