const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  regId: { type: String, required: true },
  category:{type:String,required:true},
  location: { type: String, required: true },
  isEnabled:{ type: Boolean, default: false },
  image: { type: String }, 
  amenities: { type: [String], default: [] },
  coupons: [
    {
      couponName: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      percentage: { type: Number, required: true }
    }
  ]
});

const Vendor = mongoose.model('Vendor', VendorSchema);

module.exports = Vendor;
