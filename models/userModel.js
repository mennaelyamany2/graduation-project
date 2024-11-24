const mongoose = require('mongoose');
const validator = require('validator');
const model = require('./../controllers/modelsContoller');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },

  photo: {
    type: String,
    default: 'https://static.vecteezy.com/system/resources/thumbnails/009/734/564/small_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg',
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  age: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetOTP: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  notifcation: {
    type: Array,
    default: [],
  },
  seennotification: {
    type: Array,
    default: [],
  },
  savedDoctors: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Doctor',
      required: [true, 'Bookmark must belong to a doctor'],
    },
  ],
});

// userSchema.pre('findOneAndUpdate', model.encryptPhoto);
userSchema.pre('save', model.encryptPassword);
userSchema.pre('save', model.passwordChangedAt);
userSchema.pre(/^find/, model.getOnlyActive);

// userSchema.methods.decryptPhoto = model.decryptPhoto;
userSchema.methods.correctPassword = model.correctPassword;
userSchema.methods.changedPasswordAfter = model.changedPasswordAfter;
userSchema.methods.createPasswordResetOTP = model.createPasswordResetOTP;

module.exports = mongoose.model('User', userSchema);
