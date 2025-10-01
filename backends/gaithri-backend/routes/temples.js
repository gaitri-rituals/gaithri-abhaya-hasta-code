import express from 'express';
import { body, validationResult } from 'express-validator';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { protect, hasPermission, hasRole, belongsToTemple } from '../middleware/auth.js';
import QRCode from 'qrcode';

const router = express.Router();

// @route   GET /api/temples
// @desc    Get all temples
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin' || !req.user.temple_id;

    let whereClause = '';
    let bind = [];
    if (!isSuperAdmin && req.user.temple_id) {
      whereClause = 'WHERE id = $1';
      bind = [req.user.temple_id];
    }

    const templesRows = await sequelize.query(
      `SELECT id, name, description, street, city, state, zip_code, country,
              latitude, longitude, phone, email, website, donation_url, qr_code,
              is_active, facilities, created_at, updated_at
       FROM temples
       ${whereClause}
       ORDER BY created_at DESC`,
      { bind, type: QueryTypes.SELECT }
    );

    const temples = templesRows.map((t) => ({
      id: String(t.id),
      name: t.name,
      description: t.description,
      address: {
        street: t.street,
        city: t.city,
        state: t.state,
        country: t.country,
        postalCode: t.zip_code,
        coordinates: {
          latitude: Number(t.latitude),
          longitude: Number(t.longitude)
        }
      },
      contact: {
        phone: t.phone,
        email: t.email,
        website: t.website || ''
      },
      timings: {},
      images: [],
      amenities: Array.isArray(t.facilities) ? t.facilities : [],
      isActive: !!t.is_active,
      adminId: '',
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));

    res.json({ success: true, temples });
  } catch (error) {
    console.error('Get temples error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/temples/:id
// @desc    Get single temple
// @access  Private
router.get('/:id', protect, belongsToTemple, async (req, res) => {
  try {
    const templeId = req.params.id;
    const rows = await sequelize.query(
      `SELECT id, name, description, street, city, state, zip_code, country,
              latitude, longitude, phone, email, website, donation_url, qr_code,
              is_active, facilities, created_at, updated_at
       FROM temples
       WHERE id = $1`,
      { bind: [templeId], type: QueryTypes.SELECT }
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    const t = rows[0];
    const temple = {
      id: String(t.id),
      name: t.name,
      description: t.description,
      address: {
        street: t.street,
        city: t.city,
        state: t.state,
        country: t.country,
        postalCode: t.zip_code,
        coordinates: {
          latitude: Number(t.latitude),
          longitude: Number(t.longitude)
        }
      },
      contact: {
        phone: t.phone,
        email: t.email,
        website: t.website || ''
      },
      timings: {},
      images: [],
      amenities: Array.isArray(t.facilities) ? t.facilities : [],
      isActive: !!t.is_active,
      adminId: '',
      createdAt: t.created_at,
      updatedAt: t.updated_at
    };

    res.json({ success: true, temple });
  } catch (error) {
    console.error('Get temple error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/temples
// @desc    Create new temple
// @access  Private (Super Admin only)
router.post('/', protect, hasRole('super_admin'), [
  body('name').notEmpty().withMessage('Temple name is required'),
  body('description').notEmpty().withMessage('Temple description is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('address.coordinates.latitude').isNumeric().withMessage('Valid latitude is required'),
  body('address.coordinates.longitude').isNumeric().withMessage('Valid longitude is required'),
  body('contactInfo.phone').matches(/^[0-9]{10}$/).withMessage('Valid phone number is required'),
  body('contactInfo.email').isEmail().withMessage('Valid email is required'),
  body('deity.primary').notEmpty().withMessage('Primary deity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const templeData = {
      ...req.body,
      createdBy: req.user._id
    };

    const temple = await Temple.create(templeData);

    // Generate QR code
    const qrCodeData = `Temple: ${temple.name}\nID: ${temple.qrCode}\nDonation Link: ${temple.donationUrl}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    res.status(201).json({
      message: 'Temple created successfully',
      temple: {
        ...temple.toObject(),
        qrCodeUrl
      }
    });
  } catch (error) {
    console.error('Create temple error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/temples/:id
// @desc    Update temple
// @access  Private
router.put('/:id', protect, hasPermission('manage_temples'), belongsToTemple, [
  body('name').optional().notEmpty().withMessage('Temple name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('contactInfo.phone').optional().matches(/^[0-9]{10}$/).withMessage('Valid phone number is required'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const temple = await Temple.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!temple) {
      return res.status(404).json({
        message: 'Temple not found'
      });
    }

    res.json({
      message: 'Temple updated successfully',
      temple
    });
  } catch (error) {
    console.error('Update temple error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/temples/:id
// @desc    Delete temple
// @access  Private (Super Admin only)
router.delete('/:id', protect, hasRole('super_admin'), async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);

    if (!temple) {
      return res.status(404).json({
        message: 'Temple not found'
      });
    }

    await Temple.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Temple deleted successfully'
    });
  } catch (error) {
    console.error('Delete temple error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/temples/:id/qr-code
// @desc    Get temple QR code
// @access  Private
router.get('/:id/qr-code', protect, belongsToTemple, async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);

    if (!temple) {
      return res.status(404).json({
        message: 'Temple not found'
      });
    }

    const qrCodeData = `Temple: ${temple.name}\nID: ${temple.qrCode}\nDonation Link: ${temple.donationUrl}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    res.json({
      message: 'QR code generated successfully',
      qrCode: qrCodeUrl,
      data: qrCodeData
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
