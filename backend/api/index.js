// Vercel serverless function wrapper for Express app
// This file is the entry point for Vercel serverless functions
// All routes are handled by the Express app in server.js

const app = require('../server');

// Export the Express app as a serverless function
// Vercel will automatically handle the request/response
module.exports = app;










