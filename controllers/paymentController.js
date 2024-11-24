const catchAsync = require('../utils/catchAsync');
const Appointment = require('./../models/appointmentModel');
const AppError = require('./../utils/appError');
// Create an order
exports.pay = catchAsync(async (req, res, next) => {
    const {appointmentID} = req.params;
    const appointment = await Appointment.findById(appointmentID);
    if(!appointment)
        return next(new AppError('Appointment not fount', 404));
    let { amount } = req.body;

  
   
    amount *= 100;
    const first_name = req.user.fullName.split(" ")[0] || "undefined", last_name = req.user.fullName.split(" ")[1] || ".", email = req.user.email, phone_number = req.user.phoneNumber || "undefined";
    const billing_data = {
        first_name,
        last_name, 
        email,
        phone_number,
        street: "NA",
        conuntry: "Egypt"
    }
    const data = {
        amount,
        currency: "EGP",
        payment_methods: [4598810, "card"],
        items: [
            {
              name: "Appointment",
              amount,
              description: "Appointment with Doctor",
              quantity: 1,
              id: req.params.appointmentID
            }
          ],
        customer:{
            first_name,
            last_name, 
            email,
            extras:{
                re: "22"
            }
        },
        billing_data,
        extras: {
            ee: null
        },
    }
    
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Token ${process.env.paymobSecretTest}`);

    const raw = JSON.stringify(data);
    const requestOptions = { 
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    }

    const response = await fetch("https://accept.paymob.com/v1/intention/", requestOptions);
    const resl = await response.json();

    appointment.intentionID = resl.id;
    await appointment.save();
    
    const paymentKey = resl.payment_keys[0].key;
    res.json({ paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/852794?payment_token=${paymentKey}` });
});


exports.callback = catchAsync(async (req, res, next) => {
   
    if(req.body.transaction.success) {
   
        const appointment = await Appointment.findOne({intentionID: req.body.intention.id});
        if(!appointment) return next(new AppError("Appintment not found", 400));
        appointment.paid = true;
        await appointment.save();
        
     }

     res.end();
});



