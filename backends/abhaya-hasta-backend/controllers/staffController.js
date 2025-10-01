const db = require('../config/database');

const staffController = {
  // Get all staff members for a temple
  getAllStaff: async (req, res) => {
    try {
      const { temple_id, role, status, limit = 50, offset = 0 } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      let query = `
        SELECT ts.*, u.name, u.email, u.phone, u.created_at as user_created_at
        FROM temple_staff ts
        JOIN users u ON ts.user_id = u.id
        WHERE ts.temple_id = $1
      `;

      const params = [temple_id];
      let paramCount = 1;

      if (role) {
        paramCount++;
        query += ` AND ts.role = $${paramCount}`;
        params.push(role);
      }

      if (status) {
        paramCount++;
        query += ` AND ts.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY ts.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM temple_staff ts
        WHERE ts.temple_id = $1
      `;
      const countParams = [temple_id];
      let countParamCount = 1;

      if (role) {
        countParamCount++;
        countQuery += ` AND ts.role = $${countParamCount}`;
        countParams.push(role);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND ts.status = $${countParamCount}`;
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
      console.error('Error fetching staff:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get staff member by ID
  getStaffById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT ts.*, u.name, u.email, u.phone, u.created_at as user_created_at,
               t.name as temple_name, t.city, t.state
        FROM temple_staff ts
        JOIN users u ON ts.user_id = u.id
        JOIN temples t ON ts.temple_id = t.id
        WHERE ts.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Add new staff member
  addStaff: async (req, res) => {
    try {
      const {
        temple_id,
        user_id,
        role,
        salary,
        hire_date,
        shift_start,
        shift_end,
        permissions
      } = req.body;

      if (!temple_id || !user_id || !role) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, User ID, and role are required'
        });
      }

      // Validate role
      const validRoles = ['priest', 'manager', 'security', 'cleaner', 'accountant', 'volunteer', 'administrator'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Check if user exists
      const userQuery = 'SELECT id, name, email FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
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

      // Check if user is already staff at this temple
      const existingQuery = 'SELECT id FROM temple_staff WHERE temple_id = $1 AND user_id = $2 AND status = $3';
      const existingResult = await db.query(existingQuery, [temple_id, user_id, 'active']);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User is already an active staff member at this temple'
        });
      }

      const insertQuery = `
        INSERT INTO temple_staff (
          temple_id, user_id, role, salary, hire_date, 
          shift_start, shift_end, permissions, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        temple_id, user_id, role, salary, hire_date || new Date(),
        shift_start, shift_end, JSON.stringify(permissions || {}), 
      ]);

      // Get complete staff details
      const detailsQuery = `
        SELECT ts.*, u.name, u.email, u.phone, t.name as temple_name
        FROM temple_staff ts
        JOIN users u ON ts.user_id = u.id
        JOIN temples t ON ts.temple_id = t.id
        WHERE ts.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Staff member added successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error adding staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update staff member
  updateStaff: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        role,
        salary,
        shift_start,
        shift_end,
        permissions,
        status
      } = req.body;

      // Check if staff member exists
      const checkQuery = 'SELECT * FROM temple_staff WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (role) {
        const validRoles = ['priest', 'manager', 'security', 'cleaner', 'accountant', 'volunteer', 'administrator'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role'
          });
        }
        updateFields.push(`role = $${paramCount}`);
        params.push(role);
        paramCount++;
      }

      if (salary !== undefined) {
        updateFields.push(`salary = $${paramCount}`);
        params.push(salary);
        paramCount++;
      }

      if (shift_start) {
        updateFields.push(`shift_start = $${paramCount}`);
        params.push(shift_start);
        paramCount++;
      }

      if (shift_end) {
        updateFields.push(`shift_end = $${paramCount}`);
        params.push(shift_end);
        paramCount++;
      }

      if (permissions) {
        updateFields.push(`permissions = $${paramCount}`);
        params.push(JSON.stringify(permissions));
        paramCount++;
      }

      if (status) {
        const validStatuses = ['active', 'inactive', 'terminated'];
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
        UPDATE temple_staff 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      // Get complete staff details
      const detailsQuery = `
        SELECT ts.*, u.name, u.email, u.phone, t.name as temple_name
        FROM temple_staff ts
        JOIN users u ON ts.user_id = u.id
        JOIN temples t ON ts.temple_id = t.id
        WHERE ts.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [id]);

      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete/Terminate staff member
  deleteStaff: async (req, res) => {
    try {
      const { id } = req.params;
      const { termination_reason } = req.body;

      // Check if staff member exists
      const checkQuery = 'SELECT * FROM temple_staff WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Instead of deleting, mark as terminated
      const updateQuery = `
        UPDATE temple_staff 
        SET status = 'terminated', 
            termination_date = CURRENT_TIMESTAMP,
            termination_reason = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(updateQuery, [termination_reason, id]);

      res.json({
        success: true,
        message: 'Staff member terminated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error terminating staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get staff roles
  getStaffRoles: async (req, res) => {
    try {
      const { temple_id } = req.query;

      let query = `
        SELECT role, COUNT(*) as count, AVG(salary) as avg_salary
        FROM temple_staff
        WHERE status = 'active'
      `;

      const params = [];

      if (temple_id) {
        query += ' AND temple_id = $1';
        params.push(temple_id);
      }

      query += ' GROUP BY role ORDER BY count DESC';

      const result = await db.query(query, params);

      const roles = [
        { value: 'priest', label: 'Priest', description: 'Performs religious ceremonies and rituals' },
        { value: 'manager', label: 'Manager', description: 'Manages temple operations and staff' },
        { value: 'security', label: 'Security', description: 'Ensures temple security and safety' },
        { value: 'cleaner', label: 'Cleaner', description: 'Maintains temple cleanliness' },
        { value: 'accountant', label: 'Accountant', description: 'Manages financial records and transactions' },
        { value: 'volunteer', label: 'Volunteer', description: 'Assists with various temple activities' },
        { value: 'administrator', label: 'Administrator', description: 'Administrative and coordination tasks' }
      ];

      // Merge with actual data
      const rolesWithData = roles.map(role => {
        const data = result.rows.find(r => r.role === role.value);
        return {
          ...role,
          count: data ? parseInt(data.count) : 0,
          avg_salary: data ? parseFloat(data.avg_salary) : null
        };
      });

      res.json({
        success: true,
        data: rolesWithData
      });
    } catch (error) {
      console.error('Error fetching staff roles:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get staff statistics
  getStaffStats: async (req, res) => {
    try {
      const { temple_id } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_staff,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_staff,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_staff,
          COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_staff,
          AVG(CASE WHEN status = 'active' AND salary IS NOT NULL THEN salary END) as avg_salary,
          SUM(CASE WHEN status = 'active' AND salary IS NOT NULL THEN salary END) as total_salary_cost
        FROM temple_staff
        WHERE temple_id = $1
      `;

      const statsResult = await db.query(statsQuery, [temple_id]);

      // Get role distribution
      const roleQuery = `
        SELECT role, COUNT(*) as count
        FROM temple_staff
        WHERE temple_id = $1 AND status = 'active'
        GROUP BY role
        ORDER BY count DESC
      `;

      const roleResult = await db.query(roleQuery, [temple_id]);

      // Get recent hires (last 30 days)
      const recentHiresQuery = `
        SELECT COUNT(*) as recent_hires
        FROM temple_staff
        WHERE temple_id = $1 
          AND hire_date >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const recentHiresResult = await db.query(recentHiresQuery, [temple_id]);

      res.json({
        success: true,
        data: {
          overview: statsResult.rows[0],
          role_distribution: roleResult.rows,
          recent_hires: parseInt(recentHiresResult.rows[0].recent_hires)
        }
      });
    } catch (error) {
      console.error('Error fetching staff statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get staff schedule
  getStaffSchedule: async (req, res) => {
    try {
      const { temple_id, date } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT ts.*, u.name, u.phone,
               ts.shift_start, ts.shift_end
        FROM temple_staff ts
        JOIN users u ON ts.user_id = u.id
        WHERE ts.temple_id = $1 
          AND ts.status = 'active'
          AND ts.shift_start IS NOT NULL
          AND ts.shift_end IS NOT NULL
        ORDER BY ts.shift_start
      `;

      const result = await db.query(query, [temple_id]);

      // Group by shift times
      const schedule = result.rows.reduce((acc, staff) => {
        const shiftKey = `${staff.shift_start}-${staff.shift_end}`;
        if (!acc[shiftKey]) {
          acc[shiftKey] = {
            shift_start: staff.shift_start,
            shift_end: staff.shift_end,
            staff_members: []
          };
        }
        acc[shiftKey].staff_members.push({
          id: staff.id,
          name: staff.name,
          role: staff.role,
          phone: staff.phone
        });
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          date: targetDate,
          shifts: Object.values(schedule)
        }
      });
    } catch (error) {
      console.error('Error fetching staff schedule:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = staffController;