const express = require('express');
const doctorController = require('./../controllers/doctorController');
const auth = require('./../controllers/auth');
const reviewRouter = require('./reviewRoutes');

const router = express.Router({
  caseSensitive: false,
  mergeParams: false,
  strict: false,
});

router.use('/:doctorId/reviews', reviewRouter);

// Protect All routes come after
router.get('/me', auth.protect, doctorController.getMe, doctorController.getDoctor);
router.patch('/updateMe', auth.protect, doctorController.updateMe);
router.delete('/deleteMe', auth.protect, doctorController.deleteMe);

router.post('/available-time',auth.protect,doctorController.postAvailableTimeSlots);
router.get('/appointments/:doctorId/:date',auth.protect,doctorController.getAppointmentsByDoctorIdAndDate);
router.get('/appointments/:doctorId',auth.protect,doctorController.getAppointmentsByDoctor);

router.delete('/cancelAppointment/:appointmentId',auth.protect,doctorController.cancelAppointment)

// //Only admins can use the next middlewares
// router.use(authController.restrictTo('admin'));
router.route('/').get(doctorController.getAllDoctors);

router
  .route('/:id')
  .get(doctorController.getDoctor)
  .patch(doctorController.updateDoctor)
  .delete(doctorController.deleteDoctor);
module.exports = router;
