const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { testConnection } = require('./config/database.js');

// Import routes
const authRoutes = require('./routes/auth.js');
const templeRoutes = require('./routes/temples.js');
const pujaRoutes = require('./routes/pujas.js');
const bookingRoutes = require('./routes/bookings.js');
const paymentRoutes = require('./routes/payments.js');
const userRoutes = require('./routes/users.js');
const addressRoutes = require('./routes/address.js');
const classRoutes = require('./routes/classes.js');
const storeRoutes = require('./routes/store.js');
const subscriptionRoutes = require('./routes/subscriptions.js');
const adminRoutes = require('./routes/admin.js');
const dashboardRoutes = require('./routes/dashboard.js');
const { swaggerUi, specs } = require('./config/swagger.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for consumer app
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
// CORS configuration - allow multiple localhost dev ports
const baseAllowed = 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:8080';
const envOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowedOrigins = ((envOrigins ? envOrigins + ',' : '') + baseAllowed).split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
testConnection();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Abhaya Hasta Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Abhaya Hasta API Documentation'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/temples', templeRoutes);
app.use('/api/pujas', pujaRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Scheduled tasks
cron.schedule('0 0 * * *', () => {
  console.log('🕛 Running daily cleanup tasks...');
  // Add cleanup logic here
});

cron.schedule('*/5 * * * *', () => {
  console.log('🔄 Running booking status updates...');
  // Add booking status update logic here
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Abhaya Hasta Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
