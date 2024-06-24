const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
