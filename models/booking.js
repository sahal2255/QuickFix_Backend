const mongoose = require('mongoose');

// Define the Booking Schema
const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Optional: Reference to User model, assuming you have one
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor', // Optional: Reference to Vendor model, assuming you have one
    required: true,
  },
  serviceTypeIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType', // Reference to the service type model, assuming you have one
      required: true,
    }
  ],
  ownerName: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  regNo: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentOption: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: String,
    required: true,
  },
  payedAmount: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  balanceAmount: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // Add timestamps to track createdAt and updatedAt

// Create the Booking model
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
