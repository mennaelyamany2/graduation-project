const express = require('express');
const auth = require('./../controllers/auth');
const reviewController = require('./../controllers/reviewController');

const router = express.Router({
  mergeParams: true,
});

router.use(auth.protect);

router
  .route('/')
  .post(auth.restrictTo('user'), reviewController.setDoctorUserIds, reviewController.createReview)
  .get(reviewController.getDoctorReviews);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(auth.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(auth.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
