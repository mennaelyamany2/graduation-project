const auth = require('./../controllers/auth');

const router = require('express').Router({
  caseSensitive: false,
  mergeParams: false,
  strict: false,
});

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/google', auth.signWithGoogle);
router.post('/forgotPassword', auth.forgotPassword);
router.patch('/resetPassword', auth.resetPassword);
router.patch('/updateMyPassword', auth.protect, auth.updatePassword);

module.exports = router;
