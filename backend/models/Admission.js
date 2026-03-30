const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  placeOfBirth: String,
  gender: { type: String, required: true },
  bloodGroup: String,
  religion: String,
  previousSchool: String,
  gradeApplied: { type: String, required: true },
  fatherName: String,
  fatherOccupation: String,
  motherName: String,
  motherOccupation: String,
  guardianName: String,
  relationship: String,
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  po: String, // Post Office
  ps: String, // Police Station
  pincode: String,
  aadharNumber: String,
  aadharVidOrReceipt: String, // file path if aadharNumber is missing
  penNumber: String, // Permanent Education Number
  caste: String,
  stream: String, // for class 11-12
  elective: String, // for class 9-10
  mil: String, // Modern Indian Language for class 9-12
  selectedSubjects: [String], // for class 11-12 electives
  studentPhoto: String, // file path
  birthCertificate: String, // file path
  transferCertificate: String, // file path
  marksheet: String, // file path
  casteCertificate: String, // file path (compulsory if not General)
  nccInterest: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  referenceNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

// Uppercase Normalization: Convert all relevant fields to uppercase before saving
admissionSchema.pre('save', function(next) {
  const stringFields = [
    'studentName', 'placeOfBirth', 'bloodGroup', 'religion', 'previousSchool',
    'gradeApplied', 'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation',
    'guardianName', 'relationship', 'address', 'po', 'ps', 'pincode',
    'aadharNumber', 'penNumber', 'caste', 'stream', 'elective', 'mil'
  ];

  stringFields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      this[field] = this[field].toUpperCase();
    }
  });

  if (this.selectedSubjects && Array.isArray(this.selectedSubjects)) {
    this.selectedSubjects = this.selectedSubjects.map(s => s.toUpperCase());
  }

  next();
});

// Optimize admin filtering and ordering
admissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Admission', admissionSchema);
