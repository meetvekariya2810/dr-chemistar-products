const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

global.isMongoConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dr_chemist_agro';
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
    });
    console.log(`Successfully connected to MongoDB: ${conn.connection.host}`);
    global.isMongoConnected = true;
  } catch (err) {
    console.error(`MongoDB database connection failed: ${err.message}`);
    console.warn('Falling back to local JSON file-based database storage.');
    global.isMongoConnected = false;
  }
};

module.exports = connectDB;
