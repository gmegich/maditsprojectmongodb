/**
 * Quick MongoDB connection check.
 * Usage: npm run db:check
 */
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const checkDb = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log(
      `URI host hint: ${(process.env.MONGO_URI || '')
        .replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
        .slice(0, 80)}...`
    );

    const conn = await connectDB();
    const collections = await conn.connection.db.listCollections().toArray();

    console.log('Connection OK');
    console.log(`Collections (${collections.length}):`);
    collections.forEach((c) => console.log(` - ${c.name}`));

    process.exit(0);
  } catch (error) {
    console.error('Connection FAILED');
    console.error(error.message);
    console.error('\nTips:');
    console.error('1. For Atlas: Network Access must allow your IP (or 0.0.0.0/0 for school demo)');
    console.error('2. Username/password in MONGO_URI must be correct (URL-encode special chars)');
    console.error('3. Database name at end of URI should be south_sudan_marketplace');
    process.exit(1);
  }
};

checkDb();
