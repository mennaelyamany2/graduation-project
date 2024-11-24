const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

const availableTimeSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  slotDuration: {
    type: Number, // Assuming the slot duration is represented in minutes
    required: true
  },
  availability: [TimeSlotSchema] // Embed TimeSlotSchema directly in the availability array
});

const availableTimeModel = mongoose.model("available-time", availableTimeSchema);

module.exports = availableTimeModel;
