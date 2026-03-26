const mongoose = require('mongoose');
const Admission = require('./backend/models/Admission');
require('dotenv').config({ path: './backend/.env' });

async function getAdmissions() {
  await mongoose.connect(process.env.MONGO_URI);
  const admissions = await Admission.find().sort({ createdAt: -1 }).limit(1);
  console.log(admissions[0]);
  process.exit(0);
}

getAdmissions();
