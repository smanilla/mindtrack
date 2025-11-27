const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const { protect } = require('../middleware/authMiddleware');

// Create a new journal entry
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    
    const journal = new Journal({
      user: req.user.id,
      title,
      content,
      mood: mood || 'neutral',
      tags: tags || []
    });
    
    await journal.save();
    res.status(201).json(journal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all journal entries for the user
router.get('/', protect, async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get journal entries by date
router.get('/date/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const journals = await Journal.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 });
    
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific journal entry
router.get('/:id', protect, async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a journal entry
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content, mood, tags },
      { new: true }
    );
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json(journal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a journal entry
router.delete('/:id', protect, async (req, res) => {
  try {
    const journal = await Journal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
