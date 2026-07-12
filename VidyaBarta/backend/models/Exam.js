const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  school_id: { type: String, required: true },
  name: { type: String, required: true }, // e.g., Mid-Term, Final
  type: { type: String, enum: ['online', 'offline'], default: 'offline' },
  class_level: { type: String, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'results_published'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
