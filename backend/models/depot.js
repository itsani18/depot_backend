const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const depotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Depot name is required'],
    trim: true,
    minlength: [2, 'Depot name must be at least 2 characters'],
    maxlength: [100, 'Depot name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [2, 'Location must be at least 2 characters'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for login (name + location must be unique together)
depotSchema.index({ name: 1, location: 1 }, { unique: true });

// Hash password before saving
depotSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
    try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
depotSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
depotSchema.methods.toJSON = function() {
  const depot = this.toObject();
  delete depot.password;
  return depot;
};

module.exports = mongoose.models.Depot || mongoose.model('Depot', depotSchema);