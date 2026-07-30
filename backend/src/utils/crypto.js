import crypto from "crypto"

const algorithm = "aes-256-cbc"
const secretKey = process.env.ENCRYPTION_KEY

if (!secretKey) {
  throw new Error("ENCRYPTION_KEY environment variable is not set")
}

if (secretKey.length !== 64) {
  throw new Error(
    `ENCRYPTION_KEY must be 32 bytes (64 hex characters), got ${secretKey.length}`
  )
}

export const encrypt = (text) => {
  try {
    if (!text) {
      throw new Error("Text to encrypt cannot be empty")
    }

    // Fresh IV per call — reusing one across tokens would leak equality.
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(
      algorithm,
      Buffer.from(secretKey, "hex"),
      iv
    )

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    return {
      iv: iv.toString("hex"),
      content: encrypted
    }
  } catch (error) {
    console.error("Encryption failed:", error.message)
    throw error
  }
}

/**
 * Reverses how tokens are persisted on ConnectedPlatform.accessToken:
 * JSON.stringify({ iv, content }). Returns null rather than throwing so a
 * corrupt token degrades to an unauthenticated request instead of a failed sync.
 */
export const decryptStoredToken = (storedValue) => {
  if (!storedValue) {
    return null
  }

  try {
    return decrypt(JSON.parse(storedValue))
  } catch (error) {
    console.error("Stored token could not be decrypted:", error.message)
    return null
  }
}

export const decrypt = (hash) => {
  try {
    if (!hash || !hash.iv || !hash.content) {
      throw new Error("Invalid encryption hash structure")
    }

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(secretKey, "hex"),
      Buffer.from(hash.iv, "hex")
    )

    let decrypted = decipher.update(hash.content, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error.message)
    throw error
  }
}