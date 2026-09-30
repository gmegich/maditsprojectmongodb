const mongoose = require('mongoose');

/**
 * Connect to MongoDB (local or Atlas) using MONGO_URI.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  const conn = await mongoose.connect(uri, {
    // Atlas can be slower on first connect than local MongoDB
    serverSelectionTimeoutMS: 15000,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  console.log(`Database: ${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
