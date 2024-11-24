const User = require('../models/userModel');
const Doctor = require('./../models/doctorModel');
const AppError = require('../utils/appError');
const catchAsyn = require('../utils/catchAsync');
const filterObj = require('./../utils/filterObj');
const factory = require('./handlerFactory');
const Appointment = require('../models/appointmentModel');
const DoctorAvailability = require('../models/availableTime');
const catchAsync = require('../utils/catchAsync');
const moment = require('moment'); 
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for password updated, Please use /updateMyPassword', 400));

  // 2) Filterd out unwanted fields name that are not allowd to be updated
  const filterdBody = filterObj(req.body, 'password', 'passwordConfirm');
  if (req.file) filterdBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findOneAndUpdate({ _id: req.user.id }, filterdBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Function to convert day name to its index
const dayOfWeekToIndex = (dayName) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return daysOfWeek.indexOf(dayName);
};



// Function to book an appointment
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, userId, userName, age, phoneNumber, date, time } = req.body;

    // Split date into day of the week, month, day, and year
    const dateParts = date.split(', ');
    if (dateParts.length !== 3) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const [dayName, monthDay, year] = dateParts;
    const dayOfWeek = dayName.trim();
    const [monthName, dayOfMonth] = monthDay.trim().split(' ');

    // Validate day of the week
    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayOfWeek)) {
      return res.status(400).json({ message: 'Invalid day of the week' });
    }

    // Convert date string to Date object
    const months = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11
    };

    const parsedDate = new Date(year, months[monthName], dayOfMonth);
    if (parsedDate.toString() === 'Invalid Date') {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Fetch the doctor's availability
    const doctorAvailability = await DoctorAvailability.findOne({ doctorId });

    if (!doctorAvailability) {
      return res.status(404).json({ message: 'Doctor availability not found' });
    }

    const { availability, slotDuration } = doctorAvailability;

    // Check availability for the given day
    const dayAvailabilities = availability.filter(avail => avail.dayOfWeek === dayOfWeek);
    if (dayAvailabilities.length === 0) {
      return res.status(400).json({ message: 'Doctor is not available on the selected day' });
    }

    // Convert time to 24-hour format for comparison
    const appointmentTime24h = convertTo24Hour(time);
    const [appointmentHour, appointmentMinute] = appointmentTime24h.split(':').map(Number);
    const appointmentTotalMinutes = appointmentHour * 60 + appointmentMinute;

    let timeAvailable = false;

    // Check if the time is within the available slots
    for (const dayAvailability of dayAvailabilities) {
      const [startHour, startMinute] = convertTo24Hour(dayAvailability.startTime).split(':').map(Number);
      const [endHour, endMinute] = convertTo24Hour(dayAvailability.endTime).split(':').map(Number);

      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;

      if (appointmentTotalMinutes >= startTotalMinutes && appointmentTotalMinutes < endTotalMinutes) {
        timeAvailable = true;
        break;
      }
    }

    if (!timeAvailable) {
      return res.status(400).json({ message: 'The selected time is outside the available time slots' });
    }

    // Check for existing appointment
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time: appointmentTime24h
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'The selected time is already booked' });
    }

    // Create the appointment
    const newAppointment = new Appointment({
      doctorId,
      userId,
      userName,
      age,
      phoneNumber,
      date,
      time: appointmentTime24h,
      status: 'Booked'
    });

    // Save the appointment
    await newAppointment.save();

    res.status(201).json({
      status: 'success',
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });

  } catch (err) {
    next(err);
  }
};


// Function to convert 24-hour time to AM/PM format
const convertTo12Hour = (time24h) => {
  let [hours, minutes] = time24h.split(':').map(Number);
  const modifier = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12; // Convert to 12-hour format, handling midnight and noon
  return `${hours}:${minutes.toString().padStart(2, '0')} ${modifier}`;
};

exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const selectedDate = req.query.date;

    // Convert date to a day of the week string
    const dateObj = new Date(selectedDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekString = daysOfWeek[dateObj.getDay()];

    console.log(`Selected Date: ${selectedDate}`);
    console.log(`Day of Week String: ${dayOfWeekString}`);

    // Fetch the available time slots for the specified doctor
    const doctorAvailability = await DoctorAvailability.findOne({ doctorId });

    if (!doctorAvailability) {
      console.log(`No availability found for doctor ID: ${doctorId}`);
      return res.status(404).json({ message: 'Doctor availability not found' });
    }

    console.log(`Doctor Availability: ${JSON.stringify(doctorAvailability)}`);

    const { availability, slotDuration } = doctorAvailability;

    if (!availability || availability.length === 0) {
      console.log(`No availability data found for doctor ID: ${doctorId}`);
      return res.status(200).json({
        status: 'success',
        availableSlots: [],
        message: 'No availability data found'
      });
    }

    const dayAvailability = availability.find(avail => avail.dayOfWeek === dayOfWeekString);

    if (!dayAvailability) {
      console.log(`No availability found for day: ${dayOfWeekString}`);
      return res.status(200).json({
        status: 'success',
        availableSlots: [],
        message: `No availability found for the selected date (${selectedDate})`
      });
    }

    const { startTime, endTime } = dayAvailability;
    if (!startTime || !endTime) {
      console.log(`Missing start or end time for day: ${dayOfWeekString}`);
      return res.status(200).json({
        status: 'success',
        availableSlots: [],
        message: `No valid time slots available for the selected date (${selectedDate})`
      });
    }

    // Convert start and end times to minutes
    const [startHour, startMinute] = convertTo24Hour(startTime).split(':').map(Number);
    const [endHour, endMinute] = convertTo24Hour(endTime).split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const availableSlots = [];

    // Iterate over each time slot for the day
    for (let i = startTotalMinutes; i < endTotalMinutes; i += slotDuration) {
      const hour = Math.floor(i / 60);
      const minute = i % 60;
      const timeString = convertTo12Hour(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      availableSlots.push(timeString);
    }

    console.log(`Available Slots: ${JSON.stringify(availableSlots)}`);

    // Return the available time slots
    res.status(200).json({
      status: 'success',
      availableSlots,
      message: `Available time slots for ${selectedDate}`
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};



// Ensure the convertTo24Hour function is available
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
    return time12h; // Assuming it's in 24-hour format already
  }
};



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


exports.getAppointmentsByUserIdAndDate = catchAsync(async (req, res, next) => {
  const { userId, date } = req.params;

  // Fetch appointments for the given user and date
  const appointments = await Appointment.find({ userId, date });

  if (appointments.length === 0) {
    return res.status(404).json({
      status: 'fail',
      message: 'No appointments found for this date and user'
    });
  }

  // Fetch doctor names for the appointments
  const doctorPromises = appointments.map(async (appointment) => {
    const doctor = await Doctor.findById(appointment.doctorId);
    return {
      ...appointment.toObject(), // Convert mongoose document to plain object
      doctorName: doctor ? doctor.name : 'Unknown Doctor'
    };
  });

  // Wait for all doctor names to be fetched
  const appointmentsWithDoctorNames = await Promise.all(doctorPromises);

  const formattedAppointments = appointmentsWithDoctorNames.map(appointment => ({
    time: appointment.time,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName, // Add doctor name here
    age: appointment.age,
    phoneNumber: appointment.phoneNumber,
    status: appointment.status
  }));

  res.status(200).json({
    status: 'success',
    appointments: formattedAppointments
  });
});


exports.getAppointmentsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Find appointments for the specific user and populate doctorId with necessary details
    const appointments = await Appointment.find({ userId })
    .select('doctorId date time') // Select necessary fields from Appointment model
      .populate('doctorId', 'fullName specialization photo _id') // Include photo field

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this user' });
    }

    // // Map the result to get required fields
    // const appointmentDetails = appointments.map(appointment => {
    //   if (!appointment.doctorId) {
    //     return null; // Skip appointments where doctorId is null
    //   }

    //   const { doctorId, date, time } = appointment;
    //   const { fullName: doctorName, specialization, photo: doctorPhoto } = doctorId;
    //   return { doctorName, specialization, date, time, doctorPhoto };
    // }).filter(detail => detail !== null); // Filter out null results

    // if (appointmentDetails.length === 0) {
    //   return res.status(404).json({ message: 'No valid appointments found for this user' });
    // }

    res.status(200).json({
      status: 'success',
      appointments
    });

  } catch (err) {
    next(err);
  }
};



exports.bookmarkDoctor = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!user || !doctor) {
    return next(new AppError('User or Doctor not found', 404));
  }
  if (user.savedDoctors.includes(doctor._id)) {
    return res.status(400).json({ message: 'Doctor already bookmarked' });
  }
  user.savedDoctors.push(doctor._id);
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'Doctor bookmarked successfully',
  });
});

exports.removeBookmarkedDoctor = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!user || !doctor) {
    return next(new AppError('User or Doctor not found', 404));
  }
  if (!user.savedDoctors.includes(doctor._id)) {
    return res.status(400).json({ status: 'fail', message: "Doctor isn't bookmarked" });
  }
  user.savedDoctors = user.savedDoctors.filter((id) => id.toString() !== doctor._id.toString());
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'Doctor unbookmarked successfully',
  });
});

exports.getAllBookmarks = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-_id savedDoctors').populate({
    path: 'savedDoctors',
    select: 'fullName photo specialization address ratingAverage startWorkingTime endWorkingTime',
  });
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      length: user.savedDoctors.length,
      user,
    },
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User /*, 'savedDoctors'*/);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
