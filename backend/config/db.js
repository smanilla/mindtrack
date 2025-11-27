const mongoose = require('mongoose');

// Cache the connection to reuse in serverless environments
let cachedConnection = null;

async function connectDB() {
  // If already connected, return the existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', resolve);
    });
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
  }

  let uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  
  // If URI ends with a slash and no db name, append a default database
  if (/^mongodb(.+):\/\//.test(uri) && /\/$/.test(uri)) {
    uri = uri + 'mindtrack';
  }
  
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    cachedConnection = mongoose.connection;
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;


