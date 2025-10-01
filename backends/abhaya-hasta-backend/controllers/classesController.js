const db = require('../config/database');

const classesController = {
  // Get all temple classes
  getAllClasses: async (req, res) => {
    try {
      const { 
        temple_id, 
        category, 
        status, 
        instructor_id,
        limit = 50, 
        offset = 0 
      } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      let query = `
        SELECT tc.*, u.name as instructor_name, u.email as instructor_email,
               COUNT(ce.id) as enrolled_count
        FROM temple_classes tc
        JOIN users u ON tc.instructor_id = u.id
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
        WHERE tc.temple_id = $1
      `;

      const params = [temple_id];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND tc.category = $${paramCount}`;
        params.push(category);
      }

      if (status) {
        paramCount++;
        query += ` AND tc.status = $${paramCount}`;
        params.push(status);
      }

      if (instructor_id) {
        paramCount++;
        query += ` AND tc.instructor_id = $${paramCount}`;
        params.push(instructor_id);
      }

      query += `
        GROUP BY tc.id, u.id
        ORDER BY tc.start_date DESC, tc.created_at DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT tc.id) as total
        FROM temple_classes tc
        WHERE tc.temple_id = $1
      `;
      const countParams = [temple_id];
      let countParamCount = 1;

      if (category) {
        countParamCount++;
        countQuery += ` AND tc.category = $${countParamCount}`;
        countParams.push(category);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND tc.status = $${countParamCount}`;
        countParams.push(status);
      }

      if (instructor_id) {
        countParamCount++;
        countQuery += ` AND tc.instructor_id = $${countParamCount}`;
        countParams.push(instructor_id);
      }

      const countResult = await db.query(countQuery, countParams);

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
      console.error('Error fetching temple classes:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get class by ID
  getClassById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT tc.*, u.name as instructor_name, u.email as instructor_email, u.phone as instructor_phone,
               t.name as temple_name, t.city, t.state,
               COUNT(ce.id) as enrolled_count
        FROM temple_classes tc
        JOIN users u ON tc.instructor_id = u.id
        JOIN temples t ON tc.temple_id = t.id
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
        WHERE tc.id = $1
        GROUP BY tc.id, u.id, t.id
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get enrolled students
      const enrollmentsQuery = `
        SELECT ce.*, u.name as student_name, u.email as student_email, u.phone as student_phone
        FROM class_enrollments ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.class_id = $1 AND ce.status = 'active'
        ORDER BY ce.enrollment_date
      `;

      const enrollmentsResult = await db.query(enrollmentsQuery, [id]);

      res.json({
        success: true,
        data: {
          ...result.rows[0],
          enrollments: enrollmentsResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching class details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new class
  createClass: async (req, res) => {
    try {
      const {
        temple_id,
        title,
        description,
        category,
        instructor_id,
        start_date,
        end_date,
        schedule,
        max_capacity,
        fee,
        requirements,
        location
      } = req.body;

      if (!temple_id || !title || !category || !instructor_id || !start_date) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, title, category, instructor ID, and start date are required'
        });
      }

      // Validate category
      const validCategories = [
        'yoga', 'meditation', 'scripture_study', 'music', 'dance', 
        'language', 'philosophy', 'ritual_training', 'art', 'other'
      ];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class category'
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

      // Check if instructor exists
      const instructorQuery = 'SELECT id, name FROM users WHERE id = $1';
      const instructorResult = await db.query(instructorQuery, [instructor_id]);

      if (instructorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
      }

      const insertQuery = `
        INSERT INTO temple_classes (
          temple_id, title, description, category, instructor_id,
          start_date, end_date, schedule, max_capacity, fee,
          requirements, location, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        temple_id, title, description, category, instructor_id,
        start_date, end_date, JSON.stringify(schedule), max_capacity, fee,
        requirements, location
      ]);

      // Get complete class details
      const detailsQuery = `
        SELECT tc.*, u.name as instructor_name, t.name as temple_name
        FROM temple_classes tc
        JOIN users u ON tc.instructor_id = u.id
        JOIN temples t ON tc.temple_id = t.id
        WHERE tc.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update class
  updateClass: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        instructor_id,
        start_date,
        end_date,
        schedule,
        max_capacity,
        fee,
        requirements,
        location,
        status
      } = req.body;

      // Check if class exists
      const checkQuery = 'SELECT * FROM temple_classes WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
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

      if (description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        params.push(description);
        paramCount++;
      }

      if (category) {
        const validCategories = [
          'yoga', 'meditation', 'scripture_study', 'music', 'dance', 
          'language', 'philosophy', 'ritual_training', 'art', 'other'
        ];
        
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid class category'
          });
        }
        updateFields.push(`category = $${paramCount}`);
        params.push(category);
        paramCount++;
      }

      if (instructor_id) {
        // Check if instructor exists
        const instructorQuery = 'SELECT id FROM users WHERE id = $1';
        const instructorResult = await db.query(instructorQuery, [instructor_id]);

        if (instructorResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Instructor not found'
          });
        }
        updateFields.push(`instructor_id = $${paramCount}`);
        params.push(instructor_id);
        paramCount++;
      }

      if (start_date) {
        updateFields.push(`start_date = $${paramCount}`);
        params.push(start_date);
        paramCount++;
      }

      if (end_date !== undefined) {
        updateFields.push(`end_date = $${paramCount}`);
        params.push(end_date);
        paramCount++;
      }

      if (schedule) {
        updateFields.push(`schedule = $${paramCount}`);
        params.push(JSON.stringify(schedule));
        paramCount++;
      }

      if (max_capacity !== undefined) {
        updateFields.push(`max_capacity = $${paramCount}`);
        params.push(max_capacity);
        paramCount++;
      }

      if (fee !== undefined) {
        updateFields.push(`fee = $${paramCount}`);
        params.push(fee);
        paramCount++;
      }

      if (requirements !== undefined) {
        updateFields.push(`requirements = $${paramCount}`);
        params.push(requirements);
        paramCount++;
      }

      if (location !== undefined) {
        updateFields.push(`location = $${paramCount}`);
        params.push(location);
        paramCount++;
      }

      if (status) {
        const validStatuses = ['active', 'inactive', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status'
          });
        }
        updateFields.push(`status = $${paramCount}`);
        params.push(status);
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
        UPDATE temple_classes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete class
  deleteClass: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if class exists
      const checkQuery = 'SELECT * FROM temple_classes WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check if there are active enrollments
      const enrollmentQuery = 'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2';
      const enrollmentResult = await db.query(enrollmentQuery, [id, 'active']);

      if (parseInt(enrollmentResult.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete class with active enrollments. Cancel enrollments first.'
        });
      }

      // Delete the class
      const deleteQuery = 'DELETE FROM temple_classes WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Class deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get class enrollments
  getClassEnrollments: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT ce.*, u.name as student_name, u.email as student_email, u.phone as student_phone
        FROM class_enrollments ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.class_id = $1
      `;

      const params = [id];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND ce.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY ce.enrollment_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM class_enrollments ce
        WHERE ce.class_id = $1
      `;
      const countParams = [id];

      if (status) {
        countQuery += ' AND ce.status = $2';
        countParams.push(status);
      }

      const countResult = await db.query(countQuery, countParams);

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
      console.error('Error fetching class enrollments:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update enrollment status
  updateEnrollmentStatus: async (req, res) => {
    try {
      const { id, enrollment_id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Validate status
      const validStatuses = ['active', 'completed', 'dropped', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid enrollment status'
        });
      }

      // Check if enrollment exists
      const checkQuery = 'SELECT * FROM class_enrollments WHERE id = $1 AND class_id = $2';
      const checkResult = await db.query(checkQuery, [enrollment_id, id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      const updateQuery = `
        UPDATE class_enrollments 
        SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND class_id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [status, notes, enrollment_id, id]);

      res.json({
        success: true,
        message: 'Enrollment status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get class categories
  getClassCategories: async (req, res) => {
    try {
      const { temple_id } = req.query;

      let query = `
        SELECT category, COUNT(*) as class_count, AVG(fee) as avg_fee
        FROM temple_classes 
        WHERE status = 'active'
      `;

      const params = [];

      if (temple_id) {
        query += ' AND temple_id = $1';
        params.push(temple_id);
      }

      query += ' GROUP BY category ORDER BY class_count DESC';

      const result = await db.query(query, params);

      const categories = [
        { value: 'yoga', label: 'Yoga', description: 'Physical and spiritual practice' },
        { value: 'meditation', label: 'Meditation', description: 'Mindfulness and spiritual meditation' },
        { value: 'scripture_study', label: 'Scripture Study', description: 'Study of religious texts' },
        { value: 'music', label: 'Music', description: 'Devotional and classical music' },
        { value: 'dance', label: 'Dance', description: 'Classical and devotional dance' },
        { value: 'language', label: 'Language', description: 'Sanskrit and other sacred languages' },
        { value: 'philosophy', label: 'Philosophy', description: 'Religious and spiritual philosophy' },
        { value: 'ritual_training', label: 'Ritual Training', description: 'Training in religious rituals' },
        { value: 'art', label: 'Art', description: 'Religious and spiritual art forms' },
        { value: 'other', label: 'Other', description: 'Other spiritual and cultural classes' }
      ];

      // Merge with actual data
      const categoriesWithData = categories.map(category => {
        const data = result.rows.find(r => r.category === category.value);
        return {
          ...category,
          class_count: data ? parseInt(data.class_count) : 0,
          avg_fee: data ? parseFloat(data.avg_fee) : null
        };
      });

      res.json({
        success: true,
        data: categoriesWithData
      });
    } catch (error) {
      console.error('Error fetching class categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get class statistics
  getClassStats: async (req, res) => {
    try {
      const { temple_id } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      // Overall statistics
      const overallQuery = `
        SELECT 
          COUNT(*) as total_classes,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_classes,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_classes,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_classes,
          AVG(fee) as avg_fee,
          SUM(max_capacity) as total_capacity
        FROM temple_classes
        WHERE temple_id = $1
      `;

      const overallResult = await db.query(overallQuery, [temple_id]);

      // Enrollment statistics
      const enrollmentQuery = `
        SELECT 
          COUNT(ce.id) as total_enrollments,
          COUNT(CASE WHEN ce.status = 'active' THEN 1 END) as active_enrollments,
          COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completed_enrollments,
          COUNT(CASE WHEN ce.status = 'dropped' THEN 1 END) as dropped_enrollments
        FROM class_enrollments ce
        JOIN temple_classes tc ON ce.class_id = tc.id
        WHERE tc.temple_id = $1
      `;

      const enrollmentResult = await db.query(enrollmentQuery, [temple_id]);

      // Category breakdown
      const categoryQuery = `
        SELECT category, COUNT(*) as class_count, 
               COUNT(ce.id) as total_enrollments
        FROM temple_classes tc
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
        WHERE tc.temple_id = $1 AND tc.status = 'active'
        GROUP BY category
        ORDER BY class_count DESC
      `;

      const categoryResult = await db.query(categoryQuery, [temple_id]);

      // Popular instructors
      const instructorQuery = `
        SELECT u.name as instructor_name, COUNT(tc.id) as class_count,
               COUNT(ce.id) as total_enrollments
        FROM temple_classes tc
        JOIN users u ON tc.instructor_id = u.id
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
        WHERE tc.temple_id = $1 AND tc.status = 'active'
        GROUP BY u.id, u.name
        ORDER BY total_enrollments DESC
        LIMIT 10
      `;

      const instructorResult = await db.query(instructorQuery, [temple_id]);

      res.json({
        success: true,
        data: {
          overview: {
            ...overallResult.rows[0],
            ...enrollmentResult.rows[0]
          },
          category_breakdown: categoryResult.rows,
          popular_instructors: instructorResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching class statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = classesController;