const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: ['Parent', 'Visitor'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  // Parent-specific fields
  studentName: {
    type: String,
    trim: true
  },
  studentClass: {
    type: String,
    trim: true
  },
  schoolIdCard: {
    type: String // Cloudinary URL
  },
  // Visitor-specific fields
  aadhaarNumber: {
    type: String,
    trim: true
  },
  aadhaarDocument: {
    type: String // Cloudinary URL
  },
  // Status & Admin
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  adminRemark: {
    type: String,
    trim: true
  },
  appointmentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Uppercase normalization
appointmentSchema.pre('save', function(next) {
  const stringFields = ['name', 'studentName', 'studentClass', 'purpose'];
  stringFields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      this[field] = this[field].toUpperCase();
    }
  });
  next();
});

appointmentSchema.index({ status: 1, category: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
