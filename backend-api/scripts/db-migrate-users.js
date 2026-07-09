import dotenv from 'dotenv';
import { pool } from '../src/db/pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateUsers() {
  try {
    console.log('Migrating users table...');
    
    const migrationPath = path.join(__dirname, '../database/migrate-users.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migration);
    
    console.log('Users table migrated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error migrating users table:', error);
    process.exit(1);
  }
}

migrateUsers();
