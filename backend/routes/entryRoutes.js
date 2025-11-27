const express = require('express');
const Entry = require('../models/Entry');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get current user's entries (last 30)
router.get('/', protect, async (req, res) => {
  const entries = await Entry.find({ user: req.user._id }).sort({ date: -1 }).limit(30);
  res.json(entries);
});

// Create or update today's entry (upsert by date)
router.post('/', protect, async (req, res) => {
  const { mood, text, sleepHours, date } = req.body;
  const theDate = date ? new Date(date) : new Date();
  theDate.setHours(0, 0, 0, 0);
  const entry = await Entry.findOneAndUpdate(
    { user: req.user._id, date: theDate.getTime() },
    { user: req.user._id, mood, text: text || '', sleepHours: sleepHours || 0, date: theDate.getTime() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(entry);
});

module.exports = router;


