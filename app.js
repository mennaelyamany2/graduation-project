const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandeler = require('./controllers/errorController');
const bodyParser = require('body-parser');
const session = require('express-session');

// Routers
const userRouter = require('./routes/userRoutes');
const doctorRouter = require('./routes/doctorRoutes');
const authRouter = require('./routes/authRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const paymentRouter = require('./routes/paymentRoute');
const prescriptionRouter = require('./routes/prescriptionRoutes');

// App
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Enable trust proxy to properly handle forwarded headers

// Global Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serving static files
app.use(helmet()); // set security HTTP headers
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(
  hpp({
    whitelist: ['ratingsQuantity', 'ratingAverage'],
  }),
); // Prevent parameter pollution
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); //Limit requests from same API,  Because of DOS and Brute Force Attacks
// app.use(xss());

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/prescription', prescriptionRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandeler);

module.exports = app;
