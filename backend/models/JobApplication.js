const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true },
  aadhar: { type: String, required: true },
  pan: { type: String, required: true },
  gender: { type: String, required: true },
  qualification: { type: String, required: true },
  
  // Experience Details
  isExperienced: { type: Boolean, default: false },
  schoolName: String,
  totalExperience: { 
    type: String, 
    enum: ['Fresher', '0-3', '4-5', '6-10', '10-15', '16-20'],
    default: 'Fresher'
  },
  udiseCode: String, // Teacher National Code from UDISE (alpha numeric)
  
  // Contact & Personal
  email: { type: String, required: true },
  phone: { type: String, required: true },
  caste: { type: String, required: true },
  religion: { type: String, required: true },
  postOffice: String,
  policeStation: String,
  pincode: String,
  address: { type: String, required: true },
  
  // Documents (Cloudinary URLs)
  marksheet10: { type: String, required: true },
  cert10: { type: String, required: true },
  marksheet12: { type: String, required: true },
  cert12: { type: String, required: true },
  marksheetUG: { type: String, required: true },
  certUG: { type: String, required: true },
  
  // Optional Academic Docs
  marksheetPG: String,
  certPG: String,
  marksheetBEd: String,
  certBEd: String,
  marksheetDLed: String,
  certDLed: String,
  
  // Other Docs
  expCertificate: String,
  resume: { type: String, required: true },
  photo: { type: String, required: true },
  signature: { type: String, required: true },
  casteCertificate: String, // Compulsory if not General
  
  // Application Meta
  appliedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  referenceNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['pending', 'shortlisted', 'rejected', 'reviewed'], 
    default: 'pending' 
  },
}, { timestamps: true });

// Uppercase Normalization: Convert all relevant fields to uppercase before saving
jobApplicationSchema.pre('save', function(next) {
  const stringFields = [
    'fullName', 'gender', 'qualification', 'schoolName', 'udiseCode',
    'caste', 'religion', 'postOffice', 'policeStation', 'pincode', 'address'
  ];

  stringFields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      this[field] = this[field].toUpperCase();
    }
  });

  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
