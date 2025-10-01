const db = require('../config/database');

const communityController = {
  // Get all community posts with filtering
  getAllPosts: async (req, res) => {
    try {
      const { temple_id, category, user_id, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT cp.*, u.name as author_name, t.name as temple_name,
               COUNT(cc.id) as comment_count,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as temple_image
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        JOIN temples t ON cp.temple_id = t.id
        LEFT JOIN community_comments cc ON cp.id = cc.post_id AND cc.is_approved = true
        WHERE cp.is_approved = true
      `;
      
      const params = [];
      
      if (temple_id) {
        query += ' AND cp.temple_id = $' + (params.length + 1);
        params.push(temple_id);
      }
      
      if (category) {
        query += ' AND cp.category = $' + (params.length + 1);
        params.push(category);
      }
      
      if (user_id) {
        query += ' AND cp.user_id = $' + (params.length + 1);
        params.push(user_id);
      }
      
      query += `
        GROUP BY cp.id, u.id, t.id
        ORDER BY cp.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching community posts:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get post by ID with comments
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get post details
      const postQuery = `
        SELECT cp.*, u.name as author_name, u.email as author_email,
               t.name as temple_name, t.city, t.state
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        JOIN temples t ON cp.temple_id = t.id
        WHERE cp.id = $1 AND cp.is_approved = true
      `;
      
      const postResult = await db.query(postQuery, [id]);
      
      if (postResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const post = postResult.rows[0];
      
      // Get comments
      const commentsQuery = `
        SELECT cc.*, u.name as commenter_name
        FROM community_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.post_id = $1 AND cc.is_approved = true
        ORDER BY cc.created_at ASC
      `;
      
      const commentsResult = await db.query(commentsQuery, [id]);
      
      res.json({
        success: true,
        data: {
          ...post,
          comments: commentsResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching post details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create a new community post
  createPost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { temple_id, title, content, category } = req.body;

      if (!temple_id || !title || !content || !category) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, title, content, and category are required'
        });
      }

      // Validate category
      const validCategories = ['experience', 'announcement', 'volunteer', 'appreciation', 'question', 'general'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }

      // Check if temple exists
      const templeQuery = 'SELECT id FROM temples WHERE id = $1 AND is_active = true';
      const templeResult = await db.query(templeQuery, [temple_id]);

      if (templeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Temple not found'
        });
      }

      const insertQuery = `
        INSERT INTO community_posts (user_id, temple_id, title, content, category, is_approved)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [userId, temple_id, title, content, category]);

      // Get complete post details
      const detailsQuery = `
        SELECT cp.*, u.name as author_name, t.name as temple_name
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        JOIN temples t ON cp.temple_id = t.id
        WHERE cp.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update a post
  updatePost: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, content, category } = req.body;

      // Check if post exists and belongs to user
      const checkQuery = 'SELECT * FROM community_posts WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or you do not have permission to edit it'
        });
      }

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (title) {
        updateFields.push(`title = $${paramCount}`);
        params.push(title);
        paramCount++;
      }

      if (content) {
        updateFields.push(`content = $${paramCount}`);
        params.push(content);
        paramCount++;
      }

      if (category) {
        const validCategories = ['experience', 'announcement', 'volunteer', 'appreciation', 'question', 'general'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }
        updateFields.push(`category = $${paramCount}`);
        params.push(category);
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
        UPDATE community_posts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete a post
  deletePost: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if post exists and belongs to user
      const checkQuery = 'SELECT * FROM community_posts WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or you do not have permission to delete it'
        });
      }

      // Delete associated comments first
      await db.query('DELETE FROM community_comments WHERE post_id = $1', [id]);

      // Delete the post
      const deleteQuery = 'DELETE FROM community_posts WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Add a comment to a post
  addComment: async (req, res) => {
    try {
      const { id } = req.params; // post_id
      const userId = req.user.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      // Check if post exists
      const postQuery = 'SELECT id FROM community_posts WHERE id = $1 AND is_approved = true';
      const postResult = await db.query(postQuery, [id]);

      if (postResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const insertQuery = `
        INSERT INTO community_comments (post_id, user_id, content, is_approved)
        VALUES ($1, $2, $3, true)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [id, userId, content.trim()]);

      // Get complete comment details
      const detailsQuery = `
        SELECT cc.*, u.name as commenter_name
        FROM community_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update a comment
  updateComment: async (req, res) => {
    try {
      const { id } = req.params; // comment_id
      const userId = req.user.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      // Check if comment exists and belongs to user
      const checkQuery = 'SELECT * FROM community_comments WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or you do not have permission to edit it'
        });
      }

      const updateQuery = `
        UPDATE community_comments 
        SET content = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;

      const result = await db.query(updateQuery, [content.trim(), id]);

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete a comment
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params; // comment_id
      const userId = req.user.id;

      // Check if comment exists and belongs to user
      const checkQuery = 'SELECT * FROM community_comments WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or you do not have permission to delete it'
        });
      }

      const deleteQuery = 'DELETE FROM community_comments WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get post categories
  getPostCategories: async (req, res) => {
    try {
      const query = `
        SELECT category, COUNT(*) as post_count
        FROM community_posts 
        WHERE is_approved = true 
        GROUP BY category 
        ORDER BY post_count DESC
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching post categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's posts
  getUserPosts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const query = `
        SELECT cp.*, t.name as temple_name,
               COUNT(cc.id) as comment_count
        FROM community_posts cp
        JOIN temples t ON cp.temple_id = t.id
        LEFT JOIN community_comments cc ON cp.id = cc.post_id AND cc.is_approved = true
        WHERE cp.user_id = $1
        GROUP BY cp.id, t.id
        ORDER BY cp.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get community statistics
  getCommunityStats: async (req, res) => {
    try {
      const { temple_id } = req.query;

      let query = `
        SELECT 
          COUNT(DISTINCT cp.id) as total_posts,
          COUNT(DISTINCT cc.id) as total_comments,
          COUNT(DISTINCT cp.user_id) as active_members
        FROM community_posts cp
        LEFT JOIN community_comments cc ON cp.id = cc.post_id AND cc.is_approved = true
        WHERE cp.is_approved = true
      `;

      const params = [];

      if (temple_id) {
        query += ' AND cp.temple_id = $1';
        params.push(temple_id);
      }

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching community stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = communityController;