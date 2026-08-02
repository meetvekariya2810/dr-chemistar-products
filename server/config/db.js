const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dr_chemist_agro';
    const conn = await mongoose.connect(mongoURI);
    console.log(`Successfully connected to MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB database connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
