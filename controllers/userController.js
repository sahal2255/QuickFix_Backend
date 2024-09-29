const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const { generateAccessToken, generateRefreshToken } = require('../utils/authToken');
const Vendor=require('../models/vendor');
const Service = require('../models/services');
const userSignup = async (req, res) => {
    console.log('Entering the backend for the user signup');

    console.log('Received data:', req.body);

    try {
        const { username, useremail, phonenumber, password } = req.body;

        console.log('Username:', username);
        console.log('Email:', useremail);
        console.log('Phone Number:', phonenumber);

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


// const CheckAuth = async (req, res) => {
//     const user = req.user; 

//     if (!user) {
//         return res.status(401).json({ message: 'Unauthorized: No user found' });
//     }
//     return res.status(200).json({ message: 'Authenticated', user });
// };

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
    
    let { search } = req.query;  
    console.log('Search query:', search);
    
    try {
        let Services;
        
        if (search) {
            Services = await Vendor.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } }, 
                    { location: { $regex: search, $options: 'i' } }, 
                    { category: { $regex: search, $options: 'i' } } 
                ]
            });
        } else {
            Services = await Vendor.find();
        }

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

module.exports = {
    userSignup,
    userLogin,
    refreshToken,
    userLogout,
    // CheckAuth,
    userProfile,
    service,
    serviceDetails,
    editProfile
};
