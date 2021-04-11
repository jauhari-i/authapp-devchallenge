import Confidence from 'confidence'
import dotenv from 'dotenv'
dotenv.config()

const config = {
  port: process.env.PORT,
  basicAuthApi: [
    {
      username: process.env.BASIC_AUTH_USERNAME,
      password: process.env.BASIC_AUTH_PASSWORD,
    },
  ],
  publicKey: process.env.PUBLIC_KEY_PATH,
  privateKey: process.env.PRIVATE_KEY_PATH,
  mongoDbUrl: process.env.MONGO_DATABASE_URL,
  mysqlConfig: {
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  cloudinaryConfig: {
    apiKey: process.env.CLOUD_API_KEY,
    apiSecret: process.env.CLOUD_API_SECRET,
    cloudName: process.env.CLOUD_NAME,
  },
  githubConfig: {
    clientSecret: process.env.GITHUB_SECRET,
    clientKey: process.env.GITHUB_CLIENT,
  },
}

const store = new Confidence.Store(config)

export const getConfig = key => {
  return store.get(key)
}
