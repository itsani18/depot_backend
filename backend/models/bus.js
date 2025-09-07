const mongoose = require('mongoose');

const stoppageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stoppage name is required'],
    trim: true
  },
  arrivalTime: {
    type: String,
    required: [true, 'Arrival time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  }
});

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  route: {
    type: String,
    required: [true, 'Route is required'],
    trim: true
  },
  stoppages: {
    type: [stoppageSchema],
    required: [true, 'At least one stoppage is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one stoppage is required'
    }
  },
  driver: {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Driver phone number is required'],
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Driver phone number must be 10 digits'
      }
    }
  },
  depot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: [true, 'Depot is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number,
    default: 40,
    min: [1, 'Capacity must be at least 1']
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Bus || mongoose.model('Bus', busSchema);