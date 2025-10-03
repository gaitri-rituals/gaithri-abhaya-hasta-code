import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'temple_ecosystem_db',
  username: process.env.DB_USER || 'temple_admin',
  password: process.env.DB_PASSWORD || 'temple_password123',
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: console.log
});

async function updateTempleServicesSchema() {
  try {
    console.log('Updating temple_services table schema...');

    // Add new columns to temple_services table
    await sequelize.query(`
      ALTER TABLE temple_services 
      ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'Regular',
      ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50) DEFAULT 'fixed',
      ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS suggested_prices JSONB,
      ADD COLUMN IF NOT EXISTS pricing_options JSONB,
      ADD COLUMN IF NOT EXISTS requires_nakshatra BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS requires_gothra BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
    `);

    console.log('Schema updated successfully!');

    // Update existing services to have proper service types
    await sequelize.query(`
      UPDATE temple_services 
      SET service_type = 'Dakshina', 
          suggested_prices = '[11, 21, 51]'::jsonb
      WHERE name ILIKE '%dakshina%' OR name ILIKE '%donation%';
    `);

    await sequelize.query(`
      UPDATE temple_services 
      SET service_type = 'Archana', 
          requires_nakshatra = true, 
          requires_gothra = true
      WHERE name ILIKE '%archana%';
    `);

    await sequelize.query(`
      UPDATE temple_services 
      SET service_type = 'Abhisheka', 
          requires_nakshatra = true, 
          requires_gothra = true
      WHERE name ILIKE '%abhisheka%';
    `);

    console.log('Existing services updated with new structure!');

    // Verify the changes
    const result = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'temple_services'
      ORDER BY ordinal_position;
    `);

    console.log('Updated table structure:', result[0]);

    await sequelize.close();
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
updateTempleServicesSchema();