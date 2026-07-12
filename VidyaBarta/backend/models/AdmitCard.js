const mongoose = require('mongoose');

const admitCardSchema = new mongoose.Schema({
  school_id: { type: String, required: true },
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student_id: { type: String, required: true },
  release_date: { type: Date },
  status: { type: String, enum: ['pending', 'released', 'blocked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdmitCard', admitCardSchema);
