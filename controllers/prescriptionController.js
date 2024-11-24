const Prescription = require('./../models/prescriptionModel');
const User = require('./../models/userModel');
const Doctor = require('./../models/doctorModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


exports.createPrescription = catchAsync(async (req, res, next) => {
    const {userID, status, medications} = req.body;
    const prescription = await Prescription.create({
        user: userID,
        doctor: req.user.id,
        status,
        medications,
        date: Date.now()
    });


    if(!prescription) return next(new AppError("Error occurred while creating a prescription", 500));
    res.status(201).json({
        status:'success',
        prescription
    });
});

exports.getPrescription = catchAsync(async (req, res, next) => {
    let prescription;
    const uid = req.params.uid;
    if(req.user.role === 'user')
        prescription = await Prescription.findOne({doctor: uid, user: req.user._id}).populate('user', 'fullName').populate('doctor', 'fullName specialization');
   if(req.user.role === 'doctor')
        prescription = await Prescription.findOne({user: uid, doctor: req.user._id}).populate('user', 'fullName').populate('doctor', 'fullName specialization');

    if(!prescription) return next(new AppError("Prescription not found", 404));
    res.status(200).json({
        status:'success',
        prescription
    });
})

exports.updatePrescription = catchAsync(async (req, res, next) =>{
    const {userID} = req.body;
    if(!userID) return next(new AppError('Please provide user id', 400));
    req.body.date =  Date.now()
    const prescription = await Prescription.findOneAndUpdate({doctor: req.user._id, user: userID}, req.body, {
        new: true,
        runValidators: true
    });


    if(!prescription) return next(new AppError("Error occurred while updating a prescription Or it's not found", 500));
    res.status(201).json({
        status:'success',
        prescription
    });

})