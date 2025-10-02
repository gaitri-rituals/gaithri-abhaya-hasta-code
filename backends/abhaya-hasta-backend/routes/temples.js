const express = require('express');
const { executeQuery } = require('../utils/dbHelpers.js');

const router = express.Router();

// @route   GET /api/temples
// @desc    Get temples with filtering (matches ExploreTemples.jsx UI)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, city, featured, limit = 50 } = req.query;
    
    let whereConditions = ['t.is_active = true'];
    let queryParams = [];
    
    // Search functionality (matches UI search in ExploreTemples)
    if (search) {
      whereConditions.push(`(
        LOWER(t.name) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(t.primary_deity) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(t.city) LIKE LOWER($${queryParams.length + 1})
      )`);
      queryParams.push(`%${search}%`);
    }
    
    // Category filter (matches UI categories: Ganapathi, Shaiva, Vaishnava, Shakti)
    if (category && category !== 'all') {
      whereConditions.push(`t.primary_deity ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${category}%`);
    }
    
    if (city) {
      whereConditions.push(`LOWER(t.city) = LOWER($${queryParams.length + 1})`);
      queryParams.push(city);
    }
    
    if (featured === 'true') {
      whereConditions.push('t.is_featured = true');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.address,
        t.city,
        t.state,
        t.latitude,
        t.longitude,
        t.phone,
        t.email,
        t.primary_deity as deity,
        t.is_featured,
        COALESCE(
          (SELECT url FROM temple_images WHERE temple_id = t.id AND is_primary = true LIMIT 1),
          'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop'
        ) as image,
        ARRAY(
          SELECT json_build_object(
            'url', url,
            'alt_text', alt_text,
            'is_primary', is_primary
          )
          FROM temple_images 
          WHERE temple_id = t.id 
          ORDER BY is_primary DESC
        ) as hero_images,
        ARRAY(
          SELECT json_build_object(
            'day_of_week', day_of_week,
            'open_time', open_time,
            'close_time', close_time,
            'is_holiday', is_holiday
          )
          FROM temple_timings 
          WHERE temple_id = t.id
        ) as timings
      FROM temples t
      ${whereClause}
      ORDER BY t.is_featured DESC, t.id DESC
      LIMIT $${queryParams.length + 1}
    `;
    
    queryParams.push(parseInt(limit));
    
    const temples = await executeQuery(query, { bindings: queryParams });
    
    // Add calculated distance (mock for now, in real app would use user location)
    const templesWithDistance = temples.map(temple => ({
      ...temple,
      distance: (Math.random() * 20 + 1).toFixed(1), // Mock distance 1-20km
      location: `${temple.city}, ${temple.state}`
    }));
    
    res.json({
      success: true,
      message: 'Temples retrieved successfully',
      data: templesWithDistance,
      count: templesWithDistance.length
    });
    
  } catch (error) {
    console.error('Error fetching temples:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/temples/categories
// @desc    Get temple categories for filtering (matches UI categories)
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'all', name: 'All Temples' },
      { id: 'Ganapathi', name: 'Ganapathi' },
      { id: 'Shaiva', name: 'Shaiva' },
      { id: 'Vaishnava', name: 'Vaishnava' },
      { id: 'Shakti', name: 'Shakti' }
    ];
    
    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/temples/:id
// @desc    Get single temple with full details (matches TempleDetails.jsx)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const templeId = req.params.id;
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.address,
        t.city,
        t.state,
        t.latitude,
        t.longitude,
        t.phone,
        t.email,
        t.website,
        t.primary_deity as deity,
        t.is_featured,
        ARRAY(
          SELECT json_build_object(
            'url', url,
            'alt_text', alt_text,
            'is_primary', is_primary
          )
          FROM temple_images 
          WHERE temple_id = t.id 
          ORDER BY is_primary DESC
        ) as hero_images,
        ARRAY(
          SELECT json_build_object(
            'day_of_week', day_of_week,
            'open_time', open_time,
            'close_time', close_time,
            'is_holiday', is_holiday
          )
          FROM temple_timings 
          WHERE temple_id = t.id
          ORDER BY id
        ) as timings,
        ARRAY(
          SELECT json_build_object(
            'id', ts.id,
            'name', ts.name,
            'description', ts.description,
            'price', ts.price,
            'duration', ts.duration,
            'category', ts.category,
            'is_available', ts.is_available
          )
          FROM temple_services ts
          WHERE ts.temple_id = t.id AND ts.is_available = true
          ORDER BY ts.category, ts.price
        ) as services
      FROM temples t
      WHERE t.id = $1 AND t.is_active = true
    `;
    
    const temples = await executeQuery(query, { bindings: [templeId] });
    
    if (temples.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Temple not found' 
      });
    }
    
    const temple = temples[0];
    
    // Add additional computed fields
    temple.location = `${temple.city}, ${temple.state}`;
    temple.distance = (Math.random() * 20 + 1).toFixed(1); // Mock distance
    temple.priest_contact = temple.phone; // For UI compatibility
    
    // Format opening hours for UI
    if (temple.timings && temple.timings.length > 0) {
      const todayTiming = temple.timings.find(t => !t.is_holiday);
      if (todayTiming) {
        temple.opening_hours = `${todayTiming.open_time} - ${todayTiming.close_time}`;
      }
    }
    
    res.json({
      success: true,
      message: 'Temple details retrieved successfully',
      data: temple
    });
    
  } catch (error) {
    console.error('Error fetching temple details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
