const fs = require('fs');
const path = require('path');
const db = require('./db');

async function resetDB() {
  try {
    const sqlPath = path.join(__dirname, '../database.sql');
    const sqlString = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running database setup script...');
    await db.query(sqlString);
    console.log('Database successfully re-initialized with new schema, triggers, and procedures!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to run setup:', error);
    process.exit(1);
  }
}

resetDB();
