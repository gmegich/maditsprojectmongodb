const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config();

// Register all Mongoose models (Phase 2)
require('./models');

const app = express();

// Security & parsing middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin === allowed || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getDbStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    models: Object.keys(mongoose.models),
  };
};

app.get('/api/health', (req, res) => {
  const db = getDbStatus();

  res.status(200).json({
    success: true,
    message: 'South Sudan Marketplace API is running',
    data: {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      phase: 9,
      database: db,
    },
  });
});

// Data routes require MongoDB
const requireDB = require('./middleware/requireDB');

// Auth & user routes (Phase 3)
app.use('/api/auth', requireDB, require('./routes/authRoutes'));
app.use('/api/users', requireDB, require('./routes/userRoutes'));

// Catalogue routes (Phase 4)
app.use('/api/categories', requireDB, require('./routes/categoryRoutes'));
app.use('/api/products', requireDB, require('./routes/productRoutes'));
app.use('/api/sellers', requireDB, require('./routes/sellerRoutes'));

// Cart routes (Phase 6)
app.use('/api/cart', requireDB, require('./routes/cartRoutes'));

// Order routes (Phase 7)
app.use('/api/orders', requireDB, require('./routes/orderRoutes'));

// Payment routes (Phase 8)
app.use('/api/payments', requireDB, require('./routes/paymentRoutes'));

// Notifications (Phase 9 — order tracking alerts)
app.use('/api/notifications', requireDB, require('./routes/notificationRoutes'));

// Static product images (local upload fallback when Cloudinary is unset)
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Placeholder for future route modules (Phases 10+)
// app.use('/api/reviews', require('./routes/reviewRoutes'));
// app.use('/api/messages', require('./routes/messageRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.MONGO_URI) {
    try {
      await connectDB();
      console.log(`Registered models: ${Object.keys(mongoose.models).join(', ')}`);
    } catch (error) {
      console.warn(
        `MongoDB unavailable (${error.message}). API started without DB — start MongoDB for Phase 2+.`
      );
    }
  } else {
    console.warn('MONGO_URI not set. API will start without database connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

module.exports = app;
