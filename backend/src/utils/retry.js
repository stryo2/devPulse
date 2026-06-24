const sleep = (ms) => {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}



export const withRetry = async (
  fn,
  retries = 3,
  delay = 1000
) => {

  let lastError

  for (let attempt = 1; attempt <= retries; attempt++) {

    try {

      return await fn()

    } catch (error) {

      lastError = error

      const status = error?.response?.status

      // RETRY ONLY THESE
      const retryable =
        status === 429 ||
        status >= 500 ||
        error.code === "ECONNABORTED"

      if (!retryable) {
        throw error
      }

      console.log(
        `Retry attempt ${attempt} after ${delay}ms`
      )

      await sleep(delay)

      delay *= 2
    }
  }

  throw lastError
}