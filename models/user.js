const mongoose=require('mongoose')

const UserSchema=mongoose.Schema({
    userName:{type:String,required:true},
    email:{type:String,required:true},
    phoneNumber:{type:String,required:true},
    password:{type:String,required:true},
    isEnable:{type:Boolean,default:true},
    refreshToken: { type: String }
})

const User=mongoose.model('User',UserSchema)

module.exports=User