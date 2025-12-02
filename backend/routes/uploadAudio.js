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
// CRITICAL: Auth must run BEFORE multer to ensure headers are read correctly

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      console.error('Unexpected field name:', JSON.stringify(err.field));
      return res.status(400).json({ 
        message: 'Unexpected field name. The form field must be exactly "audio" (no spaces, no quotes).',
        received: err.field,
        hint: 'In Postman: Body → form-data → Key must be exactly "audio" (type: File)'
      });
    }
    return res.status(400).json({ message: 'File upload error', error: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.post('/audio', 
  // Step 1: Log request BEFORE any processing
  (req, res, next) => {
    console.log('=== UPLOAD ROUTE HIT ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization header present:', !!req.headers.authorization);
    if (req.headers.authorization) {
      console.log('Authorization value (first 60 chars):', req.headers.authorization.substring(0, 60));
    }
    next();
  },
  // Step 2: Run auth BEFORE multer (this is critical!)
  protect, 
  authorize('doctor'),
  // Step 3: Now run multer (after auth is verified)
  upload.single('audio'),
  // Step 4: Handle multer errors
  handleMulterError,
  async (req, res) => {
  console.log('Upload endpoint hit - User authenticated');
  console.log('User:', req.user?.email, 'Role:', req.user?.role);
  console.log('File received:', !!req.file, 'File size:', req.file?.size);
  
  try {
    if (!req.file) {
      console.log('No file in request');
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

// Test endpoint to verify auth works (without file upload)
router.get('/test-auth', protect, authorize('doctor'), (req, res) => {
  res.json({ 
    message: 'Auth works!', 
    user: req.user.email, 
    role: req.user.role 
  });
});

module.exports = router;

