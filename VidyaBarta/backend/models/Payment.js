const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  transactionId: { type: String }, // SBI ePay reference number, populated on success
  orderId: { type: String, required: true, unique: true }, // Our generated order ID for the transaction
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['initiated', 'success', 'failed', 'pending'], 
    default: 'initiated' 
  },
  paymentMethod: { type: String, default: 'SBI_EPAY' },
  sbiResponse: { type: mongoose.Schema.Types.Mixed }, // Raw response for audit/debugging
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
