// "All" is a total, not a difficulty — { All: 45, Easy: 12, Hard: 11, Medium: 22 }
// — so summing every value double-counts.
const TOTAL_KEY = "All"

// Ordered hardest-last so the ordinal colour ramp lines up with the labels.
const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"]

/** The single place that split happens: charts read `byDifficulty`, headline figures `total`. */
export const splitSolved = (counts) => {
  const source = counts ?? {}

  const byDifficulty = DIFFICULTY_ORDER.filter(
    (difficulty) => difficulty in source
  ).map((difficulty) => ({
    difficulty,
    count: source[difficulty] ?? 0
  }))

  // Prefer the API's own total; sum the difficulties only if it is absent.
  const total =
    source[TOTAL_KEY] ??
    byDifficulty.reduce((sum, entry) => sum + entry.count, 0)

  return { byDifficulty, total }
}
