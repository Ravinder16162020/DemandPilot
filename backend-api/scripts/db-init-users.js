import dotenv from 'dotenv';
import { pool } from '../src/db/pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initUsersSchema() {
  try {
    console.log('Initializing users schema...');
    
    const schemaPath = path.join(__dirname, '../database/users-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('Users schema initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing users schema:', error);
    process.exit(1);
  }
}

initUsersSchema();
