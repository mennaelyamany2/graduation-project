const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const Doctor = require('./../models/doctorModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, userType) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    userType,
    isNewUser: user.new,
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (req.body.userType == 'user') {
    const doctor = await Doctor.findOne({ email });
    if (doctor) return next(new AppError(`Duplicate field value : ${email}. Please use another value`, 401));

    const newUser = await User.create(req.body);
    createSendToken(newUser, 200, res, 'user');
  } else if (req.body.userType == 'doctor') {
    const user = await User.findOne({ email });
    if (user) return next(new AppError(`Duplicate field value : ${email}. Please use another value`, 401));

    const newDoctor = await Doctor.create(req.body);
    createSendToken(newDoctor, 201, res, 'doctor');
  } else
    res.status(401).json({
      status: 'fail',
      message: 'please provide userType [user | doctor]',
    });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  let userType = 'user';
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = await Doctor.findOne({ email }).select('+password');
    userType = 'doctor';
  }
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  user.photo = undefined;
  createSendToken(user, 200, res, userType, req);
});
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    token = auth.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError('You are not logged in! Please log in to get access.', 401));

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  let currentUser;
  currentUser = await User.findById(decoded.id);
  if (!currentUser) currentUser = await Doctor.findById(decoded.id);

  if (!currentUser) return next(new AppError(`The user beloging to this token does no longer exist.`, 401));

  // 4) Check if user changeed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError(`${req.userType} recently cahnged password! Please log in again.`, 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  req.userType = currentUser.role;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  let user;
  const { email } = req.body;
  user = await User.findOne({ email });
  if (!user) user = await Doctor.findOne({ email });

  if (!user) return next(new AppError(`There is no user with email address`, 404));
  // 2) Generate random token
  const resetOTP = user.createPasswordResetOTP();
  await user.save({ validateBeforeSave: false });
  // 3) Send it back as an email
  try {
    // await new Email(user, resetOTP).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      // message: 'OTP sent to email!',
      message: 'Stopped sending otp to the email because it takes long time (until finding a way to enhance it)',
      resetOTP,
    });
  } catch (error) {
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email, Try again later!', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the otp
  const { OTP } = req.body;
  const hashedOTP = crypto.createHash('sha256').update(OTP.toString()).digest('hex');
  let user;

  user = await User.findOne({
    passwordResetOTP: hashedOTP,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user)
    user = await Doctor.findOne({
      passwordResetOTP: hashedOTP,
      passwordResetExpires: { $gt: Date.now() },
    });

  // 2) If OTP has not expired, set the new password
  if (!user) {
    return next(new AppError('OTP is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changePasswordAt

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res, req.userType, req);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  let user;
  if (req.userType === 'user') {
    user = await User.findById(req.user.id).select('+password');
  } else if (req.userType === 'doctor') {
    user = await Doctor.findById(req.user.id).select('+password');
  }
  // 2) Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your current password is wrong', 401));
  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, res, req.userType, req);
});
exports.signWithGoogle = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError('Please provide a google email', 400));
  let user = await User.findOne({ email });
  if (!user) {
    req.body.password = 'google-password';
    req.body.passwordConfirm = 'google-password';
    user = await User.create(req.body);
    user.new = true;
  } else user.new = false;
  createSendToken(user, 200, res, 'user');
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action', 403));
    next();
  };
};
