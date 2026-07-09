const mongoose = require('mongoose');
require('dotenv').config();

const testLocal = async () => {
  try {
    console.log('Testing connection to local MongoDB (127.0.0.1:27017)...');
    await mongoose.connect('mongodb://127.0.0.1:27017/holyname_debug', {
      serverSelectionTimeoutMS: 2000
    });
    console.log('✅ Local MongoDB is REACHABLE and WORKING.');
    process.exit(0);
  } catch (e) {
    console.error(`❌ Local MongoDB failed: ${e.message}`);
    process.exit(1);
  }
};

testLocal();
