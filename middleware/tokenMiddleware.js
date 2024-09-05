const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken; // Retrieve token from cookies

    if (!token) {
        return res.status(401).json({ message: 'Access token not found' });
    }

    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired access token' });
        }

        req.user = user; 
        next(); 
    });
};

module.exports = { authenticateToken };