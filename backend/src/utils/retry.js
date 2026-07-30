const sleep = (ms) => {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}



// Connection-level failures that carry no HTTP response — transient, so worth
// retrying.
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ECONNABORTED"
])



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

      // `status` is undefined when the request never got a response, so the
      // network code is checked separately.
      const retryable =
        status === 429 ||
        (typeof status === "number" && status >= 500) ||
        (status === undefined &&
          RETRYABLE_NETWORK_CODES.has(error?.code))

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