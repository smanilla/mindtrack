const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Entry = require('../models/Entry');
const Journal = require('../models/Journal');
const Assessment = require('../models/Assessment');
const { protect, authorize } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Helper route to fix patients without doctor assignment (for debugging/fixing)
router.post('/fix-patients', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Find all patients without a doctor assigned
    const unassignedPatients = await User.find({
      role: 'patient',
      $or: [
        { doctor: null },
        { doctor: { $exists: false } }
      ]
    });
    
    console.log(`Found ${unassignedPatients.length} unassigned patients`);
    
    // Assign them to the current doctor
    const result = await User.updateMany(
      {
        role: 'patient',
        $or: [
          { doctor: null },
          { doctor: { $exists: false } }
        ]
      },
      { doctor: doctorId }
    );
    
    console.log(`Assigned ${result.modifiedCount} patients to doctor ${doctorId}`);
    
    res.json({
      message: `Assigned ${result.modifiedCount} patients to you`,
      assigned: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix patients error:', error);
    res.status(500).json({ message: 'Failed to fix patients' });
  }
});

// Register a new patient (doctor only)
router.post('/register-patient', protect, authorize('doctor'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields: name, email, and password are required' });
    }
    
    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create patient assigned to this doctor
    const doctorId = req.user._id;
    
    const patient = await User.create({
      name,
      email,
      password,
      role: 'patient',
      doctor: doctorId // Assign to logged-in doctor
    });
    
    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: patient.role,
        doctor: patient.doctor
      }
    });
  } catch (error) {
    console.error('Register patient error:', error);
    res.status(500).json({ message: 'Failed to create patient account' });
  }
});

// Get all patients assigned to this doctor (only for doctors)
router.get('/patients', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Find patients assigned to this doctor
    const patients = await User.find({ 
      role: 'patient',
      doctor: doctorId
    })
      .select('name email createdAt doctor')
      .sort({ createdAt: -1 });
    
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
});

// Get patient details with entries and journals
router.get('/patients/:patientId', protect, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get patient info
    const patient = await User.findById(patientId).select('name email createdAt role doctor');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Verify patient is assigned to this doctor
    if (patient.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This patient is not assigned to you' });
    }
    
    // Get all entries
    const entries = await Entry.find({ user: patientId })
      .sort({ date: -1 })
      .limit(100);
    
    // Get all journals
    const journals = await Journal.find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(100);
    // Get assessments
    const assessments = await Assessment.find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('summary crisis createdAt');
    
    // Get weekly summary
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = entries.filter(e => new Date(e.date) >= weekAgo);
    
    const moodCounts = {};
    let totalSleep = 0;
    let sleepCount = 0;
    
    weekEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      if (entry.sleepHours > 0) {
        totalSleep += entry.sleepHours;
        sleepCount++;
      }
    });
    
    const summary = {
      count: weekEntries.length,
      moodCounts,
      avgSleep: sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : 0,
      totalEntries: entries.length,
      totalJournals: journals.length,
      totalAssessments: assessments.length
    };
    
    res.json({
      patient,
      entries,
      journals,
      assessments,
      summary
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({ message: 'Failed to fetch patient details' });
  }
});

// Get patient entries only
router.get('/patients/:patientId/entries', protect, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Verify patient is assigned to this doctor
    if (patient.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This patient is not assigned to you' });
    }
    
    const entries = await Entry.find({ user: patientId })
      .sort({ date: -1 })
      .limit(100);
    
    res.json(entries);
  } catch (error) {
    console.error('Get patient entries error:', error);
    res.status(500).json({ message: 'Failed to fetch patient entries' });
  }
});

// Get patient journals only
router.get('/patients/:patientId/journals', protect, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Verify patient is assigned to this doctor
    if (patient.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This patient is not assigned to you' });
    }
    
    const journals = await Journal.find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(journals);
  } catch (error) {
    console.error('Get patient journals error:', error);
    res.status(500).json({ message: 'Failed to fetch patient journals' });
  }
});

module.exports = router;

// Additional: list all assessments for a patient
router.get('/patients/:patientId/assessments', protect, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findById(patientId).select('doctor role');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (patient.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This patient is not assigned to you' });
    }
    const items = await Assessment.find({ user: patientId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get patient assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch patient assessments' });
  }
});

