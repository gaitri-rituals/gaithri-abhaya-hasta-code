import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

// Configuration data (can be moved to database later)
const packageConfig = {
  basic: {
    name: 'Basic Package',
    description: 'Essential rituals with minimal offerings',
    detailedDescription: 'Perfect for simple ceremonies and first-time devotees. Includes all essential elements for a complete puja experience.',
    includes: ['Purohit services', 'Basic puja items', 'Simple offerings', 'Digital certificate'],
    duration: '2-3 hours',
    priceMultiplier: 1,
  },
  advance: {
    name: 'Advance Package', 
    description: 'Enhanced rituals with better quality items',
    detailedDescription: 'Enhanced experience with premium materials and extended rituals. Ideal for special occasions and important milestones.',
    includes: ['Experienced Purohit', 'Premium puja kit', 'Extended rituals', 'Basic prasadam', 'Flower decorations', 'Digital photos'],
    duration: '3-4 hours',
    priceMultiplier: 1.5,
  },
  premium: {
    name: 'Premium Package',
    description: 'Complete experience with high-quality items',
    detailedDescription: 'The ultimate puja experience with luxury amenities and comprehensive documentation. Perfect for once-in-a-lifetime ceremonies.',
    includes: ['Senior Purohit', 'Deluxe puja kit', 'Full rituals', 'Video recording', 'Prasadam', 'Digital instructions', 'Live streaming', 'Premium decorations', 'Catered refreshments'],
    duration: '4-5 hours',
    priceMultiplier: 2.2,
  }
};

const cateringConfig = {
  basic: {
    name: 'Basic Catering',
    description: 'Simple vegetarian meal',
    items: ['Rice', 'Dal', 'Vegetable curry', 'Chapati', 'Pickle'],
    pricePerPerson: 150
  },
  standard: {
    name: 'Standard Catering',
    description: 'Traditional South Indian feast',
    items: ['Rice varieties', 'Sambar', 'Rasam', 'Multiple curries', 'Chapati', 'Sweets', 'Papad'],
    pricePerPerson: 250
  },
  premium: {
    name: 'Premium Catering',
    description: 'Elaborate traditional feast',
    items: ['Multiple rice varieties', 'Sambar', 'Rasam', '4+ curries', 'Chapati', 'Sweets', 'Fruits', 'Special items'],
    pricePerPerson: 400
  }
};

const addOnServicesConfig = [
  {
    id: 'flowers',
    name: 'Fresh Flowers',
    description: 'Premium flower decorations',
    price: 1500
  },
  {
    id: 'fruits',
    name: 'Fruit Offerings',
    description: 'Seasonal fresh fruits for offerings',
    price: 800
  },
  {
    id: 'media',
    name: 'Photography & Videography',
    description: 'Professional documentation of the ceremony',
    price: 5000
  },
  {
    id: 'decor',
    name: 'Decoration Services',
    description: 'Traditional decorations and setup',
    price: 3000
  },
  {
    id: 'transport',
    name: 'Purohit Transportation',
    description: 'Travel arrangements for the priest',
    price: 1000
  }
];

const ritualsController = {
  // Get package configurations
  getPackageConfigurations: async (req, res) => {
    try {
      res.json({
        success: true,
        data: packageConfig
      });
    } catch (error) {
      console.error('Error fetching package configurations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get catering configurations
  getCateringConfigurations: async (req, res) => {
    try {
      res.json({
        success: true,
        data: cateringConfig
      });
    } catch (error) {
      console.error('Error fetching catering configurations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get add-on services configurations
  getAddOnServicesConfigurations: async (req, res) => {
    try {
      res.json({
        success: true,
        data: addOnServicesConfig
      });
    } catch (error) {
      console.error('Error fetching add-on services configurations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get all ritual categories
  getRitualCategories: async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT category, 
               COUNT(*) as ritual_count,
               MIN(base_price) as min_price,
               MAX(base_price) as max_price
        FROM rituals 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY ritual_count DESC
      `;
      
      const categories = await sequelize.query(query, { type: QueryTypes.SELECT });
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching ritual categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get all rituals with filtering
  getAllRituals: async (req, res) => {
    try {
      const { category, search, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT r.*, 
               v.name as vendor_name,
               v.phone as vendor_phone,
               v.experience_years
        FROM rituals r
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.is_active = true
      `;
      
      const params = [];
      
      if (category) {
        query += ' AND r.category = $' + (params.length + 1);
        params.push(category);
      }
      
      if (search) {
        query += ' AND (r.name ILIKE $' + (params.length + 1) + ' OR r.description ILIKE $' + (params.length + 1) + ')';
        params.push(`%${search}%`);
      }
      
      query += ' ORDER BY r.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const rituals = await sequelize.query(query, { 
        bind: params, 
        type: QueryTypes.SELECT 
      });
      
      res.json({
        success: true,
        data: rituals,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching rituals:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get ritual by ID
  getRitualById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT r.*, 
               v.name as vendor_name,
               v.phone as vendor_phone,
               v.email as vendor_email,
               v.experience_years,
               v.specialization
        FROM rituals r
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.id = $1 AND r.is_active = true
      `;
      
      const rituals = await sequelize.query(query, { 
        bind: [id], 
        type: QueryTypes.SELECT 
      });
      
      if (rituals.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ritual not found'
        });
      }
      
      res.json({
        success: true,
        data: rituals[0]
      });
    } catch (error) {
      console.error('Error fetching ritual:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get rituals by category
  getRitualsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      
      const query = `
        SELECT r.*, 
               v.name as vendor_name,
               v.experience_years
        FROM rituals r
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.category = $1 AND r.is_active = true
        ORDER BY r.base_price ASC
      `;
      
      const rituals = await sequelize.query(query, { 
        bind: [category], 
        type: QueryTypes.SELECT 
      });
      
      res.json({
        success: true,
        data: rituals
      });
    } catch (error) {
      console.error('Error fetching rituals by category:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get ritual packages/pricing tiers
  getRitualPackages: async (req, res) => {
    try {
      const { ritual_id } = req.params;
      
      const query = `
        SELECT * FROM ritual_packages 
        WHERE ritual_id = $1 
        ORDER BY price_multiplier ASC
      `;
      
      const packages = await sequelize.query(query, { 
        bind: [ritual_id], 
        type: QueryTypes.SELECT 
      });
      
      res.json({
        success: true,
        data: packages
      });
    } catch (error) {
      console.error('Error fetching ritual packages:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Create ritual booking
  createRitualBooking: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        ritual_id,
        package_type,
        booking_date,
        booking_time,
        address,
        special_requests,
        contact_phone,
        num_people
      } = req.body;

      // Validate required fields
      if (!ritual_id || !package_type || !booking_date || !address) {
        return res.status(400).json({
          success: false,
          message: 'Ritual ID, package type, booking date, and address are required'
        });
      }

      // Get ritual details
      const ritualQuery = `
        SELECT r.*, v.name as vendor_name 
        FROM rituals r 
        LEFT JOIN vendors v ON r.vendor_id = v.id 
        WHERE r.id = $1 AND r.is_active = true
      `;
      
      const rituals = await sequelize.query(ritualQuery, { 
        bind: [ritual_id], 
        type: QueryTypes.SELECT 
      });

      if (rituals.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ritual not found or not available'
        });
      }

      const ritual = rituals[0];

      // Calculate price based on package type
      const packageMultipliers = {
        basic: 1,
        advance: 1.5,
        premium: 2.2
      };
      
      const multiplier = packageMultipliers[package_type] || 1;
      const totalAmount = ritual.base_price * multiplier;

      // Create booking
      const insertQuery = `
        INSERT INTO ritual_bookings (
          user_id, ritual_id, package_type, booking_date, booking_time,
          address, special_requests, contact_phone, num_people,
          amount, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending')
        RETURNING *
      `;

      const bookings = await sequelize.query(insertQuery, {
        bind: [
          userId, ritual_id, package_type, booking_date, booking_time,
          address, special_requests, contact_phone, num_people || 1,
          totalAmount
        ],
        type: QueryTypes.INSERT
      });

      // Get the created booking with details
      const bookingId = bookings[0][0].id;
      const detailsQuery = `
        SELECT rb.*, r.name as ritual_name, r.duration,
               u.name as user_name, u.email as user_email
        FROM ritual_bookings rb
        JOIN rituals r ON rb.ritual_id = r.id
        JOIN users u ON rb.user_id = u.id
        WHERE rb.id = $1
      `;
      
      const bookingDetails = await sequelize.query(detailsQuery, { 
        bind: [bookingId], 
        type: QueryTypes.SELECT 
      });

      res.status(201).json({
        success: true,
        message: 'Ritual booking created successfully',
        data: bookingDetails[0]
      });
    } catch (error) {
      console.error('Error creating ritual booking:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's ritual bookings
  getUserRitualBookings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT rb.*, r.name as ritual_name, r.category, r.duration,
               v.name as vendor_name
        FROM ritual_bookings rb
        JOIN rituals r ON rb.ritual_id = r.id
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE rb.user_id = $1
      `;

      const params = [userId];

      if (status) {
        query += ' AND rb.status = $' + (params.length + 1);
        params.push(status);
      }

      query += ' ORDER BY rb.booking_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const bookings = await sequelize.query(query, { 
        bind: params, 
        type: QueryTypes.SELECT 
      });

      res.json({
        success: true,
        data: bookings,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching ritual bookings:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export default ritualsController;
