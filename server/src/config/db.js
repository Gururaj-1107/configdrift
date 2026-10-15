const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/configdrift';
    const conn = await mongoose.connect(connUri);
    console.log(`[ConfigDrift] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[ConfigDrift] MongoDB connection error: ${error.message}`);
    console.warn('[ConfigDrift] Please ensure MongoDB is running locally on port 27017, or set MONGODB_URI in .env');
    // In production we exit; in dev we allow the server to run so API endpoints like /api/health still respond
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
