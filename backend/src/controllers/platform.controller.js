import {
  exchangeGithubCodeForToken,
  fetchGithubAuthenticatedUser
} from "../services/platform.service.js"

import { encrypt } from "../utils/crypto.js"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"

const githubRedirectUri = () =>
  `${process.env.API_BASE_URL || "http://localhost:3000"}/api/platforms/github/callback`

// ================= CONNECT GITHUB =================

export const connectGithub = async (req, res) => {
  try {

    // verify authenticated user
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    // verify env variables
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "GitHub OAuth not configured"
      })
    }

    const redirectUri = githubRedirectUri()

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

    return res.redirect(githubUrl)

  } catch (error) {

    console.log("Connect GitHub Error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to initiate GitHub connection"
    })
  }
}


// ================= GITHUB CALLBACK =================

export const githubCallback = async (req, res) => {

  try {

    const code = req.query.code
    const state = req.query.state
    const error = req.query.error
    const errorDescription = req.query.error_description

    // github oauth error
    if (error) {
      return res.status(400).json({
        success: false,
        message: `GitHub authorization failed: ${error}`,
        errorDescription
      })
    }

    // no code
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "No authorization code received"
      })
    }

    // no state
    if (!state) {
      return res.status(400).json({
        success: false,
        message: "Invalid OAuth state"
      })
    }

    // verify state token
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

    // find user
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

    // exchange code for token
    const accessToken =
      await exchangeGithubCodeForToken(
        code,
        githubRedirectUri()
      )

    // encrypt token
    const encryptedToken = encrypt(accessToken)

    // fetch github user
    const githubUser =
      await fetchGithubAuthenticatedUser(accessToken)

    // check existing connection
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

    // update or create
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

    return res.status(200).json({
      success: true,
      message: "GitHub connected successfully",
      githubUser: {
        id: githubUser.id,
        login: githubUser.login,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url
      }
    })

  } catch (error) {

    console.log("GitHub Callback Error:", error.message)

    return res.status(500).json({
      success: false,
      message: "GitHub OAuth failed"
    })
  }
}