import sequelize from '../config/database.js';

const createTempleBasketTable = async () => {
  try {
    console.log('Creating temple_basket table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS temple_basket (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          temple_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          booking_date DATE,
          booking_time TIME,
          special_requests TEXT,
          devotee_details JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sequelize.query(createTableQuery);
    console.log('✅ temple_basket table created successfully');

    // Create indexes
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_temple_basket_user_id ON temple_basket(user_id);
      CREATE INDEX IF NOT EXISTS idx_temple_basket_temple_id ON temple_basket(temple_id);
      CREATE INDEX IF NOT EXISTS idx_temple_basket_service_id ON temple_basket(service_id);
      CREATE INDEX IF NOT EXISTS idx_temple_basket_created_at ON temple_basket(created_at);
    `;

    await sequelize.query(createIndexesQuery);
    console.log('✅ Indexes created successfully');

    // Create trigger function and trigger
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_temple_basket_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_temple_basket_updated_at ON temple_basket;
      CREATE TRIGGER update_temple_basket_updated_at
          BEFORE UPDATE ON temple_basket
          FOR EACH ROW
          EXECUTE FUNCTION update_temple_basket_updated_at();
    `;

    await sequelize.query(createTriggerQuery);
    console.log('✅ Trigger created successfully');

    console.log('🎉 Temple basket table setup completed!');
    
  } catch (error) {
    console.error('❌ Error creating temple_basket table:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

createTempleBasketTable();