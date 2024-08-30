const mongoose=require('mongoose')


const adminShema=new mongoose.Schema({
    email: { type: String, require: true },
    password: { type: String, required: true } 

})

const Admin=mongoose.model('Admin',adminShema)
module.exports=Admin