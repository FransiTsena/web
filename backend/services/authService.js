const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { collections } = require('../db');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';
const JWT_EXPIRES_IN = '7d';

const authService = {
  register: async (userData) => {
    const { email, password, name } = userData;

    // Check if user exists
    const existingUser = await collections.users.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collections.users.insertOne(newUser);
    // Generate token
    const token = jwt.sign({ userId: result.insertedId.toString(), email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: result.insertedId.toString(),
        email,
        name
      }
    };
  },

  login: async (email, password) => {
    const user = await collections.users.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    };
  },

  getProfile: async (userId) => {
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

module.exports = { authService, JWT_SECRET };
