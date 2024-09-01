const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const adminLogin = async (req, res) => {
    console.log('admin login');
    const { email, password } = req.body;  
    console.log('logging', req.body);

    try {
        // Find admin by email
        const admin = await Admin.findOne({ email });
        console.log('admin:', admin);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (password !== admin.password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign(
            { userId: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        console.log('Generated token:', token);

        res.cookie('token', token, { 
            maxAge: 3600000  // 1 hour in milliseconds
        });

        return res.status(200).json({ message: 'Admin logged in successfully', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login error' });
    }
};


const categoryAdd = async (req, res) => {
    console.log('category added route founded');
    try {
        
        console.log('Form data:', req.body);
    
        const categoryName = req.body.categoryName;
    
        console.log('Category Name:', categoryName);
  
  
      res.status(200).json({ message: 'Category added successfully' });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ message: 'Error adding category' });
    }
  };
  


const adminLogout = (req, res) => {
    res.clearCookie('token'); 
    return res.status(200).json({ message: 'Logout successful' });
};
module.exports = {
    adminLogin,
    adminLogout,
    categoryAdd
};
