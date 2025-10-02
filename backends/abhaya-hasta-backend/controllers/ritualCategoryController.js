const { executeQuery } = require('../utils/dbHelpers.js');

// @desc    Get all ritual categories with stats
// @route   GET /api/ritual-categories
// @access  Private (Admin)
const getRitualCategories = async (req, res) => {
  try {
    const { search, status, subscription } = req.query;
    
    let whereConditions = [];
    let bindings = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(LOWER(rc.name) LIKE LOWER($${paramIndex}) OR LOWER(rc.description) LIKE LOWER($${paramIndex}))`);
      bindings.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`rc.status = $${paramIndex}`);
      bindings.push(status);
      paramIndex++;
    }

    if (subscription) {
      whereConditions.push(`rc.subscription_tier = $${paramIndex}`);
      bindings.push(subscription);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        rc.id,
        rc.name,
        rc.description,
        rc.subscription_tier as subscription,
        rc.status,
        rc.icon,
        rc.image_url,
        rc.is_active,
        rc.created_at as "createdDate",
        rc.updated_at,
        COUNT(DISTINCT tca.temple_id) as temples,
        COUNT(DISTINCT rp.id) as packages
      FROM ritual_categories rc
      LEFT JOIN temple_category_adoptions tca ON rc.id = tca.category_id AND tca.is_active = true
      LEFT JOIN ritual_packages rp ON rc.id = rp.category_id AND rp.is_available = true
      ${whereClause}
      GROUP BY rc.id
      ORDER BY rc.created_at DESC
    `;

    const categories = await executeQuery(query, { bindings });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });

  } catch (error) {
    console.error('Error fetching ritual categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get ritual category by ID
// @route   GET /api/ritual-categories/:id
// @access  Private (Admin)
const getRitualCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        rc.id,
        rc.name,
        rc.description,
        rc.subscription_tier as subscription,
        rc.status,
        rc.icon,
        rc.image_url,
        rc.is_active,
        rc.created_at as "createdDate",
        rc.updated_at,
        COUNT(DISTINCT tca.temple_id) as temples,
        COUNT(DISTINCT rp.id) as packages
      FROM ritual_categories rc
      LEFT JOIN temple_category_adoptions tca ON rc.id = tca.category_id AND tca.is_active = true
      LEFT JOIN ritual_packages rp ON rc.id = rp.category_id AND rp.is_available = true
      WHERE rc.id = $1
      GROUP BY rc.id
    `;

    const categories = await executeQuery(query, { bindings: [id] });

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ritual category not found'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });

  } catch (error) {
    console.error('Error fetching ritual category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create ritual category
// @route   POST /api/ritual-categories
// @access  Private (Admin)
const createRitualCategory = async (req, res) => {
  try {
    const { name, description, subscription, status, icon, imageUrl } = req.body;
    const createdBy = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const query = `
      INSERT INTO ritual_categories (name, description, subscription_tier, status, icon, image_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, subscription_tier as subscription, status, icon, image_url, created_at as "createdDate"
    `;

    const result = await executeQuery(query, {
      bindings: [
        name,
        description || null,
        subscription || 'Basic',
        status || 'active',
        icon || null,
        imageUrl || null,
        createdBy
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Ritual category created successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creating ritual category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update ritual category
// @route   PUT /api/ritual-categories/:id
// @access  Private (Admin)
const updateRitualCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subscription, status, icon, imageUrl, isActive } = req.body;

    const query = `
      UPDATE ritual_categories
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        subscription_tier = COALESCE($3, subscription_tier),
        status = COALESCE($4, status),
        icon = COALESCE($5, icon),
        image_url = COALESCE($6, image_url),
        is_active = COALESCE($7, is_active)
      WHERE id = $8
      RETURNING id, name, description, subscription_tier as subscription, status, icon, image_url, is_active, updated_at
    `;

    const result = await executeQuery(query, {
      bindings: [name, description, subscription, status, icon, imageUrl, isActive, id]
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ritual category not found'
      });
    }

    res.json({
      success: true,
      message: 'Ritual category updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error updating ritual category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete ritual category
// @route   DELETE /api/ritual-categories/:id
// @access  Private (Admin)
const deleteRitualCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM ritual_categories WHERE id = $1 RETURNING id`;
    const result = await executeQuery(query, { bindings: [id] });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ritual category not found'
      });
    }

    res.json({
      success: true,
      message: 'Ritual category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ritual category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get ritual category stats
// @route   GET /api/ritual-categories/stats
// @access  Private (Admin)
const getRitualCategoryStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_categories,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_categories,
        COUNT(CASE WHEN status = 'review' THEN 1 END) as review_categories
      FROM ritual_categories
    `;

    const packagesQuery = `SELECT COUNT(*) as total_packages FROM ritual_packages WHERE is_available = true`;
    const adoptionsQuery = `SELECT COUNT(*) as total_adoptions FROM temple_category_adoptions WHERE is_active = true`;

    const [stats, packages, adoptions] = await Promise.all([
      executeQuery(statsQuery, { bindings: [] }),
      executeQuery(packagesQuery, { bindings: [] }),
      executeQuery(adoptionsQuery, { bindings: [] })
    ]);

    res.json({
      success: true,
      data: {
        totalCategories: parseInt(stats[0].total_categories),
        activeCategories: parseInt(stats[0].active_categories),
        draftCategories: parseInt(stats[0].draft_categories),
        reviewCategories: parseInt(stats[0].review_categories),
        totalPackages: parseInt(packages[0].total_packages),
        templeAdoptions: parseInt(adoptions[0].total_adoptions)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getRitualCategories,
  getRitualCategoryById,
  createRitualCategory,
  updateRitualCategory,
  deleteRitualCategory,
  getRitualCategoryStats
};
