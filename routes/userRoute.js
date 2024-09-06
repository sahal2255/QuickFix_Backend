const express=require('express')
const userController = require('../controllers/userController')
const { authenticateToken } = require('../middleware/tokenMiddleware')
const router=express.Router()


router.post('/signup',userController.userSignup)
router.post('/login',userController.userLogin)
router.post('/verify-token',userController.refreshToken)
router.get('/CheckAuth',authenticateToken,userController.CheckAuth)
router.post('/logout',authenticateToken,userController.userLogout)

module.exports=router