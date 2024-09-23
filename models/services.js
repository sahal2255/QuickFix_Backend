const mongoose=require('mongoose')

const ServiceSchema=new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,  
        ref: 'Vendor',  
        required: true 
      },
    categoryType:{type:String,required:true},
    serviceName:{type:String,required:true},
    price:{type:String,required:true},
    duration:{type:String,required:true},
    serviceImage:{type:String}
})

const Service=mongoose.model('Service',ServiceSchema)

module.exports=Service