const express = require('express');
const { pool } = require('../config/database.js');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// ============ CATEGORY MANAGEMENT (Admin) ============

// @route   GET /api/store/categories
// @desc    Get all store categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_product_count
      FROM store_categories c
      LEFT JOIN store_products p ON c.id = p.category_id
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/store/categories
// @desc    Create store category
// @access  Private (Admin)
router.post('/categories', protect, [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description, icon, cover_image, sort_order, is_active } = req.body;

    const result = await pool.query(`
      INSERT INTO store_categories (
        name, description, icon, cover_image, sort_order, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name, description, icon || 'Package', cover_image, sort_order || 0, is_active !== false]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/store/categories/:id
// @desc    Update store category
// @access  Private (Admin)
router.put('/categories/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, cover_image, sort_order, is_active } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount}`);
      values.push(icon);
      paramCount++;
    }
    if (cover_image !== undefined) {
      updateFields.push(`cover_image = $${paramCount}`);
      values.push(cover_image);
      paramCount++;
    }
    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramCount}`);
      values.push(sort_order);
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(`
      UPDATE store_categories 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/store/categories/:id
// @desc    Delete store category
// @access  Private (Admin)
router.delete('/categories/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCheck = await pool.query(
      'SELECT COUNT(*) as count FROM store_products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products. Please delete or move products first.'
      });
    }

    const result = await pool.query(
      'DELETE FROM store_categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ PRODUCT MANAGEMENT (Admin) ============

// @route   GET /api/store/products
// @desc    Get temple store products
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const { category_id, search, featured, limit = 100, offset = 0 } = req.query;

    let whereConditions = ['sp.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Filter by category
    if (category_id) {
      whereConditions.push(`sp.category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    // Search functionality
    if (search) {
      whereConditions.push(`(
        LOWER(sp.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(sp.description) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY sp.created_at DESC';
    if (featured === 'true') {
      orderBy = 'ORDER BY sp.is_featured DESC, sp.created_at DESC';
    }

    const productsQuery = `
      SELECT 
        sp.*,
        sc.name as category_name,
        CASE 
          WHEN sp.stock = 0 THEN 'out-of-stock'
          WHEN sp.stock <= 5 THEN 'low-stock'
          ELSE 'in-stock'
        END as availability
      FROM store_products sp
      LEFT JOIN store_categories sc ON sp.category_id = sc.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(productsQuery, queryParams);

    res.json({
      success: true,
      message: 'Store products retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching store products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/store/products/:id
// @desc    Get single product details
// @access  Public
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const productQuery = `
      SELECT 
        sp.*,
        t.name as temple_name,
        t.description as temple_description,
        t.street, t.city, t.state,
        t.phone as temple_phone,
        t.email as temple_email,
        CASE 
          WHEN sp.stock_quantity = 0 THEN 'out_of_stock'
          WHEN sp.stock_quantity <= 5 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM store_products sp
      JOIN temples t ON sp.temple_id = t.id
      WHERE sp.id = $1 AND sp.is_available = true
    `;

    const result = await pool.query(productQuery, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = result.rows[0];

    // Get related products from same temple/category
    const relatedQuery = `
      SELECT sp.*, t.name as temple_name
      FROM store_products sp
      JOIN temples t ON sp.temple_id = t.id
      WHERE (sp.temple_id = $1 OR sp.category = $2)
      AND sp.id != $3 
      AND sp.is_available = true
      ORDER BY sp.stock_quantity DESC
      LIMIT 4
    `;

    const relatedResult = await pool.query(relatedQuery, [product.temple_id, product.category, productId]);

    res.json({
      success: true,
      message: 'Product details retrieved successfully',
      data: {
        ...product,
        related_products: relatedResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/store/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as product_count,
        AVG(price) as avg_price
      FROM store_products 
      WHERE is_available = true 
      GROUP BY category
      ORDER BY product_count DESC
    `;

    const result = await pool.query(categoriesQuery);
    const dbCategories = result.rows;

    // Add icons and descriptions for categories
    const categoryMeta = {
      'Prasadam': { icon: '🍯', description: 'Sacred offerings and blessed food' },
      'Religious Items': { icon: '🕉️', description: 'Sacred artifacts and decorative items' },
      'Pooja Items': { icon: '🪔', description: 'Essential items for worship' },
      'Books': { icon: '📚', description: 'Spiritual and religious literature' },
      'Jewelry': { icon: '💎', description: 'Sacred jewelry and accessories' },
      'Clothing': { icon: '🥻', description: 'Traditional and religious attire' },
      'Handicrafts': { icon: '🎨', description: 'Handmade religious crafts' }
    };

    const categories = dbCategories.map(cat => ({
      name: cat.category,
      product_count: parseInt(cat.product_count),
      avg_price: parseFloat(cat.avg_price).toFixed(2),
      icon: categoryMeta[cat.category]?.icon || '🛍️',
      description: categoryMeta[cat.category]?.description || 'Temple products'
    }));

    res.json({
      success: true,
      message: 'Product categories retrieved successfully',
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/store/cart/add
// @desc    Add product to cart
// @access  Private
router.post('/cart/add', protect, [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { product_id, quantity } = req.body;
    const user_id = req.user.userId;

    // Check if product exists and has enough stock
    const productResult = await pool.query(
      'SELECT * FROM store_products WHERE id = $1 AND is_available = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    const product = productResult.rows[0];
    
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available',
        available_quantity: product.stock_quantity
      });
    }

    // Check if product already in cart
    const existingResult = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    const existingCartItem = existingResult.rows;

    let cartItem;
    if (existingCartItem.length > 0) {
      // Update quantity if already in cart
      const newQuantity = existingCartItem[0].quantity + quantity;
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add more of this item',
          current_quantity: existingCartItem[0].quantity,
          available_quantity: product.stock_quantity
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, existingCartItem[0].id]
      );

      cartItem = {
        ...existingCartItem[0],
        quantity: newQuantity
      };
    } else {
      // Add new cart item
      const insertResult = await pool.query(
        `INSERT INTO cart_items (
          user_id, product_id, quantity, created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
        [user_id, product_id, quantity]
      );

      cartItem = insertResult.rows[0];
    }

    // Get updated cart total
    const cartTotal = await pool.query(
      `SELECT 
        COUNT(*) as item_count,
        SUM(ci.quantity * sp.price) as total_amount
       FROM cart_items ci
       JOIN store_products sp ON ci.product_id = sp.id
       WHERE ci.user_id = $1`,
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cart_item: cartItem,
        cart_total: {
          item_count: parseInt(cartTotal[0].item_count),
          total_amount: parseFloat(cartTotal[0].total_amount).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/store/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/cart/:id', protect, [
  body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const cartItemId = req.params.id;
    const { quantity } = req.body;
    const user_id = req.user.userId;

    // Check if cart item exists and belongs to user
    const cartItemResult = await pool.query(
      'SELECT ci.*, sp.stock_quantity FROM cart_items ci JOIN store_products sp ON ci.product_id = sp.id WHERE ci.id = $1 AND ci.user_id = $2',
      [cartItemId, user_id]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const cartItem = cartItemResult.rows[0];
    
    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available',
        available_quantity: cartItem.stock_quantity
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      await pool.query(
        'DELETE FROM cart_items WHERE id = $1',
        [cartItemId]
      );
    } else {
      // Update quantity
      await pool.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [quantity, cartItemId]
      );
    }

    // Get updated cart total
    const cartTotal = await pool.query(
      `SELECT 
        COUNT(*) as item_count,
        SUM(ci.quantity * sp.price) as total_amount
       FROM cart_items ci
       JOIN store_products sp ON ci.product_id = sp.id
       WHERE ci.user_id = $1`,
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
      data: {
        cart_total: {
          item_count: parseInt(cartTotal[0].item_count),
          total_amount: parseFloat(cartTotal[0].total_amount || 0).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/store/cart
// @desc    Get user's cart
// @access  Private
router.get('/cart', protect, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const cartQuery = `
      SELECT 
        ci.*,
        sp.name, sp.description, sp.price, sp.stock_quantity,
        t.name as temple_name,
        CASE 
          WHEN sp.stock_quantity = 0 THEN 'out_of_stock'
          WHEN sp.stock_quantity < ci.quantity THEN 'insufficient_stock'
          ELSE 'available'
        END as availability_status,
        (ci.quantity * sp.price) as item_total
      FROM cart_items ci
      JOIN store_products sp ON ci.product_id = sp.id
      JOIN temples t ON sp.temple_id = t.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `;

    const cartResult = await pool.query(cartQuery, [user_id]);
    const cartItems = cartResult.rows;

    const cartTotal = cartItems.reduce((total, item) => total + parseFloat(item.item_total), 0);

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        items: cartItems,
        total: {
          item_count: cartItems.length,
          total_amount: cartTotal.toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/store/products
// @desc    Create store product
// @access  Private (Admin)
router.post('/products', protect, [
  body('category_id').notEmpty().withMessage('Category ID is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      category_id, name, description, short_description,
      images, price, original_price, sku, stock, min_order_quantity,
      max_order_quantity, weight, dimensions, tags, is_active, is_featured
    } = req.body;

    const result = await pool.query(`
      INSERT INTO store_products (
        category_id, name, description, short_description, images, price,
        original_price, sku, stock, min_order_quantity, max_order_quantity,
        weight, dimensions, tags, is_active, is_featured, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      category_id, name, description, short_description || '',
      JSON.stringify(images || []), price, original_price || price,
      sku || `SKU${Date.now()}`, stock || 0, min_order_quantity || 1,
      max_order_quantity, weight, JSON.stringify(dimensions),
      JSON.stringify(tags || []), is_active !== false, is_featured || false
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/store/products/:id
// @desc    Update store product
// @access  Private (Admin)
router.put('/products/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id, name, description, short_description, images, price,
      original_price, sku, stock, min_order_quantity, max_order_quantity,
      weight, dimensions, tags, is_active, is_featured
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramCount}`);
      values.push(category_id);
      paramCount++;
    }
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (short_description !== undefined) {
      updateFields.push(`short_description = $${paramCount}`);
      values.push(short_description);
      paramCount++;
    }
    if (images !== undefined) {
      updateFields.push(`images = $${paramCount}`);
      values.push(JSON.stringify(images));
      paramCount++;
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (original_price !== undefined) {
      updateFields.push(`original_price = $${paramCount}`);
      values.push(original_price);
      paramCount++;
    }
    if (sku !== undefined) {
      updateFields.push(`sku = $${paramCount}`);
      values.push(sku);
      paramCount++;
    }
    if (stock !== undefined) {
      updateFields.push(`stock = $${paramCount}`);
      values.push(stock);
      paramCount++;
    }
    if (min_order_quantity !== undefined) {
      updateFields.push(`min_order_quantity = $${paramCount}`);
      values.push(min_order_quantity);
      paramCount++;
    }
    if (max_order_quantity !== undefined) {
      updateFields.push(`max_order_quantity = $${paramCount}`);
      values.push(max_order_quantity);
      paramCount++;
    }
    if (weight !== undefined) {
      updateFields.push(`weight = $${paramCount}`);
      values.push(weight);
      paramCount++;
    }
    if (dimensions !== undefined) {
      updateFields.push(`dimensions = $${paramCount}`);
      values.push(JSON.stringify(dimensions));
      paramCount++;
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramCount}`);
      values.push(JSON.stringify(tags));
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramCount}`);
      values.push(is_featured);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(`
      UPDATE store_products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/store/products/:id
// @desc    Delete store product
// @access  Private (Admin)
router.delete('/products/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM store_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
