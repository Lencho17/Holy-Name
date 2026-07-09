const mongoose = require('mongoose');
const SiteContent = require('./models/SiteContent');
require('dotenv').config({ path: './.env' });

async function cleanupAndRestore() {
  try {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    let content = await SiteContent.findOne();
    if (!content) {
      console.log('No content found to cleanup');
      process.exit(0);
    }
    
    console.log('Cleaning up bloated principal data...');
    if (content.principal) {
      // Replace base64 with placeholders to reduce payload size
      content.principal.photo = "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400";
      content.principal.signature = "https://via.placeholder.com/150x50";
    }
    
    // If gallery is empty, restore defaults to help the user see something
    if (content.gallery.length === 0) {
      console.log('Restoring default gallery data...');
      content.gallery = [
        { id: 1, category: "Academic Events", title: "Science Exhibition 2023", src: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&auto=format&fit=crop&q=60", featured: true, description: "Students demonstrating their innovative physics projects." },
      ];
    }

    if (content.events.length === 0) {
        console.log('Restoring default events data...');
        content.events = [
            { id: 1, title: "Teachers Day Celebration", date: "Sept 5, 2025", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", description: "A day dedicated to honoring our mentors with heartfelt performances." },
        ];
    }
    
    await content.save();
    console.log('✅ Cleanup and restoration complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupAndRestore();
