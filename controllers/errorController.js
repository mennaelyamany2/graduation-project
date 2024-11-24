const AppError = require('./../utils/appError');

const castErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const duplicateFieldsDB = (err) => {
  const regex = /"([^"]*)"/g;
  const val = err.errmsg.match(regex);
  const message = `Duplicate field value : ${val}. Please use another value`;
  return new AppError(message, 400);
};
const validationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const jwtError = () => new AppError('Invalid token, Please log in again', 401);
const jwtExpiredError = () => new AppError('Your token has expired please log in again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  //Operational, trusted error : send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or other unknown error : don't leak error details
  } else {
    //1) log error
    console.log('ERROR 💥', err);
    //2)send generic message
    res.status(500).json({
      status: 'error',
      message: 'Somthing went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // Jonas access error.name == 'CastError', but now I have no access to the property
    if (err.kind === 'ObjectId') error = castErrorDB(err);
    else if (err.code === 11000) error = duplicateFieldsDB(err);
    else if (err.name === 'ValidationError') error = validationErrorDB(err);
    else if (err.name === 'JsonWebTokenError') error = jwtError();
    else if (err.name === 'TokenExpiredError') error = jwtExpiredError();
    sendErrorProd(error, res);
  }
};
