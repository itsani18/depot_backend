const express = require('express');
const { body, validationResult } = require('express-validator');
const Bus = require('../models/bus');
const auth = require('../middleware/auth');
const router = express.Router();

// Validation middleware for bus data
const busValidation = [
  body('busNumber').trim().notEmpty().withMessage('Bus number is required'),
  body('route').trim().notEmpty().withMessage('Route is required'),
  body('stoppages').isArray({ min: 1 }).withMessage('At least one stoppage is required'),
  body('stoppages.*.name').trim().notEmpty().withMessage('Stoppage name is required'),
  body('stoppages.*.arrivalTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Arrival time must be in HH:MM format'),
  body('stoppages.*.departureTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Departure time must be in HH:MM format'),
  body('driver.name').trim().notEmpty().withMessage('Driver name is required'),
  body('driver.phoneNumber').matches(/^\d{10}$/).withMessage('Driver phone number must be 10 digits'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1')
];

// Add new bus
router.post('/add', auth, busValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { busNumber, route, stoppages, driver, capacity } = req.body;
    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      });
    }
    const bus = new Bus({
      busNumber: busNumber.toUpperCase(),
      route,
      stoppages,
      driver,
      depot: req.depot._id,
      capacity: capacity || 40
    });
    await bus.save();
    await bus.populate('depot', 'name location');
    res.status(201).json({
      success: true,
      message: 'Bus added successfully',
      data: bus
    });
  } catch (error) {
    console.error('Add bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding bus'
    });
  }
});

// Get all buses for the depot
router.get('/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
        const query = { depot: req.depot._id };
        if (search) {
      query.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { route: { $regex: search, $options: 'i' } },
        { 'driver.name': { $regex: search, $options: 'i' } }
      ];
    }
        if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    const buses = await Bus.find(query)
      .populate('depot', 'name location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Bus.countDocuments(query);
    res.json({
      success: true,
      data: {
        buses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBuses: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching buses'
    });
  }
});

// Get single bus by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bus = await Bus.findOne({ 
       _id: req.params.id, 
       depot: req.depot._id 
     }).populate('depot', 'name location');
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bus'
    });
  }
});

// Update bus
router.put('/:id', auth, busValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { busNumber, route, stoppages, driver, capacity, isActive } = req.body;
    // Check if bus number already exists (excluding current bus)
    if (busNumber) {
      const existingBus = await Bus.findOne({ 
         busNumber: busNumber.toUpperCase(), 
         _id: { $ne: req.params.id } 
       });
      if (existingBus) {
        return res.status(400).json({
          success: false,
          message: 'Bus number already exists'
        });
      }
    }
    const bus = await Bus.findOneAndUpdate(
      { _id: req.params.id, depot: req.depot._id },
      {
        busNumber: busNumber?.toUpperCase(),
        route,
        stoppages,
        driver,
        capacity,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('depot', 'name location');
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    res.json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bus'
    });
  }
});

// Delete bus
router.delete('/:id', auth, async (req, res) => {
  try {
    const bus = await Bus.findOneAndDelete({ 
       _id: req.params.id, 
       depot: req.depot._id 
     });
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    res.json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bus'
    });
  }
});

// Toggle bus active status
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    const bus = await Bus.findOne({ 
       _id: req.params.id, 
       depot: req.depot._id 
     });
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    bus.isActive = !bus.isActive;
    await bus.save();
    await bus.populate('depot', 'name location');
    res.json({
      success: true,
      message: `Bus ${bus.isActive ? 'activated' : 'deactivated'} successfully`,
      data: bus
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling bus status'
    });
  }
});

// Get bus statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments({ depot: req.depot._id });
    const activeBuses = await Bus.countDocuments({ depot: req.depot._id, isActive: true });
    const inactiveBuses = totalBuses - activeBuses;
        const routes = await Bus.distinct('route', { depot: req.depot._id });
    const totalRoutes = routes.length;
    res.json({
      success: true,
      data: {
        totalBuses,
        activeBuses,
        inactiveBuses,
        totalRoutes,
        depot: req.depot.name
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;