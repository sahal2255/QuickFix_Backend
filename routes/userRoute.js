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

module.exports = router;
