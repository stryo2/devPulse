export const normalizeCodeforcesActivities = (
  codeforcesData
) => {

  const activities = []

  activities.push({

    sourceKey: `codeforces:${codeforcesData.profile.username}:${codeforcesData.profile.rank}:${codeforcesData.profile.rating}:${codeforcesData.profile.maxRating}:${codeforcesData.profile.contribution}`,

    platform: "codeforces",

    activityType: "contest_profile",

    title: `Current rating is ${codeforcesData.profile.rating}`,

    timestamp: new Date(),

    metadata: {

      rank: codeforcesData.profile.rank,

      rating: codeforcesData.profile.rating,

      maxRating: codeforcesData.profile.maxRating,

      contribution: codeforcesData.profile.contribution

    }

  })

  return activities
}