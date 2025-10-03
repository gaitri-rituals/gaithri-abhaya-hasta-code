import sequelize from '../config/database.js';

async function createTestServices() {
  try {
    console.log('Creating test temple services...');

    // First, let's check if temple_services table exists and its structure
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'temple_services' 
      ORDER BY ordinal_position;
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Temple services table structure:', tableInfo);

    // If table doesn't exist, create it
    if (tableInfo.length === 0) {
      console.log('Creating temple_services table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS temple_services (
          id SERIAL PRIMARY KEY,
          temple_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          duration INTEGER DEFAULT 30,
          is_active BOOLEAN DEFAULT true,
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_temple_services_temple FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE
        );
      `);

      // Create trigger for updated_at
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION update_temple_services_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await sequelize.query(`
        CREATE TRIGGER update_temple_services_updated_at
        BEFORE UPDATE ON temple_services
        FOR EACH ROW
        EXECUTE FUNCTION update_temple_services_updated_at();
      `);

      console.log('Temple services table created successfully!');
    }

    // Insert test services for temple ID 1
    const testServices = [
      {
        temple_id: 1,
        name: 'Abhishekam',
        description: 'Sacred ritual of pouring holy water over the deity',
        price: 500.00,
        duration: 45,
        category: 'Ritual'
      },
      {
        temple_id: 1,
        name: 'Archana',
        description: 'Chanting of names and offering flowers to the deity',
        price: 100.00,
        duration: 15,
        category: 'Prayer'
      },
      {
        temple_id: 1,
        name: 'Aarti',
        description: 'Evening prayer with lamps and incense',
        price: 50.00,
        duration: 20,
        category: 'Prayer'
      },
      {
        temple_id: 1,
        name: 'Prasadam',
        description: 'Blessed food offering from the deity',
        price: 25.00,
        duration: 5,
        category: 'Offering'
      }
    ];

    // Check if services already exist
    const existingServices = await sequelize.query(`
      SELECT COUNT(*) as count FROM temple_services WHERE temple_id = 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (existingServices[0].count == 0) {
      console.log('Inserting test services...');
      
      for (const service of testServices) {
        // Insert based on actual table structure (without is_active column)
        await sequelize.query(`
          INSERT INTO temple_services (temple_id, name, description, price, duration, category)
          VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            service.temple_id,
            service.name,
            service.description,
            service.price,
            service.duration,
            service.category
          ],
          type: sequelize.QueryTypes.INSERT
        });
      }
      
      console.log('Test services inserted successfully!');
    } else {
      console.log('Test services already exist, skipping insertion.');
    }

    // Verify the services were created
    const services = await sequelize.query(`
      SELECT * FROM temple_services WHERE temple_id = 1 ORDER BY id
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Current services for temple 1:', services);

  } catch (error) {
    console.error('Error creating test services:', error);
  } finally {
    await sequelize.close();
  }
}

createTestServices();