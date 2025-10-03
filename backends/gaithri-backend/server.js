import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import templeRoutes from './routes/temples.js';
import ritualRoutes from './routes/rituals.js';
import eventRoutes from './routes/events.js';
import vendorRoutes from './routes/vendors.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import storeRoutes from './routes/store.js';
import classRoutes from './routes/classes.js';
import bookingRoutes from './routes/bookings.js';
import referenceRoutes from './routes/reference.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
// Configure helmet to allow localhost in development
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests for dev, 100 for production
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - allow multiple localhost dev ports
const baseAllowed = 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8080,http://localhost:8081';
const envOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowedOrigins = ((envOrigins ? envOrigins + ',' : '') + baseAllowed).split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /http:\/\/localhost:\d+/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
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
    message: 'Gaithri Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/temples', templeRoutes);
app.use('/api/rituals', ritualRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reference', referenceRoutes);

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
  console.log(`🚀 Gaithri Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
