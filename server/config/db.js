const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

global.isMongoConnected = false;
global.mongoError = null;

const DEFAULT_MONGO_URI = 'mongodb://vekariyameet674_db_user:Meet%402810@ac-2mfxrpy-shard-00-00.bj0ygan.mongodb.net:27017,ac-2mfxrpy-shard-00-01.bj0ygan.mongodb.net:27017,ac-2mfxrpy-shard-00-02.bj0ygan.mongodb.net:27017/dr_chemist_agro?ssl=true&replicaSet=atlas-554h72-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster28';

let connPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    global.isMongoConnected = true;
    global.mongoError = null;
    return mongoose.connection;
  }

  const targetURI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

  if (!connPromise) {
    console.log('[db] Connecting to MongoDB Atlas...');
    connPromise = mongoose.connect(targetURI, {
      serverSelectionTimeoutMS: 5000
    }).then((conn) => {
      console.log(`[db] Successfully connected to MongoDB: ${conn.connection.host}`);
      global.isMongoConnected = true;
      global.mongoError = null;
      return conn;
    }).catch((err) => {
      console.error(`[db] MongoDB database connection failed: ${err.message}`);
      global.isMongoConnected = false;
      global.mongoError = err.message;
      connPromise = null;
      return null;
    });
  }

  try {
    const conn = await connPromise;
    if (mongoose.connection.readyState === 1) {
      global.isMongoConnected = true;
      global.mongoError = null;
    }
    return conn;
  } catch (err) {
    global.isMongoConnected = false;
    global.mongoError = err.message;
    return null;
  }
};

module.exports = connectDB;
