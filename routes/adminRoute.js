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
module.exports=router
