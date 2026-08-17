const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

global.isMongoConnected = false;

let connPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    global.isMongoConnected = true;
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI && process.env.NODE_ENV === 'production') {
    console.warn('[db] MONGO_URI is not set in production.');
    global.isMongoConnected = false;
    return null;
  }

  const targetURI = mongoURI || 'mongodb://127.0.0.1:27017/dr_chemist_agro';

  if (!connPromise) {
    console.log('[db] Connecting to MongoDB...');
    connPromise = mongoose.connect(targetURI, {
      serverSelectionTimeoutMS: 5000
    }).then((conn) => {
      console.log(`[db] Successfully connected to MongoDB: ${conn.connection.host}`);
      global.isMongoConnected = true;
      return conn;
    }).catch((err) => {
      console.error(`[db] MongoDB database connection failed: ${err.message}`);
      global.isMongoConnected = false;
      connPromise = null;
      return null;
    });
  }

  try {
    const conn = await connPromise;
    if (mongoose.connection.readyState === 1) {
      global.isMongoConnected = true;
    }
    return conn;
  } catch (err) {
    global.isMongoConnected = false;
    return null;
  }
};

module.exports = connectDB;
