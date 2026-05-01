const mongoose = require('mongoose');

const tenderApplicationSchema = new mongoose.Schema({
  tenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tender',
    required: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required']
  },
  proposedTimeline: {
    type: String,
    required: [true, 'Proposed timeline is required']
  },
  // Document URLs
  technicalProposalUrl: {
    type: String,
    required: [true, 'Technical proposal is required']
  },
  financialProposalUrl: {
    type: String,
    required: [true, 'Financial proposal is required']
  },
  companyProfileUrl: {
    type: String
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Shortlisted', 'Rejected', 'Awarded'],
    default: 'Pending'
  }
}, { timestamps: true });

// Uppercase Normalization
tenderApplicationSchema.pre('save', function(next) {
  const fields = ['companyName', 'contactPerson', 'address'];
  fields.forEach(field => {
    if (this[field] && typeof this[field] === 'string') {
      this[field] = this[field].toUpperCase();
    }
  });
  next();
});

module.exports = mongoose.model('TenderApplication', tenderApplicationSchema);
