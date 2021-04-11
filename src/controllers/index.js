import {
  registerUser,
  loginUser,
  getProfile,
  authenticateGithub,
  authenticateGoogle,
  authenticateFacebook,
  updateProfile,
} from '../services'
import { handleError } from '../helpers/error'

export const registerHandler = async (req, res) => {
  const query = await registerUser(req.body)
  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const loginHandler = async (req, res) => {
  const query = await loginUser(req.body)
  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const profileHandler = async (req, res) => {
  const { userId } = req
  const query = await getProfile(userId)
  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const githubHandler = async (req, res) => {
  const {
    params: { code },
  } = req

  const query = await authenticateGithub({ code })
  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const googleHandler = async (req, res) => {
  const { body } = req

  const query = await authenticateGoogle(body)

  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const facebookHandler = async (req, res) => {
  const { body } = req

  const query = await authenticateFacebook(body)

  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}

export const updateHandler = async (req, res) => {
  const { body, userId } = req

  const query = await updateProfile(userId, body)
  if (query.success) {
    res.status(query.code).json(query)
  } else {
    handleError(query, res)
  }
}
