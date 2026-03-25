const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/Admin');

async function checkAdmins() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Admin.find({}, 'name email role');
    console.log('--- Current Admins ---');
    console.log(JSON.stringify(admins, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAdmins();
