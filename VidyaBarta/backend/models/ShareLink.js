const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'Holy Name School' },
  desc: { type: String, default: '' },
  image: { type: String, default: '' },
  page: { type: String, default: '/' },
}, { timestamps: true });

// Auto-expire after 90 days to keep collection clean
shareLinkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('ShareLink', shareLinkSchema);
