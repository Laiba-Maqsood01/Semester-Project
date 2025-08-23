const nodemailer = require('nodemailer');
require('dotenv').config(); // it will load env vars from .env



const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS    
    },
});

function sendMail(to, subject, html){
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    })
    .then(info =>{
        console.log(`Email sent to ${to}: ,${info.response}`);
        return info;
    })
   .catch(error =>{
    console.error(`Email failed to ${to},  error`);
    throw error;
   });
}

module.exports = sendMail;