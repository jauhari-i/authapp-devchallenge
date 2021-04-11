import timeStamp from 'mongoose-timestamp'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  passwordLength: {
    type: Number,
    default: 0,
  },
  picture: {
    type: Object,
    default: {},
  },
  accountType: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    required: false,
    default: '',
  },
})

userSchema.plugin(timeStamp)

const User = mongoose.model('users', userSchema)

export default User
