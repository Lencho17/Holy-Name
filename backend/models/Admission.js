const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  placeOfBirth: String,
  gender: { type: String, required: true },
  bloodGroup: String,
  nationality: { type: String, required: true },
  religion: String,
  previousSchool: String,
  gradeApplied: { type: String, required: true },
  fatherName: String,
  fatherOccupation: String,
  motherName: String,
  motherOccupation: String,
  guardianName: { type: String, required: true },
  relationship: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  transferCertificate: String, // file path
  marksheet: String, // file path
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  referenceNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('Admission', admissionSchema);
