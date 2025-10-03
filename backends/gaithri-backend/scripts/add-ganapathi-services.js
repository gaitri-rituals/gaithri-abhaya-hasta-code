import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create database connection
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'temple_management',
  username: process.env.DB_USER || 'chethannavilaepremkumar',
  password: process.env.DB_PASSWORD || '',
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: console.log
});

async function addGanapathiServices() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read and execute SQL file
    const sqlPath = path.join(__dirname, '..', '..', 'init-db', '17-ganapathi-temple-services.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL script...');
    await sequelize.query(sqlContent);
    
    console.log('✅ Ganapathi Temple services added successfully!');
    
    // Verify the services were added
    const [results] = await sequelize.query(`
      SELECT id, name, category, service_type 
      FROM temple_services 
      WHERE temple_id = 25
    `);
    
    console.log('📋 Services added for Ganapathi Temple:');
    results.forEach(service => {
      console.log(`  - ${service.name} (${service.category}/${service.service_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addGanapathiServices();