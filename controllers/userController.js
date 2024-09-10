const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const { generateAccessToken, generateRefreshToken } = require('../utils/authToken');

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
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 5 * 60 * 1000)  // 5 minutes
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        return res.status(200).json({ message: 'User logged in successfully' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login error' });
    }
}

const refreshToken = async (req, res) => {
   
    const { refreshToken } = req.cookies;  // Get refresh token from cookies
    console.log('refresh token get ',req.cookies);
    
    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token not found. Please log in again.' });
    }

    try {
        // Find the user with the provided refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token. Please log in again.' });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, userPayload) => {
            if (err) {
                // Refresh token is invalid, log the user out
                user.refreshToken = null;
                user.save();  // Clear the refresh token
                return res.status(403).json({ message: 'Invalid refresh token. Please log in again.' });
            }

            // If refresh token is valid, generate a new access token
            const newAccessToken = generateAccessToken({ id: userPayload.id, email: userPayload.email });
            console.log(newAccessToken);
            
            // Send the new access token in the response
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                expires: new Date(Date.now() + 15 * 60 * 1000)  // Access token valid for 15 minutes
            });

            return res.status(200).json({ message: 'Access token refreshed successfully' });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const userLogout = async (req, res) => {
    const user = req.user 
    console.log(user,'hi')
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({ message: 'No refresh token found' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }

        user.refreshToken = null;
        await user.save();

        // Clear cookies
        res.cookie('accessToken', '', { httpOnly: true, secure: true, sameSite: 'Strict', expires: new Date(0) });
        res.cookie('refreshToken', '', { httpOnly: true, secure: true, sameSite: 'Strict', expires: new Date(0) });

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const CheckAuth = async (req, res) => {
    const user = req.user; 

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized: No user found' });
    }

    return res.status(200).json({ message: 'Authenticated', user });
};


const service=async (req,res)=>{

    
}


module.exports = {
    userSignup,
    userLogin,
    refreshToken,
    userLogout,
    CheckAuth
};
