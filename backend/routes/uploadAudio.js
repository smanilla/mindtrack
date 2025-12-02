const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const { put } = require('@vercel/blob');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'), false);
    }
  }
});

// Upload audio file to Vercel Blob Storage
router.post('/audio', protect, authorize('doctor'), upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided. Send multipart/form-data with field name "audio"' });
    }

    // Upload to Vercel Blob
    // Vercel auto-generates token with pattern: PROJECTNAME_READ_WRITE_TOKEN
    // Try multiple possible token names
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN 
      || process.env.mindtrack_READ_WRITE_TOKEN
      || process.env.MINDTRACK_READ_WRITE_TOKEN
      || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    
    console.log('Blob token available:', !!blobToken);
    
    const blob = await put(`red-alert-voice-${Date.now()}.mp3`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: blobToken, // Vercel provides this automatically, but we can specify if needed
    });

    res.json({
      message: 'Audio file uploaded successfully',
      url: blob.url,
      publicUrl: blob.url, // This is the URL to use in RED_ALERT_VOICE_AUDIO_URL
      instructions: 'Copy the "publicUrl" value and add it to Vercel environment variable RED_ALERT_VOICE_AUDIO_URL'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload audio file', error: error.message });
  }
});

module.exports = router;

