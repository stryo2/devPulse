import {
  exchangeGithubCodeForToken,
  fetchGithubAuthenticatedUser
} from "../services/platform.service.js"

import { encrypt } from "../utils/crypto.js"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import { LeetcodeAdapter } from "../adapters/leetcode.adapter.js"
import { CodeforcesAdapter } from "../adapters/codeforces.adapter.js"

const leetcode = new LeetcodeAdapter()
const codeforces = new CodeforcesAdapter()

const githubRedirectUri = () =>
  `${process.env.API_BASE_URL || "http://localhost:3000"}/api/platforms/github/callback`

const frontendRedirectUri = () =>
  process.env.FRONTEND_URL || "http://localhost:5173"

const upsertPlatformConnection = async ({ userId, platform, username, platformUserId, accessToken }) => {
  return prisma.connectedPlatform.upsert({
    where: {
      userId_platform: {
        userId,
        platform
      }
    },
    create: {
      userId,
      platform,
      username,
      platformUserId,
      accessToken
    },
    update: {
      username,
      platformUserId,
      accessToken
    }
  })
}

export const connectGithub = async (req, res) => {
  try {

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "GitHub OAuth not configured"
      })
    }

    const redirectUri = githubRedirectUri()

    // Signed state carries the user id through the public callback, which has no
    // session of its own, and doubles as the CSRF check.
    const state = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    )

    const githubUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${process.env.GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent("read:user user:email")}` +
      `&state=${encodeURIComponent(state)}`

    return res.status(200).json({
      success: true,
      authorizationUrl: githubUrl
    })

  } catch (error) {

    console.log("Connect GitHub Error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to initiate GitHub connection"
    })
  }
}


export const githubCallback = async (req, res) => {

  try {

    const code = req.query.code
    const state = req.query.state
    const error = req.query.error
    const errorDescription = req.query.error_description

    if (error) {
      return res.status(400).json({
        success: false,
        message: `GitHub authorization failed: ${error}`,
        errorDescription
      })
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "No authorization code received"
      })
    }

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "Invalid OAuth state"
      })
    }

    let decodedState

    try {
      decodedState = jwt.verify(
        state,
        process.env.JWT_SECRET
      )
    } catch (err) {

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OAuth state"
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decodedState.userId
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    const accessToken =
      await exchangeGithubCodeForToken(
        code,
        githubRedirectUri()
      )

    const encryptedToken = encrypt(accessToken)

    const githubUser =
      await fetchGithubAuthenticatedUser(accessToken)

    const existingConnection =
      await prisma.connectedPlatform.findFirst({
        where: {
          userId: user.id,
          platform: "github"
        }
      })

    const connectionData = {
      platform: "github",
      platformUserId: githubUser.id.toString(),
      username: githubUser.login,
      accessToken: JSON.stringify(encryptedToken),
      userId: user.id
    }

    if (existingConnection) {

      await prisma.connectedPlatform.update({
        where: {
          id: existingConnection.id
        },
        data: connectionData
      })

    } else {

      await prisma.connectedPlatform.create({
        data: connectionData
      })
    }

    // The browser lands here from GitHub, so this must redirect rather than
    // return JSON.
    return res.redirect(`${frontendRedirectUri()}/dashboard`)

  } catch (error) {

    console.log("GitHub Callback Error:", error.message)

    return res.status(500).json({
      success: false,
      message: "GitHub OAuth failed"
    })
  }
}

export const connectLeetcode = async (req, res) => {
  try {
    const userId = req.user?.id
    const { username } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "LeetCode username is required"
      })
    }

    const profile = await leetcode.fetch(username)

    await upsertPlatformConnection({
      userId,
      platform: "leetcode",
      username: profile.profile.username,
      platformUserId: profile.profile.username,
      accessToken: null
    })

    return res.status(200).json({
      success: true,
      message: "LeetCode connected successfully",
      profile
    })
  } catch (error) {
    console.log("Connect LeetCode Error:", error.message)

    // A bad username is the caller's mistake, not a server fault.
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    return res.status(500).json({
      success: false,
      message: "Failed to connect LeetCode"
    })
  }
}

export const connectCodeforces = async (req, res) => {
  try {
    const userId = req.user?.id
    const { username } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Codeforces username is required"
      })
    }

    const profile = await codeforces.fetch(username)

    await upsertPlatformConnection({
      userId,
      platform: "codeforces",
      username: profile.profile.username,
      platformUserId: profile.profile.username,
      accessToken: null
    })

    return res.status(200).json({
      success: true,
      message: "Codeforces connected successfully",
      profile
    })
  } catch (error) {
    console.log("Connect Codeforces Error:", error.message)

    // A bad handle is the caller's mistake, not a server fault.
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    return res.status(500).json({
      success: false,
      message: "Failed to connect Codeforces"
    })
  }
}