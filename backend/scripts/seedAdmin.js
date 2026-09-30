/**
 * Creates a default admin account if one does not exist.
 * Usage: npm run seed:admin
 *
 * Credentials come from env (recommended) or safe defaults for local demo only.
 */
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || 'admin@ssmarketplace.local').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.ADMIN_NAME || 'System Administrator';
    const phone = process.env.ADMIN_PHONE || '0700000000';

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.accountStatus = 'active';
        await existing.save();
        console.log(`Updated existing user to admin: ${email}`);
      } else {
        console.log(`Admin already exists: ${email}`);
      }
      process.exit(0);
    }

    await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      accountStatus: 'active',
      city: 'Nairobi',
      county: 'Nairobi',
    });

    console.log('Admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Change ADMIN_PASSWORD in .env for production use.');
    process.exit(0);
  } catch (error) {
    console.error(`Admin seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
