const mongoose = require('mongoose');
require('dotenv').config();
const SiteContent = require('./models/SiteContent');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function checkSiteContent() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const content = await SiteContent.findOne().lean();
    if (!content) {
      console.log('No site content found');
      process.exit(0);
    }
    
    console.log('--- SITE CONTENT SUMMARY ---');
    console.log(`School Name: ${content.schoolProfile?.name || 'N/A'}`);
    console.log(`Hero Images: ${content.schoolProfile?.heroImages?.length || 0}`);
    console.log(`Events: ${content.events?.length || 0}`);
    console.log(`Gallery: ${content.gallery?.length || 0}`);
    console.log(`Faculty: ${Object.keys(content.faculty || {}).reduce((acc, cat) => acc + (content.faculty[cat]?.length || 0), 0)}`);
    
    console.log('--- ADMISSION SUMMARY ---');
    const Admission = require('./models/Admission');
    const admissions = await Admission.find().sort({ createdAt: -1 }).limit(5).lean();
    admissions.forEach(a => {
        console.log(`- ${a.studentName} - ${a.status} (${a.createdAt})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSiteContent();
