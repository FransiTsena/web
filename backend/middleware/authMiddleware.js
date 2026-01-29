const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/authService');

const authMiddleware = (req) => {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return reject({ statusCode: 401, error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      resolve(decoded);
    } catch (error) {
      reject({ statusCode: 403, error: 'Invalid or expired token.' });
    }
  });
};

module.exports = authMiddleware;
