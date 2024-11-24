const mongoose = require('mongoose');
const validator = require('validator');
const model = require('./../controllers/modelsContoller');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  role: {
    type: String,
    default: 'doctor',
  },
  fullName: {
    type: String,
    required: [true, 'Please provide your  name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  photo: {
    type: String,
    default: 'https://static.vecteezy.com/system/resources/previews/023/023/170/non_2x/colored-avatar-of-doctor-icon-illustration-vector.jpg',
  },
  video: {
    type: String,
    required: [true, 'Please upload a short video introducing yourself'],
  },
  card: {
    type: String,
  },
  specialization: {
    type: String,
    enum: [
      'Cardiology',
      'Dermatology',
      'Orthopedics',
      'Oncology',
      'Neurology',
      'Pediatrics',
      'Gynecology',
      'Psychiatry',
      'Endocrinology',
      'Urology',
    ],
  },
  address: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  age: {
    type: String,
  },
  ticketPrice: {
    type: Number,
    default: 0,
  },
  phoneNumber: {
    type: String,
  },
  ratingAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  yearsExperience: {
    type: Number,
  },
  about: {
    type: String,
    trim: true,
  },
  passwordChangedAt: Date,
  passwordResetOTP: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: false,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  city:{
    type: String,
    default: 'Portsaid',
  },
  area: String,
  hospital : String,

startWorkingTime:{
  type: String,
  default: "9:00"
},
endWorkingTime:{
  type: String,
  default: "5:00"
}
  
});

doctorSchema.pre('save', function (next) {
  // Check if fullName exists and if it doesn't start with "Dr"
  if (this.fullName && !this.fullName.startsWith('Dr')) {
    // Add "Dr" prefix to fullName
    this.fullName = `Dr ${this.fullName}`;
  }
  next();
});

// doctorSchema.pre('findOneAndUpdate', model.encryptPhoto);
doctorSchema.pre('save', model.encryptPassword);
doctorSchema.pre('save', model.passwordChangedAt);
doctorSchema.pre(/^find/, model.getOnlyActive);

// doctorSchema.methods.decryptPhoto = model.decryptPhoto;
doctorSchema.methods.correctPassword = model.correctPassword;
doctorSchema.methods.changedPasswordAfter = model.changedPasswordAfter;
doctorSchema.methods.createPasswordResetOTP = model.createPasswordResetOTP;

module.exports = mongoose.model('Doctor', doctorSchema);
