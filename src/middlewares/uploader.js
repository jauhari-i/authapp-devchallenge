import { v2 as Cloudinary } from 'cloudinary'
import { getConfig } from '../config/global_config'

const cloudinaryConfig = getConfig('/cloudinaryConfig')

Cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
})

const Uploader = async imgstr => {
  const img = await Cloudinary.uploader.upload(imgstr, {
    overwrite: true,
    invalidate: true,
  })

  return img
}

const DeleteImage = async img => {
  const del = await Cloudinary.uploader.destroy(img)

  return del
}

export { Uploader, DeleteImage }
