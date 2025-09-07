const jwt = require('jsonwebtoken');
const Depot = require('../models/depot');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
      return res.status(401).json({ 
         success: false, 
         message: 'No token provided, access denied' 
       });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const depot = await Depot.findById(decoded.depotId);
        if (!depot || !depot.isActive) {
      return res.status(401).json({ 
         success: false, 
         message: 'Invalid token or depot not active' 
       });
    }

    req.depot = depot;
    next();
  } catch (error) {
    res.status(401).json({ 
       success: false, 
       message: 'Token is not valid' 
     });
  }
};

module.exports = authMiddleware;