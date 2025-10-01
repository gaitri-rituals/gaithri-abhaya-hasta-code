const db = require('../config/database');

const reviewsController = {
  // Get all reviews for a temple
  getTempleReviews: async (req, res) => {
    try {
      const { temple_id } = req.params;
      const { 
        rating, 
        sort_by = 'created_at', 
        order = 'desc',
        limit = 20, 
        offset = 0 
      } = req.query;

      let query = `
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.temple_id = $1
      `;

      const params = [temple_id];
      let paramCount = 1;

      if (rating) {
        paramCount++;
        query += ` AND r.rating = $${paramCount}`;
        params.push(rating);
      }

      // Validate sort options
      const validSortFields = ['created_at', 'rating', 'helpful_count'];
      const validOrders = ['asc', 'desc'];
      
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      query += ` ORDER BY r.${sortField} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count and rating statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
        FROM reviews
        WHERE temple_id = $1
      `;

      let statsParams = [temple_id];
      if (rating) {
        statsQuery += ' AND rating = $2';
        statsParams.push(rating);
      }

      const statsResult = await db.query(statsQuery, statsParams);

      res.json({
        success: true,
        data: result.rows,
        statistics: {
          ...statsResult.rows[0],
          average_rating: parseFloat(statsResult.rows[0].average_rating) || 0
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(statsResult.rows[0].total_reviews)
        }
      });
    } catch (error) {
      console.error('Error fetching temple reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get review by ID
  getReviewById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT r.*, u.name as user_name, u.email as user_email,
               t.name as temple_name, t.city, t.state
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN temples t ON r.temple_id = t.id
        WHERE r.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching review details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new review
  createReview: async (req, res) => {
    try {
      const { temple_id, user_id, rating, comment, visit_date } = req.body;

      if (!temple_id || !user_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, user ID, and rating are required'
        });
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Check if temple exists
      const templeQuery = 'SELECT id, name FROM temples WHERE id = $1 AND is_active = true';
      const templeResult = await db.query(templeQuery, [temple_id]);

      if (templeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Temple not found'
        });
      }

      // Check if user exists
      const userQuery = 'SELECT id, name FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has already reviewed this temple
      const existingQuery = 'SELECT id FROM reviews WHERE temple_id = $1 AND user_id = $2';
      const existingResult = await db.query(existingQuery, [temple_id, user_id]);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this temple'
        });
      }

      const insertQuery = `
        INSERT INTO reviews (temple_id, user_id, rating, comment, visit_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        temple_id, user_id, rating, comment, visit_date
      ]);

      // Get complete review details
      const detailsQuery = `
        SELECT r.*, u.name as user_name, t.name as temple_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN temples t ON r.temple_id = t.id
        WHERE r.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update review
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment, visit_date } = req.body;
      const { user_id } = req.user || req.body; // Assuming user info from auth middleware

      // Check if review exists and belongs to user
      const checkQuery = 'SELECT * FROM reviews WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      const review = checkResult.rows[0];

      // Only allow the review author to update
      if (user_id && review.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own reviews'
        });
      }

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
          });
        }
        updateFields.push(`rating = $${paramCount}`);
        params.push(rating);
        paramCount++;
      }

      if (comment !== undefined) {
        updateFields.push(`comment = $${paramCount}`);
        params.push(comment);
        paramCount++;
      }

      if (visit_date !== undefined) {
        updateFields.push(`visit_date = $${paramCount}`);
        params.push(visit_date);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const updateQuery = `
        UPDATE reviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete review
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user || req.body; // Assuming user info from auth middleware

      // Check if review exists and belongs to user
      const checkQuery = 'SELECT * FROM reviews WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      const review = checkResult.rows[0];

      // Only allow the review author to delete
      if (user_id && review.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reviews'
        });
      }

      // Delete the review
      const deleteQuery = 'DELETE FROM reviews WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's reviews
  getUserReviews: async (req, res) => {
    try {
      const { user_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const query = `
        SELECT r.*, t.name as temple_name, t.city, t.state, t.image_url
        FROM reviews r
        JOIN temples t ON r.temple_id = t.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [user_id, limit, offset]);

      // Get total count
      const countQuery = 'SELECT COUNT(*) as total FROM reviews WHERE user_id = $1';
      const countResult = await db.query(countQuery, [user_id]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Mark review as helpful
  markHelpful: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user || req.body; // Assuming user info from auth middleware

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Check if review exists
      const reviewQuery = 'SELECT * FROM reviews WHERE id = $1';
      const reviewResult = await db.query(reviewQuery, [id]);

      if (reviewResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user has already marked this review as helpful
      // This would require a separate table for review_helpful_votes
      // For now, we'll just increment the helpful_count

      const updateQuery = `
        UPDATE reviews 
        SET helpful_count = helpful_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(updateQuery, [id]);

      res.json({
        success: true,
        message: 'Review marked as helpful',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get review statistics for a temple
  getTempleReviewStats: async (req, res) => {
    try {
      const { temple_id } = req.params;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
          SUM(helpful_count) as total_helpful_votes
        FROM reviews
        WHERE temple_id = $1
      `;

      const result = await db.query(statsQuery, [temple_id]);

      // Get recent reviews trend (last 6 months)
      const trendQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as review_count,
          AVG(rating) as avg_rating
        FROM reviews
        WHERE temple_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `;

      const trendResult = await db.query(trendQuery, [temple_id]);

      const stats = result.rows[0];
      const ratingDistribution = [
        { rating: 5, count: parseInt(stats.five_star), percentage: 0 },
        { rating: 4, count: parseInt(stats.four_star), percentage: 0 },
        { rating: 3, count: parseInt(stats.three_star), percentage: 0 },
        { rating: 2, count: parseInt(stats.two_star), percentage: 0 },
        { rating: 1, count: parseInt(stats.one_star), percentage: 0 }
      ];

      const totalReviews = parseInt(stats.total_reviews);
      if (totalReviews > 0) {
        ratingDistribution.forEach(item => {
          item.percentage = Math.round((item.count / totalReviews) * 100);
        });
      }

      res.json({
        success: true,
        data: {
          total_reviews: totalReviews,
          average_rating: parseFloat(stats.average_rating) || 0,
          total_helpful_votes: parseInt(stats.total_helpful_votes) || 0,
          rating_distribution: ratingDistribution,
          monthly_trend: trendResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching temple review statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get top-rated temples
  getTopRatedTemples: async (req, res) => {
    try {
      const { limit = 10, min_reviews = 5 } = req.query;

      const query = `
        SELECT t.id, t.name, t.city, t.state, t.image_url,
               COUNT(r.id) as review_count,
               AVG(r.rating) as average_rating
        FROM temples t
        JOIN reviews r ON t.id = r.temple_id
        WHERE t.is_active = true
        GROUP BY t.id, t.name, t.city, t.state, t.image_url
        HAVING COUNT(r.id) >= $1
        ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC
        LIMIT $2
      `;

      const result = await db.query(query, [min_reviews, limit]);

      const temples = result.rows.map(temple => ({
        ...temple,
        review_count: parseInt(temple.review_count),
        average_rating: parseFloat(temple.average_rating)
      }));

      res.json({
        success: true,
        data: temples
      });
    } catch (error) {
      console.error('Error fetching top-rated temples:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get recent reviews across all temples
  getRecentReviews: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const query = `
        SELECT r.*, u.name as user_name, t.name as temple_name, t.city, t.state
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN temples t ON r.temple_id = t.id
        WHERE t.is_active = true
        ORDER BY r.created_at DESC
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = reviewsController;