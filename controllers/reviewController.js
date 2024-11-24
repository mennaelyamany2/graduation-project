const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');

exports.setDoctorUserIds = (req, res, next) => {
  req.body.user = req.user;
  req.body.doctor = req.params.doctorId;
  next();
};

exports.getDoctorReviews = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;
  const reviews = await Review.find({ doctor: doctorId }).select('-__v -doctor');
  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
