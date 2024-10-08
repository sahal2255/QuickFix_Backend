const mongoose = require('mongoose');

// Define the Booking Schema
const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model, assuming you have one
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to Vendor model, assuming you have one
    required: true,
  },
  serviceTypeIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType', // Reference to the service type model
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
  serviceStatus: {
    type: String,
    enum: ['Pending','Confirmed', 'In Progress','Awaiting Parts','Ready For Pickup', 'Cancelled','Completed','Payment Pending','Closed'], // Define possible statuses
    default: 'Pending',
  },
  completedServiceTypes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType',
    }
  ],
}, { timestamps: true }); 

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
