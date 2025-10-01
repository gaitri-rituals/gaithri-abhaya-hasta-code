const { jest } = require('@jest/globals');
const { Pool } = require('pg');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1h';
process.env.RAZORPAY_KEY_ID = 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';

// Create a pool instance for tests
const pool = new Pool({
  host: 'localhost',
  port: 5433, // Using test database port
  database: 'abhaya_hasta_test',
  user: 'postgres',
  password: 'postgres'
});

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  // Test database setup
  try {
    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        verification_token VARCHAR(6),
        role VARCHAR(20) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        refresh_token TEXT,
        refresh_token_expire TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Test tables created successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Cleanup test database
  try {
    await pool.query(`
      DROP TABLE IF EXISTS user_preferences;
      DROP TABLE IF EXISTS users;
    `);
    await pool.end();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clear all tables before each test
beforeEach(async () => {
  try {
    // Drop tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS user_preferences CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Recreate tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Error resetting tables:', error);
  }
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Comment out these lines to see console output during tests
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};