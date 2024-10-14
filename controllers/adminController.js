const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Category=require('../models/categories');
const Vendor = require('../models/vendor');
const User=require('../models/user');
const Booking = require('../models/booking');

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

const editCategory = async (req, res) => {
    try {
        console.log('Received body:', req.body);

        
      const { categoryId, categoryName } = req.body;
  
      console.log('categoryId:', categoryId);
      console.log('categoryName:', categoryName);
  
      if (!categoryId || !categoryName) {
        return res.status(400).json({ message: 'Category ID and name are required' });
      }
  
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { categoryName },
        { new: true }
      );
  
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      res.json({ updatedCategory, message: 'Category updated successfully' });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Server error' });
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
    //   console.log(vendorList);
      res.status(200).json(vendorList);  
    } catch (error) {
      console.log('Error getting vendor list:', error);
      res.status(500).json({ message: 'Failed to fetch vendor list' });
    }
  };
  

const updateVendorStatus=async(req,res)=>{
    try {
        const { vendorId, isEnabled } = req.body;

        const vendor = await Vendor.findById(vendorId);
        console.log('founded vendor',vendor);
        
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.isEnabled = isEnabled;
        await vendor.save();

        res.status(200).json({ message: 'Vendor status updated successfully', vendor });
    } catch (error) {
        console.error('Error updating vendor status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const userGet=async(req,res)=>{
    console.log('found the userget route');
    try{
        const userList=await User.find().sort({ _id: -1 });
        res.status(200).json(userList)
    }catch(error){
        console.log('fetching server side error',error);
        
    }
}

const adminLogout = (req, res) => {
    res.clearCookie('token'); 
    return res.status(200).json({ message: 'Logout successful' });
};


const updateUserStatus = async (req, res) => {
  console.log('Hitting the status updation route');
  const { userId, isEnabled } = req.body;
  console.log('UserID:', userId);

  try {
      const user = await User.findById(userId);
      console.log('founded user',user)
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      console.log('Founded user:', user);
      console.log('Current status:', user.isEnabled);

      user.isEnabled = !user.isEnabled; // Toggle the isEnable status

      await user.save();

      console.log('Updated user status:', user.isEnabled);
      return res.status(200).json({ message: 'User status updated successfully', user });
  } catch (error) {
      console.log('Error in the user status updation:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};

const bookingGet=async(req,res)=>{
  try{
    const bookingDetails=await Booking.find().sort({ createdAt: -1 })
    console.log('booking getting',bookingDetails)
    const pending = bookingDetails.filter(
      detail => detail.serviceStatus === 'Cancelled'
    ).length;
    console.log('checking the function working',pending)
    const totalPrice = bookingDetails.reduce((sum, booking) => {
      return sum + Number(booking.totalAmount);
    }, 0);

    console.log('Total Price of all bookings:', totalPrice);
    res.status(200).json({bookingDetails,totalPrice})
  }catch(error){
    console.log('booking get error',error)
  }
}


const monthlyRevenueAndBookings = async (req, res) => {
  try {
    const monthlyData = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalRevenue: { $sum: { $toDouble: "$totalAmount" } }, 
          totalBookings: { $sum: 1 } 
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } } // Sort by year and month
    ]);

    console.log('monthly data',monthlyData)
    // Format the result to return an array of objects
    const result = monthlyData.map(item => ({
      month: `${item._id.month}-${item._id.year}`, // Format as "MM-YYYY"
      totalRevenue: item.totalRevenue,
      totalBookings: item.totalBookings
    }));

    console.log('result',result)
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching monthly revenue and bookings:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};


const fetchByDates=async(req,res)=>{
  console.log('hitting the date by fetch route')
  const { startDate, endDate }=req.query

  console.log('start date',startDate)
  console.log('ended date',endDate)
  try{
    const start=new Date(startDate)
    const end=new Date(endDate)
    end.setHours(23, 59, 59, 999);
    console.log('new date setup',start)
    const selectedDateBookings=await Booking.find({
      createdAt:{
        $gte:start,
        $lte:end
      }
    })
    console.log('selected date booking',selectedDateBookings)
    return res.status(200).json({bookings:selectedDateBookings})
    
  }catch(error){
    console.log('error in the corresponding date fetching ',error)
  }
}

module.exports = {
    adminLogin,
    adminLogout,
    categoryAdd,
    categoryGet,
    deleteCategory,
    editCategory,
    getVendorList,
    updateVendorStatus,
    userGet,
    updateUserStatus,
    bookingGet,
    monthlyRevenueAndBookings,
    fetchByDates
};

