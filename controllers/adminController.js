const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const adminLogin = async (req, res) => {
    console.log('admin login');
    const { email, password } = req.body;  
    console.log('logging', req.body);

    try {
        
        const admin = await Admin.findOne({ email });
        console.log('admin:', admin);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or incorrect password' });
        }

        const token = jwt.sign(
            { userId: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('Generated token:', token);
        res.cookie('token', token);
        
        return res.status(200).json({message:'Admin founded successfully', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login error' });
    }
};
const adminLogout = (req, res) => {
    res.clearCookie('token'); 
    return res.status(200).json({ message: 'Logout successful' });
};
module.exports = {
    adminLogin,
    adminLogout
};
