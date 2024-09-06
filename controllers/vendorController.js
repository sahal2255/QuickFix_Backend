const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const cloudinary = require("../services/cloudinaryConfig");
const otpService = require("../services/sendOtp"); // Corrected import
const bcrypt = require("bcrypt");
const Category = require("../models/categories");
const pendingOTPs = {};

const VendorRegister = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, regId, location } = req.body;
    const image = req.files?.image;

    if (image) {
      const result = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: "QuickFix",
      });

      const otp = otpService.generateOTP();
      console.log(otp);
      otpService.storeOTP(email, otp); // Store OTP for validation later
      await otpService.sendOTP(email, otp); // Send OTP to user

      pendingOTPs[email] = otp;

      res
        .status(200)
        .json({
          message:
            "OTP sent to email. Please verify your OTP to complete registration.",
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
    const { email, otp, formData } = req.body;
    console.log("Received Email:", email);
    console.log("Received OTP:", otp);
    console.log("Received Form Data:", formData);

    const storedOtp = pendingOTPs[email]?.toString();
    const receivedOtp = otp?.toString();

    console.log("Stored OTP:", storedOtp);
    console.log("Received OTP:", receivedOtp);

    if (storedOtp === receivedOtp) {
      console.log("Entered condition", pendingOTPs[email]);

      const { name, phoneNumber, password, regId, location } = formData;
      console.log("Form details:", formData);

      if (!name || !phoneNumber || !password || !regId || !location) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let imageUrl = "https://www.shutterstock.com/image-photo/mechanic-using-wrench-while-working-600nw-2184125681.jpg";

      const imageFileArray = formData.image[0];
      console.log("imageFileArray:", imageFileArray);

      if (imageFileArray && imageFileArray.length > 0) {
        const imageFile = imageFileArray[0];
        console.log('Entering Cloudinary upload condition with file:', imageFile);

        const result = await cloudinary.uploader.upload(
          imageFile.tempFilePath || imageFile.path || imageFile,
          {
            folder: "QuickFix",
          }
        );

        console.log("Cloudinary upload result:", result);

        imageUrl = result.secure_url; 
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      const newVendor = new Vendor({
        name,
        email,
        phoneNumber,
        password: hashedPassword, // Store the hashed password
        regId,
        location,
        image: imageUrl, // Store the uploaded image URL
      });
      console.log("New Vendor:", newVendor);

      await newVendor.save();

      // Generate a JWT token
      const token = jwt.sign(
        { vendorId: newVendor._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Set the token as a cookie
      res.cookie("token", token, {
        maxAge:3600000
      });

      res.status(201).json({ message: "Vendor registered successfully.",token, success: true });
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
const addService=async(req,res)=>{
  console.log('found the add service section ');
  
  
}


module.exports = {
  VendorRegister,
  VerifyOTP,
  vendorLogin,
  vendorLogout,
  getCategories,
  addService
};
