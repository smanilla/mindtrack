const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: String, enum: ['very_bad', 'bad', 'neutral', 'good', 'very_good'], required: true },
    text: { type: String, default: '' },
    sleepHours: { type: Number, default: 0 },
    date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) },
  },
  { timestamps: true }
);

entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);


