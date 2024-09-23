const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Assuming you're using Mongoose and have a User model

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.cookies; // Get refresh token from cookie

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Find the user associated with this token
    const user = await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Store the decoded token info for further use in the next middleware
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

module.exports = verifyRefreshToken;
