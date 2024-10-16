// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Function to send booking confirmation email
const sendBookingConfirmationEmail = async (email, booking) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Booking Confirmation',
            text: `Hello, \n\nYour booking is confirmed. Here are the details:\n\nBooking ID: ${booking._id}\nTotal Amount: ${booking.totalAmount}\nPaid Amount: ${booking.payedAmount}\n\nThank you for using our service!`
        };

        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent successfully.');
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        // You can choose to not throw an error to avoid failing the booking process if email fails
    }
};

module.exports = { sendBookingConfirmationEmail };
