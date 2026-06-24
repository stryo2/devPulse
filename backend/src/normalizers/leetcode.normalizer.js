export const normalizeLeetcodeActivities = (
  leetcodeData
) => {

  const activities = []

  for (const stat of leetcodeData.solvedStats) {

    activities.push({

      platform: "leetcode",

      activityType: "solved",

      title: `Solved ${stat.count} ${stat.difficulty} problems`,

      timestamp: new Date(),

      metadata: {
        difficulty: stat.difficulty,
        solvedCount: stat.count
      }

    })
  }

  return activities
}