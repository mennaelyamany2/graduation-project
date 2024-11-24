
const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const auth = require('./../controllers/auth')


// Create an order
router.post('/pay/:appointmentID',auth.protect, paymentController.pay)
router.post('/callback', paymentController.callback);


module.exports = router;
