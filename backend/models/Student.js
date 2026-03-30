const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, required: true },
  grade: { type: String, required: true },
  guardianName: String,
  contactNumber: String,
  email: String,
  address: String,
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  rollNumber: String,
  section: String,
  penNumber: String,
  aadharNumber: String,
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
