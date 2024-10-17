const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const springedge=require('springedge')
const { generateAccessToken, generateRefreshToken } = require('../utils/authToken');
const Vendor=require('../models/vendor');
const Service = require('../models/services');
const Categories=require('../models/categories')
const Razorpay = require('razorpay');
const Booking=require('../models/booking')
const {sendBookingConfirmationEmail}=require('../services/emailService')
const {OAuth2Client}=require('google-auth-library')



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
        if (!user.isEnabled) {
            return res.status(403).json({ message: 'User account is disabled' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('matched')
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


const confirmationForBooking = async (req, res) => {
    const { centerId, selectedServiceTypesDetails, totalPrice, paymentOption, paymentMethod, OrderAmount, formData } = req.body;
    const userId = req.user.id; // Assume req.user.id is available through authentication middleware
    console.log('formdata',formData)
    try {
        const selectedServiceTypeId = selectedServiceTypesDetails.map(service => service._id);

        const matched = await Service.find({
            vendorId: centerId,
            '_id': { $in: selectedServiceTypeId }
        });

        const TotalPrice = matched.map(item => Number(item.price));
        const calculatedTotalPrice = TotalPrice.reduce((acc, cur) => acc + cur);

        const PayableAmount = OrderAmount / 100;

        // Validate if the total prices match
        if (calculatedTotalPrice !== totalPrice) {
            return res.status(400).json({ error: 'Price mismatch' });
        }

        console.log('Prices match, proceeding with booking.');

        const { paymentId, ownerName, phoneNumber, vehicleReg } = formData;

        const balanceAmount = totalPrice - PayableAmount;

        const newBooking = new Booking({
            userId: userId,
            vendorId: centerId, 
            serviceTypeIds: selectedServiceTypeId, 
            ownerName: ownerName, 
            mobileNumber: phoneNumber, 
            regNo: vehicleReg, 
            paymentMethod: paymentMethod, 
            paymentOption: paymentOption, 
            totalAmount: totalPrice.toString(),
            payedAmount: PayableAmount.toString(), 
            paymentId: paymentId, 
            balanceAmount: balanceAmount.toString() 
        });

        // Save the booking to the database
        await newBooking.save();

        const userData=await User.findById(userId)
        const userEmail=userData.email
        console.log('user email',userEmail)


        await sendBookingConfirmationEmail(userEmail, newBooking);
        // Respond with success message
        res.status(200).json({
            message: 'Booking confirmed and payment received.',
            booking: newBooking
        });
    } catch (error) {
        console.error('Error during booking confirmation:', error);
        res.status(500).json({ error: 'Error confirming booking.' });
    }
};

const serviceHistory=async(req,res)=>{
    const userId=req.user.id
    console.log('userId',userId)
    try{
        const serviceHistory=await Booking.find({userId})
        console.log('serviceHistory',serviceHistory)
        res.status(200).json(serviceHistory)
    }catch(error){
        console.log('service history error',error)
    }
}

const singleServiceDetails = async (req, res) => {
    console.log('hitting single service details route');
    const { bookingId } = req.params; // Get bookingId from request params
    console.log('Booking ID:', bookingId);

    try {
        // Fetch the single booking details using the booking ID
        const singleBooking = await Booking.findById(bookingId);

        if (!singleBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        console.log('Fetched single details:', singleBooking);

        // Fetch the service type details based on the serviceTypeIds array in the booking
        const serviceTypeDetails = await Service.find({
            _id: { $in: singleBooking.serviceTypeIds } // Use $in to match all IDs in the array
        });
        console.log('service type details',serviceTypeDetails)

        res.status(200).json({
            booking: singleBooking,
            serviceTypes: serviceTypeDetails // Return the service types
        });
    } catch (error) {
        console.log('Error fetching single booking details or service types:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const cancelBookedService=async(req,res)=>{
    const {bookingId}=req.params
    try{
        const bookedService=await Booking.findById(bookingId)
        if(!bookedService){
            return res.status(404).json({message:'booking is not found'})
        }        
        bookedService.serviceStatus='Cancelled'
        await bookedService.save()


        console.log('Service cancelled successfully:', bookedService);
        return res.status(200).json({ message: 'Service cancelled successfully', booking: bookedService });
    }catch(error){
        console.log('error for cancel service')
    }
}

const loginWithGoogle=async(req,res)=>{
    console.log('hitting to the signup with google login')
    const {responseToken}=req.body
    console.log('response token in the body',responseToken)
    try {
        const ticket=await client.verifyIdToken({
            idToken:responseToken,
            audience:process.env.GOOGLE_CLIENT_ID
        })
        const payload=ticket.getPayload()
        // console.log('payload',payload)
        const {email,name}=payload
        let user=await User.findOne({email})
        console.log('user',user)
        if (!user) {
            user = new User({
                userName: name,
                email: email,
                isGoogleUser: true, 
            });
            await user.save();
        }

        const userPayload = { id: user._id, email: user.email };
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

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
        return res.status(200).json({
            message: 'User logged in successfully',
            // user: {
            //     id: user._id,
            //     email: user.email,
            //     userName: user.userName,
            //     isGoogleUser: true,
            // },
        });
        
    } catch (error) {
        
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
    confirmationForBooking,
    serviceHistory,
    singleServiceDetails,
    cancelBookedService,
    loginWithGoogle
};
