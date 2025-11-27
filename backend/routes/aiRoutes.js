const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Entry = require('../models/Entry');

const router = express.Router();

// Helper to compute weekly summary
async function weeklySummaryForUser(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);
  const entries = await Entry.find({ user: userId, date: { $gte: since.getTime() } }).sort({ date: 1 });
  const counts = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});
  return { count: entries.length, moodCounts: counts, entries };
}

// GET /api/ai/weekly-summary  (current user)
router.get('/weekly-summary', protect, async (req, res) => {
  const data = await weeklySummaryForUser(req.user._id);
  res.json(data);
});

// GET /api/ai/weekly-summary/:userId  (explicit user)
router.get('/weekly-summary/:userId', protect, async (req, res) => {
  const data = await weeklySummaryForUser(req.params.userId);
  res.json(data);
});

module.exports = router;


