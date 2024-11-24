const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor' // Replace 'Doctor' with your actual doctor model name if different
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Replace 'User' with your actual user model name if different
  },
  userName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Booked'
  },
  paid: {
    type: Boolean,
    default: false
  },
  intentionID: { type: String, unique: true }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
