const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A prescription must belong to a user']
    },
    doctor:{
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: [true, 'A prescription must belong to a doctor']
    },
    status: String,
    medications: [String],
    Date:{
        type: Date,
        default: Date.now() 
    },
})

const prescriptionModel = mongoose.model('Prescription', prescriptionSchema);
module.exports = prescriptionModel;