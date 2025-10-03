import express from 'express';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// Get all nakshatras
router.get('/nakshatras', async (req, res) => {
  try {
    const results = await sequelize.query(
      'SELECT id, name FROM nakshatras ORDER BY name',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    res.json({
      success: true,
      message: 'Nakshatras retrieved successfully',
      data: results
    });
  } catch (error) {
    console.error('Error fetching nakshatras:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nakshatras',
      error: error.message
    });
  }
});

// Get all gothras
router.get('/gothras', async (req, res) => {
  try {
    const results = await sequelize.query(
      'SELECT id, name FROM gothras ORDER BY name',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    res.json({
      success: true,
      message: 'Gothras retrieved successfully',
      data: results
    });
  } catch (error) {
    console.error('Error fetching gothras:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gothras',
      error: error.message
    });
  }
});

export default router;