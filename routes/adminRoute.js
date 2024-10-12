const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const authMiddleware =require('../middleware/authMiddleware')
const multer=require('multer')
const upload = multer();

router.post('/admin/login',adminController.adminLogin)
router.post('/admin/logout', authMiddleware,adminController.adminLogout);
router.post('/admin/categoryAdd',upload.none(),authMiddleware,adminController.categoryAdd)
router.get('/admin/categories',authMiddleware,adminController.categoryGet)
router.delete('/admin/deleteCategory/:id',authMiddleware,adminController.deleteCategory)
router.put('/admin/updatevendorstatus',authMiddleware,adminController.updateVendorStatus)
router.get('/admin/vendorlist',authMiddleware,adminController.getVendorList)
router.put('/admin/updatecategory',upload.none(), adminController.editCategory);
router.get('/admin/userlist',authMiddleware,adminController.userGet)
router.put('/admin/updateuserstatus',authMiddleware,adminController.updateUserStatus)
router.get('/admin/bookingdetails',authMiddleware,adminController.bookingGet)
router.get('/admin/monthlydetails',authMiddleware,adminController.monthlyRevenueAndBookings)
router.get('/admin/datebybooking',authMiddleware,adminController.fetchByDates)
module.exports=router
