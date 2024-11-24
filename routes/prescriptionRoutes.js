const auth = require('./../controllers/auth');
const prescription = require('./../controllers/prescriptionController');

const router = require('express').Router({});

router.use(auth.protect);

router.post('/', auth.restrictTo('doctor'), prescription.createPrescription);
router.get('/:uid', prescription.getPrescription);
router.patch('/', auth.restrictTo('doctor'), prescription.updatePrescription);

module.exports = router;