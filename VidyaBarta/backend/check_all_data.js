const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const Admission = require('./models/Admission');
const JobApplication = require('./models/JobApplication');
const Student = require('./models/Student');
const Inquiry = require('./models/Inquiry');
const SiteContent = require('./models/SiteContent');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- DATABASE DATA SUMMARY ---');
    
    const admissionCount = await Admission.countDocuments();
    const jobAppCount = await JobApplication.countDocuments();
    const studentCount = await Student.countDocuments();
    const inquiryCount = await Inquiry.countDocuments();
    const contentCount = await SiteContent.countDocuments();
    
    console.log(`- Admissions: ${admissionCount}`);
    console.log(`- Job Applications: ${jobAppCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Inquiries: ${inquiryCount}`);
    console.log(`- SiteContent: ${contentCount}`);
    
    if (admissionCount > 0) {
        const lastAdmission = await Admission.findOne().sort({ createdAt: -1 });
        console.log(`- Last Admission: ${lastAdmission.studentName} (${lastAdmission.createdAt})`);
    }

    if (jobAppCount > 0) {
        const lastJobApp = await JobApplication.findOne().sort({ createdAt: -1 });
        console.log(`- Last Job Application: ${lastJobApp.fullName} (${lastJobApp.createdAt})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
}

checkData();
