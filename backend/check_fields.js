const mongoose = require('mongoose');
require('dotenv').config();
const SiteContent = require('./models/SiteContent');
const connectDB = require('./config/db');

async function checkFields() {
    await connectDB();
    const content = await SiteContent.findOne();
    console.log(JSON.stringify(content.admissionFields, null, 2));
    process.exit(0);
}

checkFields();
