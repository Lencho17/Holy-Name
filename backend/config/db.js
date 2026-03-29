const mongoose = require('mongoose');
const dns = require('dns');

/**
 * Global connection cache to persist across serverless invocations.
 */
let cachedConnection = null;

const connectDB = async () => {
  // Fix for querySrv ECONNREFUSED on Windows: Force use of Google DNS
  // ONLY for common development environments; Vercel handles this better natively.
  if (process.env.NODE_ENV !== 'production' && process.platform === 'win32') {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch (e) {
      console.warn('DNS setServers failed, continuing with default resolver...');
    }
  }

  // If already connected or connecting, return the cached connection
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined');
    }

    console.log(`Connecting to MongoDB (cached: ${!!cachedConnection})...`);

    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // slightly more tolerant for cold starts
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });

    console.log('✅ MongoDB Connected Successfully');
    return cachedConnection;
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    
    // Detailed help for specific errors
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.log('\n--- DNS SRV RESOLUTION FAILED ---');
      console.log('Node.js is unable to resolve the _mongodb._tcp SRV record.');
      console.log('Common fixes:');
      console.log('1. Use a more stable DNS like 8.8.8.8');
      console.log('2. Switch to the standard mongodb:// connection string');
      console.log('3. Ensure your IP is whitelisted in MongoDB Atlas');
    }
    
    // In serverless, we don't want to exit the whole process if possible,
    // but the app can't function without DB.
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
