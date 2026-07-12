const mongoose = require('mongoose');

const examMarksSchema = new mongoose.Schema({
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  school_id: { type: String, required: true },
  student_id: { type: String, required: true }, // refers to Admission/Student ID or GR number
  subject: { type: String, required: true },
  marks_obtained: { type: Number, required: true },
  total_marks: { type: Number, required: true },
  withheld: { type: Boolean, default: false }, // Option for admin to withhold results
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamMarks', examMarksSchema);
