const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const springedge=require('springedge')
const { generateAccessToken, generateRefreshToken } = require('../utils/authToken');
const Vendor=require('../models/vendor');
const Service = require('../models/services');
const Categories=require('../models/categories')
const Razorpay = require('razorpay');


const userSignup = async (req, res) => {
    try {
        const { username, useremail, phonenumber, password } = req.body;
        if (!username || !useremail || !phonenumber || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await User.findOne({ email: useremail });
        if (existingUser) {
            console.log('already exist');
            
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            userName: username,
            email: useremail,
            phoneNumber: phonenumber,
            password: hashedPassword,
            isEnable: true
        });

        await newUser.save();
        console.log('new user',newUser);
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log('Signup error:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
};

const userLogin = async (req, res) => {
    console.log('login route found');
    const { useremail, password } = req.body;  
    console.log('logging', req.body);

    try {
        
        
        console.log('searching with email');
        const user = await User.findOne({ email: useremail});
        console.log('user:', user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        const userpayload={id:user._id,email:user.email}
        const accessToken=generateAccessToken(userpayload)
        const refreshToken=generateRefreshToken(userpayload)
        console.log('accessToken',accessToken)
        console.log('refreshToken',refreshToken);



        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('accessToken', accessToken, {
            httpOnly: false,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 5 * 60 * 1000)  // 5 minutes
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: false,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        });

        return res.status(200).json({ message: 'User logged in successfully' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login error' });
    }
}

const refreshToken = async (req, res) => {
    const accessToken = req.cookies.accessToken; // Get access token from cookie
    console.log('hello',accessToken)
    const  refreshToken  = req.cookies.refreshToken; // Get refresh token from cookie
  console.log('hail',refreshToken);
  
    // Check if access token is available
    if (accessToken) {
        console.log('Access token is already present in the cookie.');
        return res.status(200).json({ message: 'Access token is still valid.' });
    }
  
    // If no access token, check for the refresh token
    if (!refreshToken) {
        console.log('Refresh token missing. Please log in again.');
        return res.status(403).json({ message: 'Refresh token missing. Please log in again.' });
    }
  
    try {
        console.log('Verifying refresh token...');
        const user = await User.findOne({ refreshToken });
        
        if (!user) {
            console.log('Invalid refresh token.');
            return res.status(403).json({ message: 'Invalid refresh token.' });
        }
  
        // Verify the refresh token
        jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, userPayload) => {
            if (err) {
                console.log('Invalid refresh token. Please log in again.');
                return res.status(403).json({ message: 'Invalid refresh token. Please log in again.' });
            }
  
            // Generate a new access token
            const newAccessToken = jwt.sign(
                { id: userPayload.id, email: userPayload.email },
                process.env.ACCESS_SECRET,
                { expiresIn: '5m' }
            );

            // Set the new access token in the cookie
            res.cookie('accessToken', newAccessToken, {
                httpOnly: false,
                secure: true,
                sameSite: 'None',
                expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
            });

            console.log('New access token created:', newAccessToken);
            return res.status(200).json({ message: 'Access token refreshed successfully' });
        });
    } catch (error) {
        console.error('Server error during token refresh:', error);
        return res.status(500).json({ message: 'Server error during token refresh' });
    }
};





const userLogout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({ message: 'No refresh token found' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }

        // Clear the refresh token in the database
        user.refreshToken = null;
        await user.save();

        // Clear the cookies for accessToken and refreshToken
        res.cookie('accessToken', '', { httpOnly: true, secure: true, sameSite: 'Strict', expires: new Date(0) });
        res.cookie('refreshToken', '', { httpOnly: true, secure: true, sameSite: 'Strict', expires: new Date(0) });

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const userProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        const user = await User.findById(userId).select('-password -refreshToken'); // Exclude password field for security
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const service = async (req, res) => {
    console.log('Request received');
    
    let { search, categories } = req.query; // Receive both search and categories
    console.log('Search query:', search);
    console.log('Selected categories:', categories);
    
    try {
        let Services;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (categories) {
            const categoryArray = categories.split(','); // Split the comma-separated categories string into an array
            query.category = { $in: categoryArray };
        }

        Services = await Vendor.find(query);

        // Send the response
        res.status(200).json(Services);
    } catch (error) {
        console.log('Error fetching services:', error);
        res.status(500).json({ message: 'Error fetching services' });
    }
};


 const serviceDetails=async(req,res)=>{
    const {serviceId}=req.params
    console.log('params id',serviceId);
    
    try{
        const Details=await Vendor.findById(serviceId)
        const ServiceTypes=await Service.find({vendorId:serviceId})
        console.log('all service types',ServiceTypes);
        
        res.status(200).json({Details,ServiceTypes})

    }catch(error){
        console.error(error)
    }
    
 }
 const editProfile=async(req,res)=>{
    const {userName,email,phoneNumber}=req.body
    const userId=req.user.id
    try{
        const updatedProfile=await User.findByIdAndUpdate(userId,
            {
                userName:userName,
                email:email,
                phoneNumber:phoneNumber
            },
            {
                new:true
            }
        )
        console.log('updated user profile',updatedProfile)
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedProfile
          });
    }catch(error){
        console.log('Profile updation error',error)
    }
 }

 const categoryGet = async (req, res) => {
    console.log('Hitting category route');
    try {
        const categories = await Categories.find(); 
        res.status(200).json(categories); 
    } catch (error) {
        console.log('Category fetching error:', error);
        res.status(500).json({ error: 'Error fetching categories' }); 
    }
}



// const confirmationForBooking = async (req, res) => {
//     const { centerId, selectedServiceTypesDetails, totalPrice, paymentOption, formData } = req.body;
//     console.log('Form data:', formData);

//     try {
//         // Step 1: Validate the service details
//         const selectedServiceTypeId = selectedServiceTypesDetails.map(service => service._id);
//         const matched = await Service.find({
//             vendorId: centerId,
//             '_id': { $in: selectedServiceTypeId }
//         });

//         const TotalPrice = matched.map(item => Number(item.price));
//         const Total = TotalPrice.reduce((acc, cur) => acc + cur);

//         if (Total === totalPrice) {
//             console.log('Total prices match');
//         } else {
//             return res.status(400).json({ error: 'Price mismatch' });
//         }

//         console.log('Payment option:', paymentOption);

//         // Step 2: Extract phone number from formData
//         let phoneNumber = formData.phoneNumber;
//         if (!phoneNumber) {
//             return res.status(400).json({ error: 'Phone number is required' });
//         }

//         // Step 3: Format phone number with country code (+91 for India)
//         let formattedPhone = phoneNumber.trim();
//         if (!formattedPhone.startsWith('+91')) {
//             formattedPhone = '+91' + formattedPhone;
//         }

//         // Step 4: Generate OTP
//         const generateOtp = () => {
//             return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
//         };
        
//         const otp = generateOtp(); // Generate the OTP

//         // Step 5: Send OTP via Spring Edge
//         const message = `Hello ${otp}, This is a test message from spring edge `; // Construct the message

//         const params = { 
//             'sender': 'SEDEMO', // Ensure 'SEDEMO' is a valid sender ID
//             'apikey': '621492a44a89m36c2209zs4l7e74672cj', // Replace with your actual SpringEdge API key
//             'to': [formattedPhone], // Phone number with country code
//             'message': message, // Your SMS message
//             'format': 'json' // Format can be 'json' or 'xml'
//         };
//         console.log('params',params)
//         springedge.messages.send(params, 5000, function (err, response) {
//             if (err) {
//                 console.error('Error occurred while sending SMS:', err);
//                 return res.status(500).json({ error: 'Failed to send OTP', details: err });
//             }
//             console.log('Response from SpringEdge:', response);
        
//             if (response.status === 'AWAITED-DLR') {
//                 console.warn('Delivery report awaited. The message may not be delivered yet.');
//             } else if (response.status === 'success') {
//                 console.log('Message sent successfully.');
//                 return res.status(200).json({ message: 'OTP sent successfully', otp });
//             } else {
//                 console.error('SpringEdge API Error:', response);
//                 return res.status(500).json({ error: 'Failed to send OTP', details: response });
//             }
//         });

//     } catch (error) {
//         console.log('Error:', error);
//         return res.status(500).json({ error: 'Internal server error', details: error });
//     }
// };


const paymentConfirm = async (req, res) => {
    try {
        const { paymentAmount } = req.body;
        console.log('Payment Amount:', paymentAmount);

        var instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Create an order object with payment amount (convert to smallest currency unit e.g. paise for INR)
        const options = {
            amount: paymentAmount * 100, // paymentAmount in the smallest currency unit
            currency: "INR",
            receipt: "receipt#1", // optional, can be dynamically generated
        };

        // Create a new order
        const order = await instance.orders.create(options);
        console.log('Order:', order);

        // Respond with the order details
        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Error in paymentConfirm:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
        });
    }
};


const confirmationForBooking=async(req,res)=>{
    const { centerId, selectedServiceTypesDetails, totalPrice, paymentOption,paymentMethod,OrderAmount, formData } = req.body;
    console.log('center id',centerId)
    console.log('formData',formData)
    console.log('payment method',paymentMethod)
    console.log('order amount',OrderAmount/100)
    try{
        const selectedServiceTypeId = selectedServiceTypesDetails.map(service => service._id);
        const matched = await Service.find({
            vendorId: centerId,
            '_id': { $in: selectedServiceTypeId }
        });

        const TotalPrice = matched.map(item => Number(item.price));
        const Total = TotalPrice.reduce((acc, cur) => acc + cur);

        if (Total === totalPrice) {
            console.log('Total prices match');
        } else {
            return res.status(400).json({ error: 'Price mismatch' });
        }

        console.log('Payment option:', paymentOption);
    }catch(error){
        console.log('error for confirming booking',error)
    }
}


module.exports = {
    userSignup,
    userLogin,
    refreshToken,
    userLogout,
    userProfile,
    service,
    serviceDetails,
    editProfile,
    categoryGet,
    paymentConfirm,
    confirmationForBooking
};
