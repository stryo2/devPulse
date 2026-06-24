export const normalizeCodeforcesActivities = (
  codeforcesData
) => {

  const activities = []

  activities.push({

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