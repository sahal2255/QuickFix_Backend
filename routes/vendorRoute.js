const express=require('express')
const router=express.Router()
const vendorController=require('../controllers/vendorController')
const authMiddleware=require('../middleware/authMiddleware')

const { route } = require('./adminRoute')
const fileUpload = require('express-fileupload')
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/' 
  }))


router.post('/vendor/register',vendorController.VendorRegister)
router.post('/vendor/login',vendorController.vendorLogin)
router.post('/vendor/verify-otp', vendorController.VerifyOTP);
router.post('/vendor/logout',vendorController.vendorLogout)


module.exports=router