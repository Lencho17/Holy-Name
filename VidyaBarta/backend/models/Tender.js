const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tender title is required'],
    trim: true
  },
  tenderNumber: {
    type: String,
    required: [true, 'Tender number is required'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Construction', 'Supply', 'Services', 'Maintenance', 'IT', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  estimatedValue: {
    type: String,
    trim: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date,
    required: [true, 'Closing date is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Awarded', 'Cancelled'],
    default: 'Active'
  },
  documentUrl: {
    type: String // URL to the official tender document PDF
  }
}, { timestamps: true });

module.exports = mongoose.model('Tender', tenderSchema);
