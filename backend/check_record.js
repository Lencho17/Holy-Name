const mongoose = require('mongoose');
require('dotenv').config();
const Admission = require('./models/Admission');
const connectDB = require('./config/db');

async function checkRecord() {
    await connectDB();
    const record = await Admission.findOne({ referenceNumber: 'HNS-2026-1EB9U9' });
    console.log(JSON.stringify(record, null, 2));
    process.exit(0);
}

checkRecord();
