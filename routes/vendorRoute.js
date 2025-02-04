const express=require('express')
const router=express.Router()
const vendorController=require('../controllers/vendorController')
const authMiddleware=require('../middleware/authMiddleware')
const upload =require('../utils/multer')



router.post('/register',upload.single('image'),vendorController.VendorRegister)
router.post('/login',vendorController.vendorLogin)
router.post('/verify-otp', upload.single('image'), vendorController.VerifyOTP);
router.post('/logout',authMiddleware,vendorController.vendorLogout)
router.get('/categoryget',vendorController.getCategories)
router.post('/addService',authMiddleware,upload.single('image'),vendorController.addService)
router.get('/serviceget',authMiddleware,vendorController.serviceGet)
router.get('/profile',authMiddleware,vendorController.vendorProfile)
router.put('/updateprofile',upload.single('image'),authMiddleware,vendorController.editVendorProfile)
router.put('/updateservice/:id',upload.single('image'),authMiddleware,vendorController.updateService)
router.get('/bookedservices',authMiddleware,vendorController.bookedServices)
router.get('/singlebooking/:bookingid',authMiddleware,vendorController.singleBooking)
router.put('/updatecompletion',authMiddleware,vendorController.updateCompletion)
router.put('/updateservicestatus',authMiddleware,vendorController.updateServiceStatus)
router.post('/addcoupon',upload.none(),authMiddleware,vendorController.AddCoupon)
router.get('/coupons',authMiddleware,vendorController.couponGet)
router.put('/editcoupon/:editcouponid',upload.none(),authMiddleware,vendorController.editCoupon)
router.delete('/deletecoupon/:couponid',authMiddleware,vendorController.deleteCoupon)
router.get('/monthlydetails',authMiddleware,vendorController.monthlyDetails)
router.get('/bookingbydates',authMiddleware,vendorController.fetchByDates)
module.exports=router