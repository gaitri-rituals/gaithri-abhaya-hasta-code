const db = require('../config/database');

const storeController = {
  // Get all store items with filtering
  getStoreItems: async (req, res) => {
    try {
      const { category, vendor_id, search, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT si.*, v.name as vendor_name, v.category as vendor_category
        FROM store_items si
        JOIN vendors v ON si.vendor_id = v.id
        WHERE si.is_available = true AND v.is_active = true
      `;
      
      const params = [];
      
      if (category) {
        query += ' AND si.category = $' + (params.length + 1);
        params.push(category);
      }
      
      if (vendor_id) {
        query += ' AND si.vendor_id = $' + (params.length + 1);
        params.push(vendor_id);
      }
      
      if (search) {
        query += ' AND (si.name ILIKE $' + (params.length + 1) + ' OR si.description ILIKE $' + (params.length + 1) + ')';
        params.push(`%${search}%`);
      }
      
      query += ' ORDER BY si.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
      console.error('Error fetching store items:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get store item by ID
  getStoreItemById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT si.*, v.name as vendor_name, v.contact_person, v.phone as vendor_phone, v.email as vendor_email
        FROM store_items si
        JOIN vendors v ON si.vendor_id = v.id
        WHERE si.id = $1 AND si.is_available = true AND v.is_active = true
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Store item not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching store item:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get store categories
  getStoreCategories: async (req, res) => {
    try {
      const query = `
        SELECT category, COUNT(*) as item_count
        FROM store_items 
        WHERE is_available = true 
        GROUP BY category 
        ORDER BY item_count DESC
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching store categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { item_id, quantity = 1 } = req.body;

      if (!item_id || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid item ID and quantity are required'
        });
      }

      // Check if item exists and is available
      const itemQuery = 'SELECT * FROM store_items WHERE id = $1 AND is_available = true';
      const itemResult = await db.query(itemQuery, [item_id]);

      if (itemResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Item not found or not available'
        });
      }

      // Check if item already in cart
      const existingQuery = 'SELECT * FROM cart_items WHERE user_id = $1 AND item_id = $2';
      const existingResult = await db.query(existingQuery, [userId, item_id]);

      if (existingResult.rows.length > 0) {
        // Update quantity
        const updateQuery = `
          UPDATE cart_items 
          SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $2 AND item_id = $3 
          RETURNING *
        `;
        const result = await db.query(updateQuery, [quantity, userId, item_id]);
        
        res.json({
          success: true,
          message: 'Cart updated successfully',
          data: result.rows[0]
        });
      } else {
        // Add new item to cart
        const insertQuery = `
          INSERT INTO cart_items (user_id, item_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *
        `;
        const result = await db.query(insertQuery, [userId, item_id, quantity]);
        
        res.status(201).json({
          success: true,
          message: 'Item added to cart successfully',
          data: result.rows[0]
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's cart
  getCart: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT ci.*, si.name, si.description, si.price, si.image_url,
               v.name as vendor_name,
               (ci.quantity * si.price) as total_price
        FROM cart_items ci
        JOIN store_items si ON ci.item_id = si.id
        JOIN vendors v ON si.vendor_id = v.id
        WHERE ci.user_id = $1 AND si.is_available = true AND v.is_active = true
        ORDER BY ci.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      
      // Calculate cart totals
      const totalAmount = result.rows.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const totalItems = result.rows.reduce((sum, item) => sum + item.quantity, 0);
      
      res.json({
        success: true,
        data: {
          items: result.rows,
          summary: {
            total_items: totalItems,
            total_amount: totalAmount.toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const updateQuery = `
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 AND user_id = $3 
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, [quantity, id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleteQuery = 'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *';
      const result = await db.query(deleteQuery, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const userId = req.user.id;

      const deleteQuery = 'DELETE FROM cart_items WHERE user_id = $1';
      await db.query(deleteQuery, [userId]);

      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create order from cart
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      const { delivery_address, special_instructions } = req.body;

      if (!delivery_address) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address is required'
        });
      }

      // Get cart items
      const cartQuery = `
        SELECT ci.*, si.name, si.price, v.name as vendor_name
        FROM cart_items ci
        JOIN store_items si ON ci.item_id = si.id
        JOIN vendors v ON si.vendor_id = v.id
        WHERE ci.user_id = $1 AND si.is_available = true
      `;
      
      const cartResult = await db.query(cartQuery, [userId]);

      if (cartResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Calculate total amount
      const totalAmount = cartResult.rows.reduce((sum, item) => 
        sum + (item.quantity * parseFloat(item.price)), 0
      );

      // Create order
      const orderQuery = `
        INSERT INTO store_orders (user_id, total_amount, delivery_address, special_instructions, status) 
        VALUES ($1, $2, $3, $4, 'pending') 
        RETURNING *
      `;
      
      const orderResult = await db.query(orderQuery, [
        userId, totalAmount, delivery_address, special_instructions
      ]);
      
      const order = orderResult.rows[0];

      // Create order items
      for (const item of cartResult.rows) {
        const orderItemQuery = `
          INSERT INTO store_order_items (order_id, item_id, quantity, price) 
          VALUES ($1, $2, $3, $4)
        `;
        await db.query(orderItemQuery, [order.id, item.item_id, item.quantity, item.price]);
      }

      // Clear cart
      await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's orders
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT so.*, 
               COUNT(soi.id) as item_count
        FROM store_orders so
        LEFT JOIN store_order_items soi ON so.id = soi.order_id
        WHERE so.user_id = $1
      `;

      const params = [userId];

      if (status) {
        query += ' AND so.status = $' + (params.length + 1);
        params.push(status);
      }

      query += ` 
        GROUP BY so.id 
        ORDER BY so.created_at DESC 
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
      console.error('Error fetching user orders:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get order details
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get order details
      const orderQuery = `
        SELECT * FROM store_orders 
        WHERE id = $1 AND user_id = $2
      `;
      
      const orderResult = await db.query(orderQuery, [id, userId]);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsQuery = `
        SELECT soi.*, si.name, si.description, si.image_url,
               v.name as vendor_name
        FROM store_order_items soi
        JOIN store_items si ON soi.item_id = si.id
        JOIN vendors v ON si.vendor_id = v.id
        WHERE soi.order_id = $1
      `;
      
      const itemsResult = await db.query(itemsQuery, [id]);

      res.json({
        success: true,
        data: {
          ...order,
          items: itemsResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = storeController;