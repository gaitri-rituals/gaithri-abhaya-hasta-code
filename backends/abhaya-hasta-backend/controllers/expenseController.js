const db = require('../config/database');

const expenseController = {
  // Get all expenses for a temple
  getAllExpenses: async (req, res) => {
    try {
      const { 
        temple_id, 
        category, 
        start_date, 
        end_date, 
        status,
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
        SELECT te.*, u.name as created_by_name, a.name as approved_by_name
        FROM temple_expenses te
        JOIN users u ON te.created_by = u.id
        LEFT JOIN users a ON te.approved_by = a.id
        WHERE te.temple_id = $1
      `;

      const params = [temple_id];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND te.category = $${paramCount}`;
        params.push(category);
      }

      if (start_date) {
        paramCount++;
        query += ` AND te.expense_date >= $${paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND te.expense_date <= $${paramCount}`;
        params.push(end_date);
      }

      if (status) {
        paramCount++;
        query += ` AND te.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY te.expense_date DESC, te.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count and sum
      let countQuery = `
        SELECT COUNT(*) as total, SUM(amount) as total_amount
        FROM temple_expenses te
        WHERE te.temple_id = $1
      `;
      const countParams = [temple_id];
      let countParamCount = 1;

      if (category) {
        countParamCount++;
        countQuery += ` AND te.category = $${countParamCount}`;
        countParams.push(category);
      }

      if (start_date) {
        countParamCount++;
        countQuery += ` AND te.expense_date >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND te.expense_date <= $${countParamCount}`;
        countParams.push(end_date);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND te.status = $${countParamCount}`;
        countParams.push(status);
      }

      const countResult = await db.query(countQuery, countParams);

      res.json({
        success: true,
        data: result.rows,
        summary: {
          total_records: parseInt(countResult.rows[0].total),
          total_amount: parseFloat(countResult.rows[0].total_amount || 0)
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get expense by ID
  getExpenseById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT te.*, u.name as created_by_name, a.name as approved_by_name,
               t.name as temple_name, t.city, t.state
        FROM temple_expenses te
        JOIN users u ON te.created_by = u.id
        LEFT JOIN users a ON te.approved_by = a.id
        JOIN temples t ON te.temple_id = t.id
        WHERE te.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create new expense
  createExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        temple_id,
        category,
        description,
        amount,
        expense_date,
        vendor_name,
        receipt_number,
        payment_method,
        notes
      } = req.body;

      if (!temple_id || !category || !description || !amount || !expense_date) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, category, description, amount, and expense date are required'
        });
      }

      // Validate category
      const validCategories = [
        'maintenance', 'utilities', 'supplies', 'food', 'decoration', 
        'staff_salary', 'events', 'donations_expense', 'transportation', 
        'equipment', 'other'
      ];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expense category'
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

      const insertQuery = `
        INSERT INTO temple_expenses (
          temple_id, category, description, amount, expense_date,
          vendor_name, receipt_number, payment_method, notes, 
          created_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        temple_id, category, description, amount, expense_date,
        vendor_name, receipt_number, payment_method, notes, userId
      ]);

      // Get complete expense details
      const detailsQuery = `
        SELECT te.*, u.name as created_by_name, t.name as temple_name
        FROM temple_expenses te
        JOIN users u ON te.created_by = u.id
        JOIN temples t ON te.temple_id = t.id
        WHERE te.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update expense
  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        category,
        description,
        amount,
        expense_date,
        vendor_name,
        receipt_number,
        payment_method,
        notes
      } = req.body;

      // Check if expense exists
      const checkQuery = 'SELECT * FROM temple_expenses WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      const expense = checkResult.rows[0];

      // Check if expense can be updated (only pending expenses)
      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending expenses can be updated'
        });
      }

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (category) {
        const validCategories = [
          'maintenance', 'utilities', 'supplies', 'food', 'decoration', 
          'staff_salary', 'events', 'donations_expense', 'transportation', 
          'equipment', 'other'
        ];
        
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid expense category'
          });
        }
        updateFields.push(`category = $${paramCount}`);
        params.push(category);
        paramCount++;
      }

      if (description) {
        updateFields.push(`description = $${paramCount}`);
        params.push(description);
        paramCount++;
      }

      if (amount !== undefined) {
        updateFields.push(`amount = $${paramCount}`);
        params.push(amount);
        paramCount++;
      }

      if (expense_date) {
        updateFields.push(`expense_date = $${paramCount}`);
        params.push(expense_date);
        paramCount++;
      }

      if (vendor_name !== undefined) {
        updateFields.push(`vendor_name = $${paramCount}`);
        params.push(vendor_name);
        paramCount++;
      }

      if (receipt_number !== undefined) {
        updateFields.push(`receipt_number = $${paramCount}`);
        params.push(receipt_number);
        paramCount++;
      }

      if (payment_method !== undefined) {
        updateFields.push(`payment_method = $${paramCount}`);
        params.push(payment_method);
        paramCount++;
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        params.push(notes);
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
        UPDATE temple_expenses 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Approve/Reject expense
  updateExpenseStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { status, approval_notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Validate status
      const validStatuses = ['approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be approved or rejected'
        });
      }

      // Check if expense exists
      const checkQuery = 'SELECT * FROM temple_expenses WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      const expense = checkResult.rows[0];

      // Check if expense is pending
      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending expenses can be approved or rejected'
        });
      }

      const updateQuery = `
        UPDATE temple_expenses 
        SET status = $1, approved_by = $2, approval_date = CURRENT_TIMESTAMP,
            approval_notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [status, userId, approval_notes, id]);

      res.json({
        success: true,
        message: `Expense ${status} successfully`,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating expense status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Delete expense
  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if expense exists
      const checkQuery = 'SELECT * FROM temple_expenses WHERE id = $1';
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      const expense = checkResult.rows[0];

      // Check if expense can be deleted (only pending expenses)
      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending expenses can be deleted'
        });
      }

      const deleteQuery = 'DELETE FROM temple_expenses WHERE id = $1 RETURNING *';
      const result = await db.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get expense categories
  getExpenseCategories: async (req, res) => {
    try {
      const { temple_id } = req.query;

      let query = `
        SELECT category, COUNT(*) as expense_count, SUM(amount) as total_amount
        FROM temple_expenses 
        WHERE status = 'approved'
      `;

      const params = [];

      if (temple_id) {
        query += ' AND temple_id = $1';
        params.push(temple_id);
      }

      query += ' GROUP BY category ORDER BY total_amount DESC';

      const result = await db.query(query, params);

      const categories = [
        { value: 'maintenance', label: 'Maintenance', description: 'Building and equipment maintenance' },
        { value: 'utilities', label: 'Utilities', description: 'Electricity, water, gas bills' },
        { value: 'supplies', label: 'Supplies', description: 'General supplies and materials' },
        { value: 'food', label: 'Food', description: 'Food for events and offerings' },
        { value: 'decoration', label: 'Decoration', description: 'Decorative items and flowers' },
        { value: 'staff_salary', label: 'Staff Salary', description: 'Employee salaries and benefits' },
        { value: 'events', label: 'Events', description: 'Event organization costs' },
        { value: 'donations_expense', label: 'Donations Expense', description: 'Expenses related to donations' },
        { value: 'transportation', label: 'Transportation', description: 'Travel and transportation costs' },
        { value: 'equipment', label: 'Equipment', description: 'Equipment purchase and rental' },
        { value: 'other', label: 'Other', description: 'Miscellaneous expenses' }
      ];

      // Merge with actual data
      const categoriesWithData = categories.map(category => {
        const data = result.rows.find(r => r.category === category.value);
        return {
          ...category,
          expense_count: data ? parseInt(data.expense_count) : 0,
          total_amount: data ? parseFloat(data.total_amount) : 0
        };
      });

      res.json({
        success: true,
        data: categoriesWithData
      });
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get expense statistics
  getExpenseStats: async (req, res) => {
    try {
      const { temple_id, period = 'month' } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      // Get period-based date range
      let dateFilter = '';
      switch (period) {
        case 'week':
          dateFilter = "AND expense_date >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          dateFilter = "AND expense_date >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case 'quarter':
          dateFilter = "AND expense_date >= CURRENT_DATE - INTERVAL '90 days'";
          break;
        case 'year':
          dateFilter = "AND expense_date >= CURRENT_DATE - INTERVAL '365 days'";
          break;
        default:
          dateFilter = "AND expense_date >= CURRENT_DATE - INTERVAL '30 days'";
      }

      // Overall statistics
      const overallQuery = `
        SELECT 
          COUNT(*) as total_expenses,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved_amount,
          AVG(CASE WHEN status = 'approved' THEN amount END) as avg_expense_amount
        FROM temple_expenses
        WHERE temple_id = $1 ${dateFilter}
      `;

      const overallResult = await db.query(overallQuery, [temple_id]);

      // Category breakdown
      const categoryQuery = `
        SELECT category, COUNT(*) as count, SUM(amount) as total_amount
        FROM temple_expenses
        WHERE temple_id = $1 AND status = 'approved' ${dateFilter}
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      const categoryResult = await db.query(categoryQuery, [temple_id]);

      // Monthly trend (last 12 months)
      const trendQuery = `
        SELECT 
          DATE_TRUNC('month', expense_date) as month,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount
        FROM temple_expenses
        WHERE temple_id = $1 
          AND status = 'approved'
          AND expense_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', expense_date)
        ORDER BY month
      `;

      const trendResult = await db.query(trendQuery, [temple_id]);

      // Top vendors
      const vendorQuery = `
        SELECT vendor_name, COUNT(*) as transaction_count, SUM(amount) as total_amount
        FROM temple_expenses
        WHERE temple_id = $1 
          AND status = 'approved' 
          AND vendor_name IS NOT NULL 
          ${dateFilter}
        GROUP BY vendor_name
        ORDER BY total_amount DESC
        LIMIT 10
      `;

      const vendorResult = await db.query(vendorQuery, [temple_id]);

      res.json({
        success: true,
        data: {
          period,
          overview: overallResult.rows[0],
          category_breakdown: categoryResult.rows,
          monthly_trend: trendResult.rows,
          top_vendors: vendorResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get pending approvals
  getPendingApprovals: async (req, res) => {
    try {
      const { temple_id, limit = 20, offset = 0 } = req.query;

      if (!temple_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID is required'
        });
      }

      const query = `
        SELECT te.*, u.name as created_by_name, u.email as created_by_email
        FROM temple_expenses te
        JOIN users u ON te.created_by = u.id
        WHERE te.temple_id = $1 AND te.status = 'pending'
        ORDER BY te.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [temple_id, limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total, SUM(amount) as total_amount
        FROM temple_expenses
        WHERE temple_id = $1 AND status = 'pending'
      `;

      const countResult = await db.query(countQuery, [temple_id]);

      res.json({
        success: true,
        data: result.rows,
        summary: {
          total_pending: parseInt(countResult.rows[0].total),
          total_pending_amount: parseFloat(countResult.rows[0].total_amount || 0)
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = expenseController;