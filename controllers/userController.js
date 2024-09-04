const bcrypt = require('bcrypt');
const User = require('../models/user');

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

const userLogin = async (req,res)=>{
    console.log('loginroute founded');
    try{
        console.log(req.body)
    }catch(error){
        console.log('login backend erro',error);
        
    }
    
}

module.exports = {
    userSignup,
    userLogin
};
