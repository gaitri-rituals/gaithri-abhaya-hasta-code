const db = require('../config/database');

const templesController = {
  // Get all temples with optional filtering
  getAllTemples: async (req, res) => {
    try {
      const { category, city, state, search, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT t.*, 
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(r.id) as review_count,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as primary_image
        FROM temples t
        LEFT JOIN reviews r ON t.id = r.temple_id AND r.is_approved = true
      `;
      
      const conditions = ['t.is_active = true'];
      const params = [];
      
      if (category) {
        conditions.push('t.category = $' + (params.length + 1));
        params.push(category);
      }
      
      if (city) {
        conditions.push('t.city ILIKE $' + (params.length + 1));
        params.push(`%${city}%`);
      }
      
      if (state) {
        conditions.push('t.state ILIKE $' + (params.length + 1));
        params.push(`%${state}%`);
      }
      
      if (search) {
        conditions.push('(t.name ILIKE $' + (params.length + 1) + ' OR t.description ILIKE $' + (params.length + 1) + ')');
        params.push(`%${search}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += `
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.rows.length
        }
      });
    } catch (error) {
      console.error('Error fetching temples:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get temple by ID with detailed information
  getTempleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get temple details
      const templeQuery = `
        SELECT t.*, 
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(r.id) as review_count
        FROM temples t
        LEFT JOIN reviews r ON t.id = r.temple_id AND r.is_approved = true
        WHERE t.id = $1 AND t.is_active = true
        GROUP BY t.id
      `;
      
      const templeResult = await db.query(templeQuery, [id]);
      
      if (templeResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Temple not found' });
      }
      
      const temple = templeResult.rows[0];
      
      // Get temple images
      const imagesQuery = 'SELECT * FROM temple_images WHERE temple_id = $1 ORDER BY is_primary DESC, created_at ASC';
      const imagesResult = await db.query(imagesQuery, [id]);
      
      // Get temple timings
      const timingsQuery = 'SELECT * FROM temple_timings WHERE temple_id = $1 ORDER BY day_of_week';
      const timingsResult = await db.query(timingsQuery, [id]);
      
      // Get temple services
      const servicesQuery = 'SELECT * FROM temple_services WHERE temple_id = $1 AND is_active = true ORDER BY name';
      const servicesResult = await db.query(servicesQuery, [id]);
      
      // Get recent reviews
      const reviewsQuery = `
        SELECT r.*, u.name as user_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.temple_id = $1 AND r.is_approved = true 
        ORDER BY r.created_at DESC 
        LIMIT 10
      `;
      const reviewsResult = await db.query(reviewsQuery, [id]);
      
      res.json({
        success: true,
        data: {
          ...temple,
          images: imagesResult.rows,
          timings: timingsResult.rows,
          services: servicesResult.rows,
          reviews: reviewsResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching temple details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get temples by category
  getTemplesByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const query = `
        SELECT t.*, 
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(r.id) as review_count,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as primary_image
        FROM temples t
        LEFT JOIN reviews r ON t.id = r.temple_id AND r.is_approved = true
        WHERE t.category = $1 AND t.is_active = true
        GROUP BY t.id
        ORDER BY average_rating DESC, t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [category, limit, offset]);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          category
        }
      });
    } catch (error) {
      console.error('Error fetching temples by category:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get nearby temples
  getNearbyTemples: async (req, res) => {
    try {
      const { latitude, longitude, radius = 50 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          message: 'Latitude and longitude are required' 
        });
      }
      
      const query = `
        SELECT t.*, 
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(r.id) as review_count,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as primary_image,
               (6371 * acos(cos(radians($1)) * cos(radians(t.latitude)) * 
                cos(radians(t.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(t.latitude)))) AS distance
        FROM temples t
        LEFT JOIN reviews r ON t.id = r.temple_id AND r.is_approved = true
        WHERE t.is_active = true
        GROUP BY t.id
        HAVING (6371 * acos(cos(radians($1)) * cos(radians(t.latitude)) * 
                cos(radians(t.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(t.latitude)))) <= $3
        ORDER BY distance ASC
        LIMIT 20
      `;
      
      const result = await db.query(query, [latitude, longitude, radius]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching nearby temples:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get temple categories
  getCategories: async (req, res) => {
    try {
      const query = `
        SELECT category, COUNT(*) as temple_count
        FROM temples 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY temple_count DESC
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching temple categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Add temple to favorites
  addToFavorites: async (req, res) => {
    try {
      const { templeId } = req.params;
      const userId = req.user.id; // Assuming user is authenticated
      
      // Check if already in favorites
      const checkQuery = 'SELECT id FROM favorites WHERE user_id = $1 AND temple_id = $2';
      const checkResult = await db.query(checkQuery, [userId, templeId]);
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Temple already in favorites' 
        });
      }
      
      const insertQuery = 'INSERT INTO favorites (user_id, temple_id) VALUES ($1, $2) RETURNING *';
      const result = await db.query(insertQuery, [userId, templeId]);
      
      res.json({
        success: true,
        message: 'Temple added to favorites',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Remove temple from favorites
  removeFromFavorites: async (req, res) => {
    try {
      const { templeId } = req.params;
      const userId = req.user.id;
      
      const deleteQuery = 'DELETE FROM favorites WHERE user_id = $1 AND temple_id = $2 RETURNING *';
      const result = await db.query(deleteQuery, [userId, templeId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Favorite not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Temple removed from favorites'
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's favorite temples
  getFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT t.*, 
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(r.id) as review_count,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as primary_image,
               f.created_at as favorited_at
        FROM favorites f
        JOIN temples t ON f.temple_id = t.id
        LEFT JOIN reviews r ON t.id = r.temple_id AND r.is_approved = true
        WHERE f.user_id = $1 AND t.is_active = true
        GROUP BY t.id, f.created_at
        ORDER BY f.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = templesController;