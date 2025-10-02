import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

// @desc    Get all temple classes
// @route   GET /api/classes
// @access  Private
export const getAllClasses = async (req, res) => {
  try {
    const { temple_id, search, status, is_active } = req.query;
    
    let query = `
      SELECT 
        tc.*,
        t.name as temple_name,
        COUNT(DISTINCT ce.id) as enrolled_count
      FROM temple_classes tc
      LEFT JOIN temples t ON tc.temple_id = t.id
      LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (temple_id) {
      query += ` AND tc.temple_id = $${paramIndex}`;
      params.push(temple_id);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (tc.name ILIKE $${paramIndex} OR tc.instructor ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      query += ` AND tc.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }
    
    query += ` GROUP BY tc.id, t.name ORDER BY tc.created_at DESC`;
    
    const result = await sequelize.query(query, {
      bind: params,
      type: QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        tc.*,
        t.name as temple_name,
        COUNT(DISTINCT ce.id) as enrolled_count
      FROM temple_classes tc
      LEFT JOIN temples t ON tc.temple_id = t.id
      LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
      WHERE tc.id = $1
      GROUP BY tc.id, t.name
    `;
    
    const result = await sequelize.query(query, {
      bind: [id],
      type: QueryTypes.SELECT
    });
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class',
      error: error.message
    });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin/Temple Admin)
export const createClass = async (req, res) => {
  try {
    const {
      temple_id,
      name,
      description,
      instructor,
      schedule,
      price,
      capacity,
      is_active
    } = req.body;
    
    // Validation
    if (!temple_id || !name || !instructor) {
      return res.status(400).json({
        success: false,
        message: 'Please provide temple_id, name, and instructor'
      });
    }
    
    // Verify temple exists
    const templeCheck = await sequelize.query('SELECT id FROM temples WHERE id = $1', {
      bind: [temple_id],
      type: QueryTypes.SELECT
    });
    if (templeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Temple not found'
      });
    }
    
    const query = `
      INSERT INTO temple_classes 
      (temple_id, name, description, instructor, schedule, price, capacity, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      temple_id,
      name,
      description || null,
      instructor,
      schedule || null,
      price || 0,
      capacity || 0,
      is_active !== undefined ? is_active : true
    ];
    
    const result = await sequelize.query(query, {
      bind: values,
      type: QueryTypes.SELECT
    });
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: error.message
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin/Temple Admin)
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      instructor,
      schedule,
      price,
      capacity,
      is_active
    } = req.body;
    
    // Check if class exists
    const classCheck = await pool.query('SELECT * FROM temple_classes WHERE id = $1', [id]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    
    if (instructor !== undefined) {
      updates.push(`instructor = $${paramIndex}`);
      values.push(instructor);
      paramIndex++;
    }
    
    if (schedule !== undefined) {
      updates.push(`schedule = $${paramIndex}`);
      values.push(schedule);
      paramIndex++;
    }
    
    if (price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }
    
    if (capacity !== undefined) {
      updates.push(`capacity = $${paramIndex}`);
      values.push(capacity);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE temple_classes 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await sequelize.query(query, {
      bind: values,
      type: QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class',
      error: error.message
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin/Temple Admin)
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if class exists
    const classCheck = await pool.query('SELECT * FROM temple_classes WHERE id = $1', [id]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check for active enrollments
    const enrollmentCheck = await sequelize.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      {
        bind: [id, 'active'],
        type: QueryTypes.SELECT
      }
    );
    
    if (parseInt(enrollmentCheck[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with active enrollments. Please deactivate it instead.'
      });
    }
    
    await sequelize.query('DELETE FROM temple_classes WHERE id = $1', {
      bind: [id],
      type: QueryTypes.DELETE
    });
    
    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class',
      error: error.message
    });
  }
};

// @desc    Get class statistics
// @route   GET /api/classes/stats/:templeId?
// @access  Private
export const getClassStats = async (req, res) => {
  try {
    const { templeId } = req.params;
    
    let whereClause = '';
    const params = [];
    
    if (templeId) {
      whereClause = 'WHERE tc.temple_id = $1';
      params.push(templeId);
    }
    
    const query = `
      SELECT 
        COUNT(DISTINCT tc.id) as total_classes,
        COUNT(DISTINCT CASE WHEN tc.is_active = true THEN tc.id END) as active_classes,
        COUNT(DISTINCT tc.instructor) as total_instructors,
        COUNT(DISTINCT ce.id) as total_enrollments,
        COALESCE(AVG(tc.capacity), 0) as average_capacity
      FROM temple_classes tc
      LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
      ${whereClause}
    `;
    
    const result = await sequelize.query(query, {
      bind: params,
      type: QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching class stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class statistics',
      error: error.message
    });
  }
};

// @desc    Get class enrollments
// @route   GET /api/classes/:id/enrollments
// @access  Private
export const getClassEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ce.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM class_enrollments ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ce.class_id = $1
      ORDER BY ce.enrollment_date DESC
    `;
    
    const result = await sequelize.query(query, {
      bind: [id],
      type: QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
};

// @desc    Enroll user in class
// @route   POST /api/classes/:id/enroll
// @access  Private
export const enrollInClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, payment_status, payment_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if class exists and is active
    const classCheck = await sequelize.query(
      'SELECT * FROM temple_classes WHERE id = $1 AND is_active = true',
      {
        bind: [id],
        type: QueryTypes.SELECT
      }
    );
    
    if (classCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or not active'
      });
    }
    
    const classData = classCheck[0];
    
    // Check if already enrolled
    const enrollmentCheck = await sequelize.query(
      'SELECT * FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND status = $3',
      {
        bind: [id, user_id, 'active'],
        type: QueryTypes.SELECT
      }
    );
    
    if (enrollmentCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this class'
      });
    }
    
    // Check capacity
    const enrolledCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      {
        bind: [id, 'active'],
        type: QueryTypes.SELECT
      }
    );
    
    if (classData.capacity && parseInt(enrolledCount[0].count) >= classData.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Class is at full capacity'
      });
    }
    
    const query = `
      INSERT INTO class_enrollments 
      (class_id, user_id, enrollment_date, status, payment_status, payment_id)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      id,
      user_id,
      'active',
      payment_status || 'pending',
      payment_id || null
    ];
    
    const result = await sequelize.query(query, {
      bind: values,
      type: QueryTypes.SELECT
    });
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in class',
      data: result[0]
    });
  } catch (error) {
    console.error('Error enrolling in class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in class',
      error: error.message
    });
  }
};
