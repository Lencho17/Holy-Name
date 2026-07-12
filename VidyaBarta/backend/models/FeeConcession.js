const mongoose = require('mongoose');

const feeConcessionSchema = new mongoose.Schema({
  school_id: { type: String, required: true },
  student_id: { type: String, required: true }, // References Admission/GR Number
  type: { type: String, enum: ['concession', 'extension'], required: true }, // Concession = discount, Extension = more time
  document_url: { type: String }, // Written order from principal uploaded as soft copy
  discount_amount: { type: Number, default: 0 }, // For concessions
  extension_date: { type: Date }, // For extensions
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: String }, // Admin ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeeConcession', feeConcessionSchema);
