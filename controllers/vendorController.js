const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const cloudinary = require("../services/cloudinaryConfig");
const otpService = require("../services/sendOtp"); // Corrected import
const bcrypt = require("bcrypt");
const Category = require("../models/categories");
const Service = require("../models/services");
const { service } = require("./userController");
const Booking = require("../models/booking");
const pendingOTPs = {};


// const CategoryGet=async (req,res)=>{
//   try{
//     const Categories=await Category.find()
//     res.status(200).json()

//   }
// }
const VendorRegister = async (req, res) => {
  try {
    console.log('Received Form Data:', req.body);
    console.log('Received Files:', req.file);

    const { name, email, phoneNumber, password, regId, location,amenities } = req.body;
    const image = req.file;

    if (image) {
      const otp = otpService.generateOTP();
      console.log('Generated OTP:', otp);
      otpService.storeOTP(email, otp);
      await otpService.sendOTP(email, otp);

      pendingOTPs[email] = otp;
      console.log(pendingOTPs);
      
      res.status(200).json({
        message: "OTP sent to email. Please verify your OTP to complete registration.",
        success: true,
      });
    } else {
      res.status(400).json({ message: "Image upload failed" });
    }
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const VerifyOTP = async (req, res) => {
  try {
    console.log("Received Form Data:", req.body);
    console.log("Received File:", req.file);
    console.log(pendingOTPs);

    const email = req.body.email[0]?.toLowerCase(); // Handle array and normalize email
    const otp = req.body.otp;

    console.log('Email:', email);
    console.log('OTP:', otp);

    const storedOtp = pendingOTPs[email]?.toString();
    const receivedOtp = otp?.toString();

    console.log('Stored OTP:', storedOtp);
    console.log('Received OTP:', receivedOtp);

    

    if (storedOtp === receivedOtp) {
      const { name, phoneNumber, password, regId,category, location,amenities } = req.body;
      console.log("Amenities:", amenities);

        const selectedAmenities = typeof amenities === 'string' 
        ? amenities.split(',').map(item => item.trim()) // Split and trim each amenity if it's a string
        : Array.isArray(amenities) 
          ? amenities 
          : [];

      console.log("Processed Amenities (after check):", selectedAmenities);
      console.log("Processed Amenities (after check):", selectedAmenities);
      if (!name || !phoneNumber || !password || !regId || !location ||!category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let imageUrl = '';
      if (req.file) {
        const result = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "QuickFix",
          }
        );

        console.log("Cloudinary upload result:", result);
        imageUrl = result.secure_url;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('some');
      
      const newVendor = new Vendor({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        regId,
        category,
        location,
        image: imageUrl,
        amenities:selectedAmenities
      });
      console.log("New Vendor:", newVendor);

      await newVendor.save();

      

      res.status(201).json({ message: "Vendor registered successfully.", success: true });
    } else {
      res.status(400).json({ message: "Invalid or expired OTP." });
    }
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




const vendorLogin = async (req, res) => {
  try {
    console.log('Entering login route');
    const { email, password } = req.body;
    console.log('Request body:', req.body);

    // Find the vendor by email
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      console.log('Vendor not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('Vendor found:', vendor);

    // Check if the vendor's isEnabled status is false
    if (!vendor.isEnabled) {
      console.log('Vendor is under verification:', email);
      return res.status(403).json({ message: 'Your account is under verification. Please wait for approval.' });
    }
    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      console.log('Password mismatch for vendor:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('Password matched for vendor:', email);

    // Sign the JWT token
    const token = jwt.sign(
      { vendorId: vendor._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log('JWT token created successfully');

    // Set cookie for the token
    res.cookie('token', token, {
      maxAge: 3600000, // 1 hour
    });
    console.log('Token cookie set successfully');

    return res.status(200).json({ message: 'Login successful', success: true,token });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  
const vendorLogout = (req, res) => {
  console.log('Entering logout');

  res.clearCookie('token', {
      secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
      sameSite: 'strict', // Prevent CSRF
  });

  // Send a success response
  return res.status(200).json({ message: 'Logout Successful' });
};



const getCategories=async(req,res)=>{
  try{
    const categories=await Category.find()
    // console.log('vender category get',categories);
    res.status(200).json(categories);
    
  }catch(error){
    console.log('category found error');
    
  }
  
}
const addService = async (req, res) => {
  const vendorId = req.admin.vendorId;
  console.log(vendorId)
  try {
    console.log('found the add service section');
    const { categoryType, serviceName, price, duration } = req.body;
    console.log('form data:', req.body);
    const image = req.file; 
    console.log('image file found',image);
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }
    console.log('uploaded image:', image);
    const result = await cloudinary.uploader.upload(image.path, {
      folder: 'QuickFix',
    });

    const imageUrl = result.secure_url;
    console.log('image url',imageUrl);
    

    const newService=new Service({
      vendorId:vendorId,
      categoryType,
      serviceName,
      price,
      duration,
      serviceImage:imageUrl
    })


    console.log('new service',newService)

    await newService.save()


    res.status(201).json({ message: 'Service added successfully',success:true,newService });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
};

const serviceGet=async(req,res)=>{
 const vendorId = req.admin.vendorId;
 try{
  const services = await Service.find({ vendorId });
  console.log('service',services.length);
  
  if (services.length === 0) {
    return res.status(404).json({ message: 'No services found for this vendor' });
  }

  res.status(200).json( services )
 }catch(error){
  console.log('error for getting the vendor added services')
 }
}



const vendorProfile=async(req,res)=>{
  console.log('vendor profile route hitting')
  const vendorId=req.admin.vendorId
  console.log(vendorId)
  try{
    const profileData=await Vendor.findById(vendorId)
    // console.log('vendor profile',profileData)/
    res.status(200).json(profileData)
  }catch(error){
    console.log('error',error)
  }
}

const editVendorProfile = async (req, res) => {
  const vendorId=req.admin.vendorId
  console.log('vendor id',vendorId);
  
  if (!req.body) {
    return res.status(400).json({ message: 'No data provided' });
  }
  const { name, email, phoneNumber, regId, location, amenities } = req.body;
  console.log('Request body:', req.body);
  const imageFile = req.file; // This is the file uploaded by multer
  console.log('Image file:', imageFile);
  let result;
  try {
    if (imageFile) {
      result = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'QuickFix',
      });
      console.log('Image upload result:', result);
    }

    const updatedData = {
      name,
      email,
      phoneNumber,
      regId,
      location,
      amenities,
      ...(result ? { image: result.secure_url } : {}), 
    };
    console.log('updated data',updatedData)
    const vendor = await Vendor.findByIdAndUpdate(vendorId, updatedData, { new: true });
    console.log('vendor',vendor)
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    return res.status(200).json({ message: 'Profile updated successfully', vendor });

  } catch (error) {
    console.error('Error during profile update:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const updateService = async (req, res) => {
  console.log('Hitting the update service endpoint');
  
  const vendorId = req.admin.vendorId; // Vendor ID from authenticated user (admin)
  const serviceId = req.params.id; // Service ID from the route parameter
  console.log('Service ID:', serviceId);

  const { categoryType, serviceName, price, duration } = req.body;
  console.log('Request body:', req.body);

  const imageFile = req.file; // Multer file
  console.log('image file',imageFile);
  
  let result; // For storing the image upload result

  try {
    // If an image file is provided, upload it to Cloudinary
    if (imageFile) {
      result = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'QuickFix',
      });
      console.log('Image upload result:', result);
    }

    // Prepare the updated data, including the image URL if available
    const updatedData = {
      categoryType,
      serviceName,
      price,
      duration,
      ...(result ? { serviceImage: result.secure_url } : {}), // Only add image if uploaded
    };

    console.log('Updated data:', updatedData);

    // Find and update the service with the matching serviceId and vendorId
    const updatedService = await Service.findOneAndUpdate(
      { _id: serviceId, vendorId: vendorId }, // Match both serviceId and vendorId
      { $set: updatedData },
      { new: true } // Return the updated document
    );

    if (!updatedService) {
      return res.status(404).json({ success: false, message: 'Service not found or not authorized to update' });
    }

    // Return success response with the updated service details
    res.status(200).json({ success: true, message: 'Service updated successfully', updatedService });

  } catch (error) {
    console.log('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service', error });
  }
};


const bookedServices=async(req,res)=>{
  const vendorId=req.admin.vendorId
  console.log(vendorId)
  try{
    const bookings=await Booking.find({vendorId})
    console.log('fetched bookings',bookings)
    res.status(200).json(bookings)
  }catch(error){
    console.log('error in fetching the booked srvices',error)
  }
  
}


const singleBooking=async(req,res)=>{
  const bookingId = req.params.bookingid
  try{
    const bookedService=await Booking.findById(bookingId)
    const serviceTypeDetails=await Service.find({
      _id:{$in:bookedService.serviceTypeIds}
    })    
    console.log('type details',serviceTypeDetails)
    console.log('sss',bookedService.completedServiceTypes)
    
    

    res.status(200).json({bookedService,serviceTypeDetails})
  }catch(error){
    console.log('single booking get error',error)
  }
}

const updateCompletion=async(req,res)=>{
  const {serviceTypeId,bookingId}=req.body
  
  try{
    const findBooking=await Booking.findById(bookingId)

    const isIncludeServiceType=findBooking.serviceTypeIds.includes(serviceTypeId)
    if(!isIncludeServiceType){
      console.log('not include the service type')
      return res.status(400).json({message:'Not Include the Service Type'})
    }
    const checkAlreadyCompleted=findBooking.completedServiceTypes.includes(serviceTypeId)
    if(checkAlreadyCompleted){
      console.log('alredy completed')
      return res.status(400).json({message:'Already Completed The Service'})
    }
    findBooking.completedServiceTypes.push(serviceTypeId)
    await findBooking.save()
    res.status(200).json({message:'completion success'})
  }catch(error){
    console.log('error in pushing service to competion',error)
  }
}

const updateServiceStatus=async(req,res)=>{
  console.log('htting the update status ')
  const {bookingId,newStatus}=req.body
  console.log('booking id',bookingId)
  console.log('new status',newStatus)
  try{
    const booking=await Booking.findById(bookingId)
    console.log('founded booking',booking)
    booking.serviceStatus=newStatus
    await booking.save()
    return res.status(200).json({
      message: "Service status updated successfully.",
      updatedStatus: booking.serviceStatus
    });
  }catch(error){
    console.log('status updating error',error)
  }
}


const AddCoupon = async (req, res) => {
  console.log('Hitting the coupon add route');
  const { formData } = req.body;
  console.log('Form data:', formData);
  const vendorId = req.admin.vendorId;
  console.log('Vendor ID:', vendorId);  

  try {
      const { couponName, couponValue, startDate, endDate } = formData;

      if (!couponName || !couponValue || !startDate || !endDate) {
          return res.status(400).json({ message: 'All fields are required' });
      }
      const vendor = await Vendor.findById(vendorId);
      console.log('Vendor:', vendor);  // Log the vendor document
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
      }
      
      const newCoupon = {
          couponName,
          couponValue,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isEnabled: true,
      };

      console.log('New coupon:', newCoupon);
      vendor.coupons.push(newCoupon);
      await vendor.save();
      return res.status(201).json({ message: 'Coupon added successfully', coupon: newCoupon });

  } catch (error) {
      console.error('Error adding coupon:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const couponGet=async(req,res)=>{
  const vendorId=req.admin.vendorId
  console.log('vendor id ',vendorId)
  try{
    const vendor =await Vendor.findById(vendorId)
    console.log('vendor ',vendor)
    const Coupons=vendor.coupons
    // console.log(Coupons)
    res.status(200).json(Coupons)
  }catch(error){
    console.log('error in coupon getting ',error)
  }
}
module.exports = {
  
  VendorRegister,
  VerifyOTP,
  vendorLogin,
  vendorLogout,
  getCategories,
  addService,
  serviceGet,
  vendorProfile,
  editVendorProfile,
  updateService,
  bookedServices,
  singleBooking,
  updateCompletion,
  updateServiceStatus,
  AddCoupon,
  couponGet
};
