const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: 'Anonymous User'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Suggestion', 'Complain', 'General Inquiry'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['Student', 'Parent', 'Other', ''],
    default: ''
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  className: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  trackingNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Composite index for common filtering in admin panel
inquirySchema.index({ isRead: 1, type: 1 });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
