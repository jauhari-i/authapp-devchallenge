import express from 'express'
import {
  registerHandler,
  loginHandler,
  profileHandler,
  githubHandler,
  googleHandler,
  facebookHandler,
  updateHandler,
} from '../controllers'
import { app as BasicAuth } from '../auth/basic_auth_instance'
import { verifyToken } from '../auth/jwt_auth_instance'

const router = express.Router()

router.post('/register', BasicAuth, registerHandler)
router.post('/login', BasicAuth, loginHandler)

router.get('/profile', verifyToken, profileHandler)
router.get('/auth/gh/:code', BasicAuth, githubHandler)

router.post('/auth/google', BasicAuth, googleHandler)
router.post('/auth/facebook', BasicAuth, facebookHandler)

router.put('/update', verifyToken, updateHandler)

export { router }
