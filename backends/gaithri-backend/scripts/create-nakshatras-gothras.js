import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'temple_ecosystem_db',
  username: process.env.DB_USER || 'temple_admin',
  password: process.env.DB_PASSWORD || 'temple_password123',
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: console.log
});

async function createNakshatrasGothras() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Read and execute the SQL file
    const sqlFile = path.join(process.cwd(), '../init-db/12-nakshatras-gothras.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await sequelize.query(sql);
    console.log('✅ Nakshatras and Gothras tables created and populated successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createNakshatrasGothras();