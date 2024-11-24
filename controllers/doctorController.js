const Doctor = require('./../models/doctorModel');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const filterObj = require('./../utils/filterObj');
const factory = require('./handlerFactory');
const AvailableTimeModel = require('./../models/availableTime');
const Appointment = require('./../models/appointmentModel');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for password updated, Please use /updateMyPassword', 400));

  const filterdBody = filterObj(req.body, 'password', 'passwordConfirm');

  const updatedDoctor = await Doctor.findByIdAndUpdate(req.user.id, filterdBody, {
    new: true,
    runValidators: true,
  });
  if(!updatedDoctor){
    return next(new AppError(`Doctor not found`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doctor: updatedDoctor,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Doctor.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.postAvailableTimeSlots = catchAsync(async (req, res, next) => {
  const { availability, slotDuration } = req.body;
  const doctorId = req.user.id;

  // Find or create the doctor's availability record
  let doctorAvailability = await AvailableTimeModel.findOne({ doctorId });
  if (!doctorAvailability) {
    doctorAvailability = new AvailableTimeModel({
      doctorId,
      slotDuration,
      availability: []
    });
  }

  // Iterate through the availability slots
  availability.forEach(slot => {
    const { dayOfWeek, startTime, endTime } = slot;

    // Ensure availability is an array
    if (!doctorAvailability.availability) {
      doctorAvailability.availability = [];
    }

    // Find existing day entry or create a new one
    let dayAvailability = doctorAvailability.availability.find(avail => avail.dayOfWeek === dayOfWeek);
    if (!dayAvailability) {
      dayAvailability = {
        dayOfWeek,
        startTime: convertTo24Hour(startTime),
        endTime: convertTo24Hour(endTime)
      };
      doctorAvailability.availability.push(dayAvailability);
    } else {
      // Update existing day entry
      dayAvailability.startTime = convertTo24Hour(startTime);
      dayAvailability.endTime = convertTo24Hour(endTime);
    }
  });

  // Save the updated doctor availability
  await doctorAvailability.save();

  // Convert stored 24-hour times back to AM/PM for the response
  const formattedAvailability = doctorAvailability.availability.map(avail => ({
    dayOfWeek: avail.dayOfWeek,
    startTime: convertTo12Hour(avail.startTime),
    endTime: convertTo12Hour(avail.endTime)
  }));

  res.status(201).json({
    status: 'success',
    message: 'Availability slots added successfully',
    doctorAvailability: {
      ...doctorAvailability.toObject(),
      availability: formattedAvailability
    }
  });
});

// Function to convert AM/PM time to 24-hour format
const convertTo24Hour = (time12h) => {
  const amPmRegex = /(am|pm)$/i;
  if (amPmRegex.test(time12h)) {
    let [time, modifier] = time12h.toLowerCase().split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'pm' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'am' && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    return time12h; // If already in 24-hour format, return as-is
  }
};

// Function to convert 24-hour time to AM/PM format
const convertTo12Hour = (time24h) => {
  let [hours, minutes] = time24h.split(':').map(Number);
  const modifier = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12; // Convert to 12-hour format, handling midnight and noon
  return `${hours}:${minutes.toString().padStart(2, '0')} ${modifier}`;
};



// Function to fetch appointments by doctorId and date
exports.getAppointmentsByDoctorIdAndDate = catchAsync(async (req, res, next) => {
  const { doctorId, date } = req.params; // Destructure the parameters

  // Fetch appointments for the given doctor and date
  const appointments = await Appointment.find({ doctorId, date });

  // Check if any appointments were found
  if (appointments.length === 0) {
    return res.status(404).json({
      status: 'fail',
      message: 'No appointments found for this date and doctor'
    });
  }

  // Format the response
  const formattedAppointments = appointments.map(appointment => ({
    time: appointment.time,
    userName: appointment.userName,
    age: appointment.age,
    phoneNumber: appointment.phoneNumber,
    status: appointment.status
  }));

  res.status(200).json({
    status: 'success',
    appointments: formattedAppointments
  });
});

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Remove the appointment from the doctor's appointments
    await Doctor.updateOne({ _id: appointment.doctorId }, { $pull: { appointments: appointmentId } });

    // Remove the appointment from the user's appointments
    await User.updateOne({ _id: appointment.userId }, { $pull: { appointments: appointmentId } });

    // Delete the appointment
    await Appointment.deleteOne({ _id: appointmentId });

    res.status(200).json({
      status: 'success',
      message: 'Appointment canceled successfully',
    });
  } catch (err) {
    next(err);
  }
};


exports.getAppointmentsByDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;

    // Find appointments for the specific doctor and populate userId with userName and photo
    const appointments = await Appointment.find({ doctorId })
    .select('userId date time')
      .populate('userId', 'fullName photo _id');
      // Select necessary fields

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this doctor' });
    }

    // Map the result to get required fields, handle case where userId may be null
    // const appointmentDetails = appointments.map(appointment => {
    //   if (!appointment.userId) {
    //     return null; // Skip appointments where userId is null
    //   }

    //   const { userId, date, time } = appointment;
    //   const { fullName, photo } = userId;
    //   return { userName: fullName, date, time, photo };
    // }).filter(detail => detail !== null); // Filter out null results

    // if (appointmentDetails.length === 0) {
    //   return res.status(404).json({ message: 'No valid user appointments found for this doctor' });
    // }

    res.status(200).json({
      status: 'success',
      appointments
    });

  } catch (err) {
    next(err);
  }
};









exports.getAllDoctors = factory.getAll(Doctor);
exports.getDoctor = factory.getOne(Doctor);
exports.updateDoctor = factory.updateOne(Doctor);
exports.deleteDoctor = factory.deleteOne(Doctor);
