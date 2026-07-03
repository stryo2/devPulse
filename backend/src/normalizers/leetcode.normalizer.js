export const normalizeLeetcodeActivities = (
  leetcodeData
) => {

  const activities = []

  for (const stat of leetcodeData.solvedStats) {

    activities.push({

      sourceKey: `leetcode:${stat.difficulty}:${stat.count}`,

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