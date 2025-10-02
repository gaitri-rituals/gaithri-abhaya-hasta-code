const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Abhaya Hasta Temple Services API',
      version: '1.0.0',
      description: 'A comprehensive API for temple services including puja bookings, e-commerce, and user management',
      contact: {
        name: 'API Support',
        email: 'support@abhayahasta.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.abhayahasta.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role'
            },
            is_active: {
              type: 'boolean',
              description: 'User active status'
            },
            is_verified: {
              type: 'boolean',
              description: 'User verification status'
            }
          }
        },
        Temple: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Temple ID'
            },
            name: {
              type: 'string',
              description: 'Temple name'
            },
            description: {
              type: 'string',
              description: 'Temple description'
            },
            address: {
              type: 'string',
              description: 'Temple address'
            },
            city: {
              type: 'string',
              description: 'Temple city'
            },
            state: {
              type: 'string',
              description: 'Temple state'
            },
            pincode: {
              type: 'string',
              description: 'Temple pincode'
            },
            phone: {
              type: 'string',
              description: 'Temple contact phone'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Temple contact email'
            },
            is_active: {
              type: 'boolean',
              description: 'Temple active status'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Booking ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID who made the booking'
            },
            temple_id: {
              type: 'integer',
              description: 'Temple ID for the booking'
            },
            service_name: {
              type: 'string',
              description: 'Name of the booked service'
            },
            booking_date: {
              type: 'string',
              format: 'date',
              description: 'Date of the booking'
            },
            booking_time: {
              type: 'string',
              description: 'Time of the booking'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Booking amount'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'cancelled'],
              description: 'Booking status'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            },
            temple_id: {
              type: 'integer',
              description: 'Temple ID selling the product'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            category: {
              type: 'string',
              description: 'Product category'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price'
            },
            stock_quantity: {
              type: 'integer',
              description: 'Available stock quantity'
            },
            image_url: {
              type: 'string',
              description: 'Product image URL'
            },
            is_available: {
              type: 'boolean',
              description: 'Product availability status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };