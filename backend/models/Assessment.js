const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [String], required: true },
    summary: { type: String, required: true }, // Keep for backward compatibility
    descriptiveSummary: { type: String }, // Document-style summary of answers
    adviceSummary: { type: String }, // Advice and red alert summary
    crisis: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);





