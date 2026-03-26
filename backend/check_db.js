const mongoose = require('mongoose');
const SiteContent = require('./models/SiteContent');
const dns = require('dns');
require('dotenv').config();

async function check() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const content = await SiteContent.findOne().lean();
    if (!content) {
      console.log('No content found');
      process.exit(0);
    }
    console.log('Content keys:', Object.keys(content));
    
    console.log('Principal fields:');
    if (content.principal) {
      Object.keys(content.principal).forEach(k => {
        const s = JSON.stringify(content.principal[k]).length;
        console.log(`  - ${k}: ${s} bytes`);
        if (s > 1000) {
          console.log(`    (First 50 chars): ${JSON.stringify(content.principal[k]).substring(0, 50)}...`);
        }
      });
    }

    console.log('Gallery count:', content.gallery?.length || 0);
    console.log('Events count:', content.events?.length || 0);
    
    // Check for any potential circular refs or huge data
    const json = JSON.stringify(content);
    console.log('JSON Length:', json.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
