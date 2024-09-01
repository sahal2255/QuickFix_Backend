const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const cloudinary = require("../services/cloudinaryConfig");
const otpService = require("../services/sendOtp"); // Corrected import
const bcrypt = require("bcrypt");
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

      let imageUrl = "";

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
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { vendorId: vendor._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set the token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: 'Login successful', success: true });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
  
const vendorLogout=(req,res)=>{
  console.log('entering logout');
  
  res.clearCookie('token')
  return res.status(200).json({message:'Logout Successful'})
}

module.exports = {
  VendorRegister,
  VerifyOTP,
  vendorLogin,
  vendorLogout
};
