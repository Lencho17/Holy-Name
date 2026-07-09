const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8']);

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await Admin.findOne({ email: 'narayanphukan30@gmail.com' });
    if (admin) {
      admin.password = 'admin123';
      if (!admin.name) admin.name = 'Super Admin';
      await admin.save();
      console.log('✅ Password successfully reset to: admin123');
    } else {
      console.log('❌ Admin not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

resetPassword();
