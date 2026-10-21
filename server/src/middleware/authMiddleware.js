const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. JWT_SECRET is not set.'
        });
      }
      const decoded = jwt.verify(token, jwtSecret);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Authorization denied.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.'
    });
  }
};

module.exports = { protect };
