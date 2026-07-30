import prisma from "../lib/prisma.js"

// Never a silent undercount: exceeding this sets `reposTruncated` on the response.
const MAX_REPOS = 100

const MS_PER_DAY = 24 * 60 * 60 * 1000

const toDateKey = (date) => date.toISOString().slice(0, 10)

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))


const buildDateSpine = (windowStart, days) => {
  const spine = []

  for (let offset = 0; offset < days; offset += 1) {
    spine.push(toDateKey(new Date(windowStart.getTime() + offset * MS_PER_DAY)))
  }

  return spine
}

// Event-based: rows carry real upstream timestamps, so these are genuine time
// series. Counting happens in SQL, keeping results exact at any row volume.
const computeGithubAnalytics = async (userId, windowStart, days) => {
  const where = {
    userId,
    platform: "github",
    timestamp: { gte: windowStart }
  }

  const [typeGroups, dailyRows, repoRows] = await Promise.all([
    prisma.activitySnapshot.groupBy({
      by: ["activityType"],
      where,
      _count: { _all: true }
    }),

    prisma.$queryRaw`
      SELECT date_trunc('day', "timestamp") AS day, COUNT(*)::int AS count
      FROM "ActivitySnapshot"
      WHERE "userId" = ${userId}
        AND "platform" = 'github'
        AND "timestamp" >= ${windowStart}
      GROUP BY day
      ORDER BY day
    `,

    prisma.$queryRaw`
      SELECT "metadata"->>'repo' AS repo, COUNT(*)::int AS count
      FROM "ActivitySnapshot"
      WHERE "userId" = ${userId}
        AND "platform" = 'github'
        AND "timestamp" >= ${windowStart}
        AND "metadata"->>'repo' IS NOT NULL
      GROUP BY repo
      ORDER BY count DESC, repo ASC
      LIMIT ${MAX_REPOS + 1}
    `
  ])

  const byType = {}
  let totalEvents = 0

  for (const group of typeGroups) {
    byType[group.activityType] = group._count._all
    totalEvents += group._count._all
  }

  const countsByDay = new Map(
    dailyRows.map((row) => [toDateKey(row.day), row.count])
  )

  const daily = buildDateSpine(windowStart, days).map((date) => ({
    date,
    count: countsByDay.get(date) ?? 0
  }))

  const reposTruncated = repoRows.length > MAX_REPOS

  return {
    model: "event",
    totalEvents,
    byType,
    daily,
    // Sorted descending so the caller picks its own top N.
    repos: repoRows.slice(0, MAX_REPOS),
    reposTruncated
  }
}

// Snapshot-based: `submitStats` gives cumulative per-difficulty counters with no
// timestamps, so DISTINCT ON picks the latest observed state per difficulty.
const computeLeetcodeAnalytics = async (userId, windowStart) => {
  const [currentRows, baselineRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT DISTINCT ON ("metadata"->>'difficulty')
        "metadata"->>'difficulty' AS difficulty,
        ("metadata"->>'solvedCount')::int AS count,
        "timestamp"
      FROM "ActivitySnapshot"
      WHERE "userId" = ${userId}
        AND "platform" = 'leetcode'
        AND "metadata"->>'difficulty' IS NOT NULL
      ORDER BY "metadata"->>'difficulty', "timestamp" DESC
    `,

    prisma.$queryRaw`
      SELECT DISTINCT ON ("metadata"->>'difficulty')
        "metadata"->>'difficulty' AS difficulty,
        ("metadata"->>'solvedCount')::int AS count
      FROM "ActivitySnapshot"
      WHERE "userId" = ${userId}
        AND "platform" = 'leetcode'
        AND "metadata"->>'difficulty' IS NOT NULL
        AND "timestamp" < ${windowStart}
      ORDER BY "metadata"->>'difficulty', "timestamp" DESC
    `
  ])

  // Connected but never synced. `null` is reserved for "not connected", so this
  // returns a zeroed block with `asOf: null` instead.
  if (currentRows.length === 0) {
    return {
      model: "snapshot",
      current: {},
      solvedInWindow: {},
      partialWindow: true,
      asOf: null
    }
  }

  const baselineByDifficulty = new Map(
    baselineRows.map((row) => [row.difficulty, row.count])
  )

  const current = {}
  const solvedInWindow = {}
  let asOf = null

  for (const row of currentRows) {
    current[row.difficulty] = row.count
    solvedInWindow[row.difficulty] =
      row.count - (baselineByDifficulty.get(row.difficulty) ?? 0)

    if (!asOf || row.timestamp > asOf) {
      asOf = row.timestamp
    }
  }

  return {
    model: "snapshot",
    current,
    solvedInWindow,
    // No pre-window baseline means the delta above was measured from zero and
    // covers less than the requested range — callers must not present it as a
    // full-window figure.
    partialWindow: baselineRows.length === 0,
    asOf
  }
}

// Snapshot-based: `user.info` returns current profile state only, and one row
// holds every field, so plain findFirst calls suffice.
const computeCodeforcesAnalytics = async (userId, windowStart) => {
  const [latest, baseline] = await Promise.all([
    prisma.activitySnapshot.findFirst({
      where: { userId, platform: "codeforces" },
      orderBy: { timestamp: "desc" }
    }),

    prisma.activitySnapshot.findFirst({
      where: {
        userId,
        platform: "codeforces",
        timestamp: { lt: windowStart }
      },
      orderBy: { timestamp: "desc" }
    })
  ])

  // Connected but never synced — see the note in computeLeetcodeAnalytics.
  if (!latest) {
    return {
      model: "snapshot",
      current: {
        rating: null,
        maxRating: null,
        rank: null,
        contribution: null
      },
      ratingChangeInWindow: null,
      partialWindow: true,
      asOf: null
    }
  }

  const rating = latest.metadata?.rating ?? null
  const baselineRating = baseline?.metadata?.rating ?? null

  return {
    model: "snapshot",
    current: {
      rating,
      maxRating: latest.metadata?.maxRating ?? null,
      rank: latest.metadata?.rank ?? null,
      contribution: latest.metadata?.contribution ?? null
    },
    ratingChangeInWindow:
      rating === null || baselineRating === null
        ? null
        : rating - baselineRating,
    partialWindow: !baseline,
    asOf: latest.timestamp
  }
}

/**
 * Dashboard analytics for one user over a trailing window, each platform
 * reported under the model it actually uses.
 *
 * A `null` platform block means exactly one thing: not connected. Connected
 * platforms always return a block, zeroed if never synced.
 */
export const computeUserAnalytics = async (userId, { days }) => {
  if (!userId) {
    throw new Error("User id is required")
  }

  const now = new Date()

  // Snapped to a UTC day boundary so the SQL filter and the daily spine cover
  // exactly the same range — otherwise `days=30` yields 31 buckets.
  const windowStart = new Date(
    startOfUtcDay(now).getTime() - (days - 1) * MS_PER_DAY
  )

  const connections = await prisma.connectedPlatform.findMany({
    where: { userId },
    select: { platform: true }
  })

  const connected = connections.map((connection) => connection.platform)

  const [github, leetcode, codeforces] = await Promise.all([
    connected.includes("github")
      ? computeGithubAnalytics(userId, windowStart, days)
      : null,
    connected.includes("leetcode")
      ? computeLeetcodeAnalytics(userId, windowStart)
      : null,
    connected.includes("codeforces")
      ? computeCodeforcesAnalytics(userId, windowStart)
      : null
  ])

  return {
    window: {
      days,
      from: windowStart,
      to: now,
      timezone: "UTC"
    },
    connectedPlatforms: connected,
    github,
    leetcode,
    codeforces
  }
}
