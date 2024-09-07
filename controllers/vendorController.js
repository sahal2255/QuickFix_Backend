const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const cloudinary = require("../services/cloudinaryConfig");
const otpService = require("../services/sendOtp"); // Corrected import
const bcrypt = require("bcrypt");
const Category = require("../models/categories");
const pendingOTPs = {};

const VendorRegister = async (req, res) => {
  try {
    console.log('Received Form Data:', req.body);
    console.log('Received Files:', req.file);

    const { name, email, phoneNumber, password, regId, location } = req.body;
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
      const { name, phoneNumber, password, regId, location } = req.body;

      if (!name || !phoneNumber || !password || !regId || !location) {
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

      const newVendor = new Vendor({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        regId,
        location,
        image: imageUrl,
      });
      console.log("New Vendor:", newVendor);

      await newVendor.save();

      const token = jwt.sign(
        { vendorId: newVendor._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, {
        maxAge: 3600000
      });

      res.status(201).json({ message: "Vendor registered successfully.", token, success: true });
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

  
const vendorLogout=(req,res)=>{
  console.log('entering logout');
  
  res.clearCookie('token')
  return res.status(200).json({message:'Logout Successful'})
}

const getCategories=async(req,res)=>{
  console.log('loging to the getcategory');
  try{
    const categories=await Category.find()
    console.log('vender category get',categories);
    res.status(200).json(categories);
    
  }catch(error){
    console.log('category found error');
    
  }
  
}
const addService = async (req, res) => {
  try {
    console.log('found the add service section');

    const { categoryType, serviceName, price, duration } = req.body;
    console.log('form data:', req.body);
    
    const image = req.file; 

    console.log('image file found',image);
    

    // if (!image) {
    //   return res.status(400).json({ error: 'Image is required' });
    // }
    // console.log('uploaded image:', image);

    // const result = await cloudinary.uploader.upload(image.path, {
    //   folder: 'QuickFix',
    // });

    // const imageUrl = result.secure_url;
    // console.log('Cloudinary image URL:', imageUrl);


    // res.status(201).json({ message: 'Service added successfully', imageUrl });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
};



module.exports = {
  VendorRegister,
  VerifyOTP,
  vendorLogin,
  vendorLogout,
  getCategories,
  addService
};
