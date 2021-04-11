import models from '../models'
import validate from 'validate.js'
import { DeleteImage, Uploader } from '../middlewares/uploader'
import {
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
} from 'http-status'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { generateToken } from '../auth/jwt_auth_instance'
import axios from 'axios'
import { getConfig } from '../config/global_config'

const { Users } = models

const githubConfig = getConfig('/githubConfig')
const ghAccesTokenUrl = 'https://github.com/login/oauth/access_token'
const ghApi = 'https://api.github.com/user'

const defaultImg =
  'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'

function validURL(str) {
  var pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return !!pattern.test(str)
}

const accType = {
  google: 'google-auth',
  facebook: 'facebook-auth',
  github: 'github-auth',
  api: 'api-auth',
}

const generateSalt = async length => {
  const s = await bcrypt.genSaltSync(length)
  return s
}

const encrypt = async (pass, salt) => {
  const encrypted = await bcrypt.hashSync(pass, salt)
  return encrypted
}

const checkMatch = async (pass, encrypted) => {
  const isMatch = await bcrypt.compareSync(pass, encrypted)
  return isMatch
}

const getEmails = async () => {
  const u = await Users.find({})

  let email = []

  u.map(item => {
    email.push(item.email)
  })

  return email
}

const registerRule = async () => {
  const emails = await getEmails()
  return {
    email: {
      presence: true,
      exclusion: {
        within: emails,
        message: "'%{value}' is already used",
      },
    },
    password: {
      presence: true,
      length: {
        minimum: 8,
        message: 'must be at least 8 characters',
      },
    },
    picture: {
      presence: false,
    },
  }
}

const loginRule = {
  email: {
    presence: true,
  },
  password: {
    presence: true,
  },
}

const validation = async (data, rule) => {
  const val = await validate(data, rule)
  if (val === undefined) {
    return false
  } else if (val.email) {
    return val.email[0]
  } else if (val.password) {
    return val.password[0]
  } else {
    return false
  }
}

const registerUser = async data => {
  try {
    const constraints = await registerRule()
    const checkValidation = await validation(data, constraints)
    if (checkValidation) {
      throw {
        code: BAD_REQUEST,
        message: checkValidation,
        success: false,
      }
    } else {
      const picture = await Uploader(defaultImg)
      const salt = await generateSalt(10)
      const encryptedPassword = await encrypt(data.password, salt)

      const doc = {
        userId: uuid(),
        name: '',
        email: data.email,
        password: encryptedPassword,
        picture: picture,
        accountType: accType.api,
        passwordLength: data.password.length,
      }

      const user = await Users.create(doc)

      if (user.userId) {
        const payload = {
          email: user.email,
          sub: user.userId,
          accType: user.accountType,
        }
        const token = await generateToken(payload)
        return {
          code: CREATED,
          message: 'Register success',
          success: true,
          data: {
            accessToken: token,
          },
        }
      } else {
        throw {
          code: INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          success: false,
        }
      }
    }
  } catch (error) {
    return error
  }
}

const loginUser = async data => {
  try {
    const constraints = loginRule
    const checkValidation = await validation(data, constraints)
    if (checkValidation) {
      throw {
        code: BAD_REQUEST,
        message: checkValidation,
        success: false,
      }
    } else {
      const user = await Users.findOne({ email: data.email })
      if (!user) {
        throw {
          code: NOT_FOUND,
          message: 'User not exist',
          success: false,
        }
      } else {
        if (user.passwordLength === 0) {
          throw {
            code: BAD_REQUEST,
            message: 'Password not match',
            success: false,
          }
        } else {
          const checkPassword = await checkMatch(data.password, user.password)
          if (checkPassword) {
            const payload = {
              email: user.email,
              sub: user.userId,
              accType: user.accountType,
            }
            const token = await generateToken(payload)
            return {
              code: OK,
              message: 'Login success',
              success: true,
              data: {
                accessToken: token,
              },
            }
          } else {
            throw {
              code: BAD_REQUEST,
              message: 'Password not match',
              success: false,
            }
          }
        }
      }
    }
  } catch (error) {
    return error
  }
}

const authenticateGoogle = async data => {
  try {
    const user = await Users.findOne({ email: data.email })
    if (user) {
      const payload = {
        email: user.email,
        sub: user.userId,
        accType: user.accountType,
      }
      const token = await generateToken(payload)
      return {
        code: OK,
        message: 'Authenticate Success',
        success: true,
        data: {
          accessToken: token,
        },
      }
    } else {
      const picture = await Uploader(data.imageUrl)
      const doc = {
        userId: uuid(),
        name: data.name,
        email: data.email,
        accountType: accType.google,
        passwordLength: 0,
        picture: picture,
      }

      const newUser = await Users.create(doc)

      if (newUser.userId) {
        const payload = {
          email: newUser.email,
          sub: newUser.userId,
          accType: newUser.accountType,
        }
        const token = await generateToken(payload)
        return {
          code: OK,
          message: 'Authenticate Success',
          success: true,
          data: {
            accessToken: token,
          },
        }
      } else {
        throw {
          code: INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          success: false,
        }
      }
    }
  } catch (error) {
    return error
  }
}

const authenticateFacebook = async data => {
  try {
    const user = await Users.findOne({ email: data.email })
    if (user) {
      const payload = {
        email: user.email,
        sub: user.userId,
        accType: user.accountType,
      }
      const token = await generateToken(payload)
      return {
        code: OK,
        message: 'Authenticate Success',
        success: true,
        data: {
          accessToken: token,
        },
      }
    } else {
      const picture = await Uploader(data.imageUrl)
      const doc = {
        userId: uuid(),
        name: data.name,
        email: data.email,
        accountType: accType.facebook,
        passwordLength: 0,
        picture: picture,
      }

      const newUser = await Users.create(doc)

      if (newUser.userId) {
        const payload = {
          email: newUser.email,
          sub: newUser.userId,
          accType: newUser.accountType,
        }
        const token = await generateToken(payload)
        return {
          code: OK,
          message: 'Authenticate Success',
          success: true,
          data: {
            accessToken: token,
          },
        }
      } else {
        throw {
          code: INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          success: false,
        }
      }
    }
  } catch (error) {
    return error
  }
}

const authenticateGithub = async data => {
  try {
    const { code } = data

    const params = {
      client_id: githubConfig.clientKey,
      client_secret: githubConfig.clientSecret,
      code,
    }

    const gh = await axios.post(
      `${ghAccesTokenUrl}?client_id=${params.client_id}&client_secret=${params.client_secret}&code=${params.code}`
    )

    const str = gh.data

    var ghToken = str.substring(
      str.lastIndexOf('access_token='),
      str.lastIndexOf('&scope')
    )

    if (ghToken.length > 0) {
      const newToken = ghToken.replace('access_token=', '')
      const user = await axios.get(ghApi, {
        headers: { Authorization: 'token ' + newToken },
      })

      const newData = user.data

      const alreadyJoin = await Users.findOne({ email: newData.email })
      if (alreadyJoin) {
        const payload = {
          email: alreadyJoin.email,
          sub: alreadyJoin.userId,
          accType: alreadyJoin.accountType,
        }
        const token = await generateToken(payload)
        return {
          code: OK,
          message: 'Authenticate Success',
          success: true,
          data: {
            accessToken: token,
          },
        }
      } else {
        const picture = await Uploader(newData.avatar_url)
        const doc = {
          userId: uuid(),
          name: newData.name,
          email: newData.email,
          bio: newData.bio,
          picture: picture,
          accountType: accType.github,
          passwordLength: 0,
        }

        const newUser = await Users.create(doc)

        if (newUser.userId) {
          const payload = {
            email: newUser.email,
            sub: newUser.userId,
            accType: newUser.accountType,
          }
          const token = await generateToken(payload)
          return {
            code: OK,
            message: 'Authenticate success',
            success: true,
            data: {
              accessToken: token,
            },
          }
        } else {
          throw {
            code: INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            success: false,
          }
        }
      }
    } else {
      throw {
        code: INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        success: false,
      }
    }
  } catch (error) {
    return error
  }
}

const updateProfile = async (userId, data) => {
  try {
    const user = await Users.findOne({ userId: userId })
    if (!user) {
      throw {
        code: NOT_FOUND,
        message: 'Users not found',
        success: false,
      }
    } else {
      let pass
      let img

      if (data.password) {
        const salt = await generateSalt(10)
        pass = await encrypt(data.password, salt)
      } else {
        pass = user.password
      }

      if (validURL(data.picture)) {
        img = user.picture
      } else {
        const deleteImg = await DeleteImage(user.picture.public_id)
        if (deleteImg) {
          img = await Uploader(data.picture)
        } else {
          img = user.picture
        }
      }

      const doc = {
        name: data.name,
        email: data.email,
        picture: img,
        password: pass ? pass : user.password,
        passwordLength: data.password.length
          ? data.password.length
          : user.passwordLength,
        bio: data.bio,
        phoneNumber: data.phoneNumber,
      }

      const updateuser = await Users.updateOne({ userId: userId }, doc)

      if (updateuser) {
        return {
          code: OK,
          message: 'Update success',
          success: true,
        }
      } else {
        throw {
          code: INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          success: false,
        }
      }
    }
  } catch (error) {
    return error
  }
}

const getProfile = async userId => {
  try {
    const user = await Users.findOne({ userId: userId })

    if (!user) {
      throw {
        code: NOT_FOUND,
        message: 'User not found',
        success: false,
      }
    } else {
      const data = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        bio: user.bio,
        picture: user.picture.secure_url,
        password: '*'.repeat(user.passwordLength),
        phoneNumber: user.phoneNumber,
      }

      return {
        code: OK,
        message: 'Get profile success',
        success: true,
        data: data,
      }
    }
  } catch (error) {
    return error
  }
}

export {
  registerUser,
  loginUser,
  authenticateFacebook,
  authenticateGithub,
  authenticateGoogle,
  updateProfile,
  getProfile,
}
