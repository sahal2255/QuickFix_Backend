const express = require('express');
const userController = require('../controllers/userController');  // Ensure this is correct
const  authenticateToken  = require('../middleware/tokenMiddleware');
const router = express.Router();

router.post('/signup', userController.userSignup);
router.post('/login', userController.userLogin);
router.get('/verify-token', authenticateToken, userController.refreshToken);  // Ensure refreshToken exists
router.post('/logout', authenticateToken, userController.userLogout);
router.get('/profile', authenticateToken, userController.userProfile);
router.get('/services', authenticateToken, userController.service);
router.get('/service/:serviceId', authenticateToken, userController.serviceDetails);
router.put('/editprofile',authenticateToken,userController.editProfile)
router.get('/getcategory',authenticateToken,userController.categoryGet)
router.post('/razorpaypayment',authenticateToken,userController.paymentConfirm)
router.post('/confirm-booking',authenticateToken,userController.confirmationForBooking)
router.get('/servicehistory',authenticateToken,userController.serviceHistory)
router.get('/viewsingledetails/:bookingId',authenticateToken,userController.singleServiceDetails)
router.put('/cancelservice/:bookingId',authenticateToken,userController.cancelBookedService)
module.exports = router;
