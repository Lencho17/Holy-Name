const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/Admin');

async function fixAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    // Update all superadmins and any admins that exist to be approved
    // If they were created before we added `isApproved` they should be updated
    const result = await Admin.updateMany(
      { isApproved: { $ne: true } }, 
      { $set: { isApproved: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} accounts to isApproved: true`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixAdmins();
