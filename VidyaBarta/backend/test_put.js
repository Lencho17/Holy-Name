const mongoose = require('mongoose');
const SiteContent = require('./models/SiteContent');
require('dotenv').config();

async function testPut() {
  try {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    let content = await SiteContent.findOne();
    if (!content) {
      console.log('Creating new content');
      content = new SiteContent({});
    }
    
    // Try to update something small
    content.gallery = [{
      id: 123,
      category: 'Test',
      title: 'Test Image',
      src: 'https://example.com/test.jpg',
      featured: false,
      description: 'Test',
      eventId: null
    }];
    
    await content.save();
    console.log('✅ Successfully saved gallery item');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saving:', error);
    process.exit(1);
  }
}

testPut();
