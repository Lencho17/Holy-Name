const mongoose = require('mongoose');
const SiteContent = require('./models/SiteContent');
const connectDB = require('./config/db');
require('dotenv').config();

async function clearVideos() {
  await connectDB();
  await SiteContent.updateOne({}, { $set: { videos: [] } });
  console.log('Videos cleared from DB');
  process.exit(0);
}

clearVideos();
