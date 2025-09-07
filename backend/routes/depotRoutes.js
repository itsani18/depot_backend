const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Depot = require('../models/depot');
const auth = require('../middleware/auth');
const router = express.Router();

// Register depot
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Location must be 2-200 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { name, location, password, phoneNumber, email } = req.body;
    // Check if depot with same name and location exists
    const existingDepot = await Depot.findOne({ name, location });
    if (existingDepot) {
      return res.status(400).json({
        success: false,
        message: 'Depot with this name and location already exists'
      });
    }
    // Check if email already exists
    const existingEmail = await Depot.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    const depot = new Depot({
      name,
      location,
      password,
      phoneNumber,
      email
    });
    await depot.save();
    const token = jwt.sign(
      { depotId: depot._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      success: true,
      message: 'Depot registered successfully',
      data: {
        depot,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login depot
router.post('/login', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { name, location, password } = req.body;
    const depot = await Depot.findOne({ name, location, isActive: true });
    if (!depot) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const isPasswordValid = await depot.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const token = jwt.sign(
      { depotId: depot._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        depot,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get depot profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.depot
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update depot profile
router.put('/profile', auth, [
  body('phoneNumber').optional().matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { phoneNumber, email } = req.body;
    const updates = {};
        if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (email) updates.email = email;
    if (email) {
      const existingEmail = await Depot.findOne({ 
         email, 
         _id: { $ne: req.depot._id } 
       });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    const updatedDepot = await Depot.findByIdAndUpdate(
      req.depot._id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedDepot
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

module.exports = router;