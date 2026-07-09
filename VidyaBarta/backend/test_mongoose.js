require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const SiteContent = require('./models/SiteContent');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");
    
    // Simulate frontend payload
    const safeUpdateData = { stats: [] };
    
    let content = await SiteContent.findOneAndUpdate(
      {},
      { $set: safeUpdateData },
      { new: true, upsert: true }
    );
    console.log("Success");
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
