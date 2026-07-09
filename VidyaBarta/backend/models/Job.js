const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Temporary'],
    default: 'Full-Time'
  },
  experience: {
    type: String,
    required: [true, 'Minimum experience is required']
  },
  qualifications: {
    type: [String],
    required: [true, 'At least one qualification is required']
  },
  deadline: {
    type: String,
    default: 'Open until filled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', jobSchema);
