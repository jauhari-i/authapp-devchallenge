import express from 'express'
import path from 'path'
import { router as Api } from './api'
const router = express.Router()

router.use('/api', Api)

router.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

export { router }
