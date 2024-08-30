const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const authMiddleware =require('../middleware/authMiddleware')


router.post('/admin/login',adminController.adminLogin)
// router.get('/admin/dashboard',)
router.post('/admin/logout', authMiddleware,adminController.adminLogout);

module.exports=router
