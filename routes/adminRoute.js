const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const authMiddleware =require('../middleware/authMiddleware')
const multer=require('multer')
const upload = multer();

router.post('/login',adminController.adminLogin)
router.post('/logout', authMiddleware,adminController.adminLogout);
router.post('/categoryAdd',upload.none(),authMiddleware,adminController.categoryAdd)
router.get('/categories',authMiddleware,adminController.categoryGet)
router.delete('/deleteCategory/:id',authMiddleware,adminController.deleteCategory)
router.put('/updatevendorstatus',authMiddleware,adminController.updateVendorStatus)
router.get('/vendorlist',authMiddleware,adminController.getVendorList)
router.put('/updatecategory',upload.none(), adminController.editCategory);
router.get('/userlist',authMiddleware,adminController.userGet)
router.put('/updateuserstatus',authMiddleware,adminController.updateUserStatus)
router.get('/bookingdetails',authMiddleware,adminController.bookingGet)
router.get('/monthlydetails',authMiddleware,adminController.monthlyRevenueAndBookings)
router.get('/datebybooking',authMiddleware,adminController.fetchByDates)
module.exports=router
