const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const productRoutes = require('./routes/product.routes');
const dealerRoutes = require('./routes/dealer.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares
// NOTE: helmet's default `Cross-Origin-Resource-Policy: same-origin` makes the
// browser block every /uploads image when the frontend runs on a different
// origin than this API (e.g. Vite on :5173 vs API on :5001). Product images are
// public static assets, so they are explicitly served cross-origin.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', apiLimiter);

// Performance & Log Middlewares
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  maxAge: '7d',
  fallthrough: true
}));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Central Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
