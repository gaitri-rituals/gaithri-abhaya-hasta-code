const { executeQuery } = require('../utils/dbHelpers.js');
const { sendTempleAdminCredentials } = require('../utils/emailService.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// @desc    Create a new temple
// @route   POST /api/temples
// @access  Private (Admin)
const createTemple = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      contact,
      timings,
      images,
      amenities,
      isActive,
      adminId
    } = req.body;

    // Validate required fields
    if (!name || !description || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and address are required'
      });
    }

    // Extract address components
    const street = address.street || '';
    const city = address.city || '';
    const state = address.state || '';
    const country = address.country || 'India';
    const latitude = address.coordinates?.latitude || null;
    const longitude = address.coordinates?.longitude || null;

    // Extract contact information
    const phone = contact?.phone || '';
    const email = contact?.email || null;
    const website = contact?.website || null;

    // Set active status
    const active = isActive !== undefined ? isActive : true;

    // Insert temple into database
    const query = `
      INSERT INTO temples (
        name, description, address, city, state, country, 
        phone, email, website, latitude, longitude, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const values = [
      name,
      description,
      street,
      city,
      state,
      country,
      phone,
      email,
      website,
      latitude,
      longitude,
      active
    ];

    const result = await executeQuery(query, { bindings: values });

    if (!result || result.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create temple'
      });
    }

    const newTemple = result[0];

    // Generate temporary password for temple admin
    const tempPassword = crypto.randomBytes(8).toString('hex');
    console.log(`Generated password for ${email}: ${tempPassword}`);
    
    // Create temple user account for authentication
    if (email) {
      try {
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const templeUserQuery = `
          INSERT INTO temple_users (
            temple_id, name, email, password_hash, role, is_primary_contact, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) RETURNING id
        `;
        
        const templeUserValues = [
          newTemple.id,
          `${newTemple.name} Admin`,
          email,
          hashedPassword,
          'temple_admin',
          true,
          true
        ];
        
        await executeQuery(templeUserQuery, { bindings: templeUserValues });
        console.log(`Temple user created for ${email} with temple ID: ${newTemple.id}`);
      } catch (userError) {
        console.error('Error creating temple user:', userError);
        // Don't fail temple creation if user creation fails
      }
    }
    
    // Send email with login credentials if email is provided
    if (email) {
      try {
        console.log(`TEMPLE LOGIN CREDENTIALS - Email: ${email}, Password: ${tempPassword}, Temple: ${newTemple.name}`);
        const emailResult = await sendTempleAdminCredentials(
          newTemple.name,
          email,
          tempPassword
        );
        
        if (emailResult.success) {
          console.log(`Login credentials email sent successfully to ${email} for temple: ${newTemple.name}`);
        } else {
          console.error(`Failed to send email to ${email}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending temple admin credentials email:', emailError);
        // Don't fail temple creation if email fails
      }
    }

    // TODO: Handle timings, images, and amenities if needed
    // These might require separate tables and additional logic

    res.status(201).json({
      success: true,
      message: 'Temple created successfully',
      data: {
        id: newTemple.id,
        name: newTemple.name,
        description: newTemple.description,
        address: {
          street: newTemple.address,
          city: newTemple.city,
          state: newTemple.state,
          country: newTemple.country,
          coordinates: {
            latitude: newTemple.latitude,
            longitude: newTemple.longitude
          }
        },
        contact: {
          phone: newTemple.phone,
          email: newTemple.email,
          website: newTemple.website
        },
        isActive: newTemple.is_active,
        createdAt: newTemple.created_at,
        updatedAt: newTemple.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating temple:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createTemple
};