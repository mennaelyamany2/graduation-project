const express = require('express');
const userController = require('./../controllers/userController');
const auth = require('./../controllers/auth');

const router = express.Router({
  caseSensitive: false,
  mergeParams: false,
  strict: false,
});

router.use(auth.protect);
// profile
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
//Appointments
router.get('/getAvailableTimeSlots/:doctorId', auth.protect,  userController.getAvailableTimeSlots);
router.get('/appointments/:userId/:date', auth.protect,  userController.getAppointmentsByUserIdAndDate);
router.get('/appointments/:userId', auth.protect,  userController.getAppointmentsByUser);
router.post('/appointment', auth.protect, userController.bookAppointment);

router.delete('/cancelAppointment/:appointmentId', auth.protect, userController.cancelAppointment);



// Bookmarks
router.get('/bookmarkedDoctors', userController.getAllBookmarks);
router
  .route('/bookmarkedDoctors/:doctorId')
  .post(userController.bookmarkDoctor)
  .delete(userController.removeBookmarkedDoctor);

router.route('/').get(userController.getAllUsers);

router.use(auth.restrictTo('admin'));
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
