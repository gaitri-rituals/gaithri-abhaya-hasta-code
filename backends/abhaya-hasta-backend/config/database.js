const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: isTestEnvironment ? 5433 : parseInt(process.env.DB_PORT || '5432'),
  database: isTestEnvironment ? 'abhaya_hasta_test' : (process.env.DB_NAME || 'abhaya_hasta'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    // Only exit if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    return false;
  }
};

module.exports = { pool, testConnection };
