const mongoose=require('mongoose')

const UserSchema=mongoose.Schema({
    userName:{type:String,required:false},
    email:{type:String,required:true},
    phoneNumber:{type:String,required:false},
    password:{type:String,required:false},
    isEnabled:{type:Boolean,default:true},
    refreshToken: { type: String }
})

const User=mongoose.model('User',UserSchema)

module.exports=User