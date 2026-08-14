const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const { warnIfInsecure } = require('./config/adminAuthConfig');
const productRoutes = require('./routes/product.routes');
const dealerRoutes = require('./routes/dealer.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const farmerRoutes = require('./routes/farmer.routes');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();
warnIfInsecure();

const app = express();

// Security Middlewares
// NOTE: helmet's default `Cross-Origin-Resource-Policy: same-origin` makes the
// browser block every /uploads image when the frontend runs on a different
// origin than this API (e.g. Vite on :5173 vs API on :5001). Product images are
// public static assets, so they are explicitly served cross-origin.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
/*
 * CORS: wide open in development (the Vite proxy means the browser is
 * same-origin anyway), locked to an explicit list in production.
 *
 * ALLOWED_ORIGINS is a comma-separated list of site origins, e.g.
 *   ALLOWED_ORIGINS=https://drchemistar.vercel.app,https://www.drchemistar.com
 * Requests with no Origin header (curl, health checks, server-to-server) are
 * always allowed - CORS only governs browsers.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.warn(
    '[cors] ALLOWED_ORIGINS is not set - every origin can call this API. ' +
      'Set it to your deployed site origin(s).'
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin.replace(/\/+$/, ''))) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/farmers', farmerRoutes);

// Lets the frontend tell "the API is down" apart from "the API is up but the
// database is not", which are very different messages for the admin.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    database: global.isMongoConnected ? 'mongodb' : 'local-json-fallback'
  });
});

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint not found', message: `No API endpoint matches ${req.method} ${req.originalUrl}` });
});

// Central Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
