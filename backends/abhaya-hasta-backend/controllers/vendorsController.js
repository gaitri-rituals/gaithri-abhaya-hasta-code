const { executeQuery } = require('../utils/dbHelpers.js');

// @desc    Get all vendors with filtering
// @route   GET /api/vendors
// @access  Private (Admin)
const getVendors = async (req, res) => {
  try {
    const { search, category, templeId } = req.query;
    
    let whereConditions = ['v.is_active = true'];
    let bindings = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(LOWER(v.name) LIKE LOWER($${paramIndex}) OR LOWER(v.email) LIKE LOWER($${paramIndex}) OR LOWER(v.contact_person) LIKE LOWER($${paramIndex}))`);
      bindings.push(`%${search}%`);
      paramIndex++;
    }

    if (category && category !== 'all') {
      whereConditions.push(`v.category = $${paramIndex}`);
      bindings.push(category);
      paramIndex++;
    }

    if (templeId) {
      whereConditions.push(`v.temple_id = $${paramIndex}`);
      bindings.push(templeId);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        v.*,
        t.name as temple_name
      FROM vendors v
      LEFT JOIN temples t ON v.temple_id = t.id
      ${whereClause}
      ORDER BY v.created_at DESC
    `;

    const vendors = await executeQuery(query, { bindings });

    res.json({
      success: true,
      data: vendors,
      count: vendors.length
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private (Admin)
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        v.*,
        t.name as temple_name
      FROM vendors v
      LEFT JOIN temples t ON v.temple_id = t.id
      WHERE v.id = $1
    `;

    const vendors = await executeQuery(query, { bindings: [id] });

    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendors[0]
    });

  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private (Admin)
const createVendor = async (req, res) => {
  try {
    const {
      templeId,
      name,
      contactPerson,
      phone,
      email,
      address,
      category,
      services
    } = req.body;

    if (!name || !phone || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and category are required'
      });
    }

    const query = `
      INSERT INTO vendors (temple_id, name, contact_person, phone, email, address, category)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await executeQuery(query, {
      bindings: [
        templeId || null,
        name,
        contactPerson || null,
        phone,
        email || null,
        address || null,
        category
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private (Admin)
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      templeId,
      name,
      contactPerson,
      phone,
      email,
      address,
      category,
      rating,
      isActive
    } = req.body;

    const query = `
      UPDATE vendors
      SET 
        temple_id = COALESCE($1, temple_id),
        name = COALESCE($2, name),
        contact_person = COALESCE($3, contact_person),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        address = COALESCE($6, address),
        category = COALESCE($7, category),
        rating = COALESCE($8, rating),
        is_active = COALESCE($9, is_active)
      WHERE id = $10
      RETURNING *
    `;

    const result = await executeQuery(query, {
      bindings: [
        templeId, name, contactPerson, phone, email,
        address, category, rating, isActive, id
      ]
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private (Admin)
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const query = `UPDATE vendors SET is_active = false WHERE id = $1 RETURNING id`;
    const result = await executeQuery(query, { bindings: [id] });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get vendor statistics
// @route   GET /api/vendors/stats
// @access  Private (Admin)
const getVendorStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN category = 'teacher' THEN 1 END) as teachers,
        COUNT(CASE WHEN category = 'caterer' THEN 1 END) as caterers,
        COUNT(CASE WHEN category = 'decorator' THEN 1 END) as decorators,
        COUNT(CASE WHEN category = 'kit-provider' THEN 1 END) as kit_providers,
        COUNT(CASE WHEN category = 'custom' THEN 1 END) as custom,
        AVG(rating) as average_rating
      FROM vendors
      WHERE is_active = true
    `;

    const stats = await executeQuery(statsQuery, { bindings: [] });

    res.json({
      success: true,
      data: {
        totalVendors: parseInt(stats[0].total_vendors),
        teachers: parseInt(stats[0].teachers),
        caterers: parseInt(stats[0].caterers),
        decorators: parseInt(stats[0].decorators),
        kitProviders: parseInt(stats[0].kit_providers),
        custom: parseInt(stats[0].custom),
        averageRating: parseFloat(stats[0].average_rating) || 0
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
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats
};
