const express = require('express');
const sequelize = require('../config/database.js');
const { QueryTypes } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/store/products
// @desc    Get temple store products
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const { temple_id, category, search, featured, limit = 20, offset = 0 } = req.query;

    let whereConditions = ['sp.is_available = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Filter by temple
    if (temple_id) {
      whereConditions.push(`sp.temple_id = $${paramIndex}`);
      queryParams.push(temple_id);
      paramIndex++;
    }

    // Filter by category
    if (category) {
      whereConditions.push(`LOWER(sp.category) = LOWER($${paramIndex})`);
      queryParams.push(category);
      paramIndex++;
    }

    // Search functionality
    if (search) {
      whereConditions.push(`(
        LOWER(sp.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(sp.description) LIKE LOWER($${paramIndex}) OR 
        LOWER(sp.category) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY sp.created_at DESC';
    if (featured === 'true') {
      orderBy = 'ORDER BY sp.stock_quantity DESC, sp.created_at DESC';
    }

    const productsQuery = `
      SELECT 
        sp.*,
        t.name as temple_name,
        t.city as temple_city,
        t.state as temple_state,
        CASE 
          WHEN sp.stock_quantity = 0 THEN 'out_of_stock'
          WHEN sp.stock_quantity <= 5 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM store_products sp
      JOIN temples t ON sp.temple_id = t.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const products = await sequelize.query(productsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Store products retrieved successfully',
      data: products,
      count: products.length
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

    const products = await sequelize.query(productQuery, {
      bind: [productId],
      type: QueryTypes.SELECT
    });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = products[0];

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

    const relatedProducts = await sequelize.query(relatedQuery, {
      bind: [product.temple_id, product.category, productId],
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Product details retrieved successfully',
      data: {
        ...product,
        related_products: relatedProducts
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

    const dbCategories = await sequelize.query(categoriesQuery, {
      type: QueryTypes.SELECT
    });

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
    const product = await sequelize.query(
      'SELECT * FROM store_products WHERE id = $1 AND is_available = true',
      {
        bind: [product_id],
        type: QueryTypes.SELECT
      }
    );

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    if (product[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available',
        available_quantity: product[0].stock_quantity
      });
    }

    // Check if product already in cart
    const existingCartItem = await sequelize.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      {
        bind: [user_id, product_id],
        type: QueryTypes.SELECT
      }
    );

    let cartItem;
    if (existingCartItem.length > 0) {
      // Update quantity if already in cart
      const newQuantity = existingCartItem[0].quantity + quantity;
      if (newQuantity > product[0].stock_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add more of this item',
          current_quantity: existingCartItem[0].quantity,
          available_quantity: product[0].stock_quantity
        });
      }

      await sequelize.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        {
          bind: [newQuantity, existingCartItem[0].id],
          type: QueryTypes.UPDATE
        }
      );

      cartItem = {
        ...existingCartItem[0],
        quantity: newQuantity
      };
    } else {
      // Add new cart item
      const result = await sequelize.query(
        `INSERT INTO cart_items (
          user_id, product_id, quantity, created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
        {
          bind: [user_id, product_id, quantity],
          type: QueryTypes.INSERT
        }
      );

      cartItem = result[0][0];
    }

    // Get updated cart total
    const cartTotal = await sequelize.query(
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
    const cartItem = await sequelize.query(
      'SELECT ci.*, sp.stock_quantity FROM cart_items ci JOIN store_products sp ON ci.product_id = sp.id WHERE ci.id = $1 AND ci.user_id = $2',
      {
        bind: [cartItemId, user_id],
        type: QueryTypes.SELECT
      }
    );

    if (cartItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    if (quantity > cartItem[0].stock_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available',
        available_quantity: cartItem[0].stock_quantity
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      await sequelize.query(
        'DELETE FROM cart_items WHERE id = $1',
        {
          bind: [cartItemId],
          type: QueryTypes.DELETE
        }
      );
    } else {
      // Update quantity
      await sequelize.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        {
          bind: [quantity, cartItemId],
          type: QueryTypes.UPDATE
        }
      );
    }

    // Get updated cart total
    const cartTotal = await sequelize.query(
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

    const cartItems = await sequelize.query(cartQuery, {
      bind: [user_id],
      type: QueryTypes.SELECT
    });

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

module.exports = router;
