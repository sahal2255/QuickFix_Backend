const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  regId: { type: String, required: true },
  location: { type: String, required: true },
  isEnabled:{ type: Boolean, default: false },
  image: { type: String }, 
  amenities: { type: [String], default: [] }
});

const Vendor = mongoose.model('Vendor', VendorSchema);

module.exports = Vendor;
