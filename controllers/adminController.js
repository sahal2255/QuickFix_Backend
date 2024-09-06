const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Category=require('../models/categories');
const Vendor = require('../models/vendor');
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
    console.log('Category add route found');
    try {
        console.log('Form data:', req.body.categoryName);

        const { categoryName } = req.body;

        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const newCategory = new Category({ categoryName });

        await newCategory.save();

        console.log('Category Name:', categoryName);
        
        
        res.status(200).json({ message: 'Category added successfully',newCategory });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: 'Error adding category' });
    }
};

const categoryGet = async (req, res) => {
    try {
        // Fetch all categories from the database
        const categories = await Category.find();
        
        // Send the categories as a response
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

const deleteCategory = async (req, res) => {
    console.log('delete category route found');
    
    try {
      const categoryId = req.params.id;
      const deletedCategory = await Category.findByIdAndDelete(categoryId);
  
      if (!deletedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      res.status(200).json({ message: 'Category deleted successfully', category: deletedCategory });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting category', error });
    }
  };
  

  const getVendorList = async (req, res) => {
    try {
      const vendorList = await Vendor.find();  
      console.log(vendorList);
      res.status(200).json(vendorList);  
    } catch (error) {
      console.log('Error getting vendor list:', error);
      res.status(500).json({ message: 'Failed to fetch vendor list' });
    }
  };
  

const updateVendorStatus=async(rerq,res)=>{
    const vendorList = await Vendor.findOneAndUpdate()
}

const adminLogout = (req, res) => {
    res.clearCookie('token'); 
    return res.status(200).json({ message: 'Logout successful' });
};
module.exports = {
    adminLogin,
    adminLogout,
    categoryAdd,
    categoryGet,
    deleteCategory,
    getVendorList
};
