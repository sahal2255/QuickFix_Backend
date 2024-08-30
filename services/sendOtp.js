// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });



// const sendOTP = async (email, otp) => {
//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code',
//         text: `Your OTP code is ${otp}. It will expire in ${process.env.OTP_EXPIRY}.`,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log('OTP sent successfully');
//     } catch (error) {
//         console.error('Failed to send OTP:', error);
//         throw new Error('Failed to send OTP');
//     }
// };

// module.exports = sendOTP;
const nodemailer = require('nodemailer');
require('dotenv').config();

const otpService = {
  otpMap: new Map(),
  otpExpiry: parseInt(process.env.OTP_EXPIRY) || 3 * 60 * 1000, // Default to 3 minutes if not set

  // Generate a 6-digit OTP
  generateOTP: function () {
    return Math.floor(100000 + Math.random() * 900000);
  },

  // Send OTP via email
  sendOTP: async function (email, otp) {
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
        subject: 'Login OTP',
        text: `Your OTP for login is: ${otp}`
      };

      await transporter.sendMail(mailOptions);
      console.log('OTP sent successfully.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Error sending OTP. Please try again.');
    }
  },

  // Store OTP with expiration
  storeOTP: function (email, otp) {
    this.otpMap.set(email, { otp, timestamp: Date.now() });
    // Optional: Set a timeout to expire OTP after a certain period
    setTimeout(() => this.otpMap.delete(email), this.otpExpiry);
  },

  // Verify OTP
  verifyOTP: function (email, otp) {
    const storedOTP = this.otpMap.get(email);

    if (storedOTP && storedOTP.otp === otp && (Date.now() - storedOTP.timestamp) < this.otpExpiry) {
      this.otpMap.delete(email); // Clear OTP after successful verification
      return true;
    } else {
      return false;
    }
  }
};

module.exports = otpService;

