const express=require('express')
const router=express.Router()
const vendorController=require('../controllers/vendorController')
const authMiddleware=require('../middleware/authMiddleware')
const upload =require('../utils/multer')


// const { route } = require('./adminRoute')
// const fileUpload = require('express-fileupload')
// router.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: '/tmp/' 
//   }))


router.post('/vendor/register',upload.single('image'),vendorController.VendorRegister)
router.post('/vendor/login',vendorController.vendorLogin)
router.post('/vendor/verify-otp', upload.single('image'), vendorController.VerifyOTP);

router.post('/vendor/logout',authMiddleware,vendorController.vendorLogout)
router.get('/vendor/categoryget',vendorController.getCategories)
router.post('/vendor/addService',authMiddleware,upload.single('image'),vendorController.addService)
router.get('/vendor/serviceget',authMiddleware,vendorController.serviceGet)
router.get('/vendor/profile',authMiddleware,vendorController.vendorProfile)
router.put('/vendor/updateprofile',upload.single('image'),authMiddleware,vendorController.editVendorProfile)

module.exports=router