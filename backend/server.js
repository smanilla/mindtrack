const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// CRITICAL: express.json() can interfere with multipart/form-data and form-encoded data
// Only parse JSON for non-upload routes and non-Twilio routes
app.use((req, res, next) => {
  // Skip JSON parsing for multipart/form-data (file uploads)
  if (req.path.includes('/upload') && req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('Skipping express.json() for multipart request');
    return next();
  }
  // Skip JSON parsing for Twilio callbacks (form-encoded)
  if (req.path.includes('/call-status') && req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    console.log('Skipping express.json() for Twilio callback');
    return next();
  }
  express.json()(req, res, next);
});

// Add form-encoded parser for Twilio callbacks
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  if (req.path.includes('/upload')) {
    console.log('=== GLOBAL REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization header:', req.headers.authorization ? `${req.headers.authorization.substring(0, 60)}...` : 'MISSING');
  }
  next();
});

// Database connection middleware (for Vercel serverless)
// This ensures DB is connected on each request in serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error:', err);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      MONGO_URI_set: !!process.env.MONGO_URI,
      MONGO_URI_length: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0
    });
    // Return more helpful error message in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Database connection failed. Check server logs.'
      : `Database connection failed: ${err.message}`;
    return res.status(500).json({ message: errorMessage });
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindTrack API Server',
    status: 'running',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/entries',
      '/api/journals',
      '/api/ai',
      '/api/doctor',
      '/api/ai-assessment',
      '/api/ai-chat',
      '/api/upload'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/entries', require('./routes/entryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/journals', require('./routes/journalRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/ai-assessment', require('./routes/aiAssessmentRoutes'));

// Upload routes
try {
  const uploadRoutes = require('./routes/uploadAudio');
  app.use('/api/upload', uploadRoutes);
  console.log('Upload routes loaded successfully');
} catch (error) {
  console.error('Upload routes failed to load:', error);
}

// AI Chat routes (only load if OpenAI is configured)
try {
  app.use('/api/ai-chat', require('./routes/aiChatRoutes'));
  console.log('AI Chat routes loaded successfully');
} catch (error) {
  console.log('AI Chat routes not loaded - OpenAI API key missing');
  console.log('To enable AI features, add OPENAI_API_KEY to your .env file');
}

// Error handler (basic)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Only start server if not in Vercel serverless environment
// Vercel serverless functions don't need app.listen()
if (process.env.VERCEL !== '1') {
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });
}

// Export for Vercel serverless
module.exports = app;


