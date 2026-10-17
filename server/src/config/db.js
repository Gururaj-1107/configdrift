const mongoose = require('mongoose');

/**
 * Mongoose connection options configured for resilience and fast-failure diagnostics.
 */
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  autoIndex: true
};

let listenersRegistered = false;

/**
 * Registers lifecycle event listeners for the MongoDB connection.
 */
const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(`[ConfigDrift] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[ConfigDrift] MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[ConfigDrift] MongoDB disconnected. Attempting reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[ConfigDrift] MongoDB reconnected successfully.');
  });
};

/**
 * Connect to MongoDB instance using MONGODB_URI environment variable or default local URI.
 */
const connectDB = async (customUri = null) => {
  const connUri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/configdrift';
  registerConnectionListeners();

  try {
    const conn = await mongoose.connect(connUri, MONGOOSE_OPTIONS);
    return conn;
  } catch (error) {
    console.error(`[ConfigDrift] MongoDB connection error: ${error.message}`);
    console.warn('[ConfigDrift] Please ensure MongoDB is running or configure MONGODB_URI in server/.env');
    console.warn('[ConfigDrift] Tip: For a zero-install free cloud database, use MongoDB Atlas (mongodb+srv://...)');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Disconnect from MongoDB instance (useful for clean script exits and automated tests).
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error(`[ConfigDrift] Error disconnecting MongoDB: ${error.message}`);
  }
};

/**
 * Inspect the current MongoDB connection status.
 */
const getDbStatus = () => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: readyStates[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null
  };
};

// Graceful process exit handler
if (process.env.NODE_ENV !== 'test') {
  const handleProcessTermination = async (signal) => {
    if (mongoose.connection.readyState === 1) {
      console.log(`[ConfigDrift] ${signal} received. Closing MongoDB connection...`);
      await disconnectDB();
    }
    process.exit(0);
  };

  process.on('SIGINT', () => handleProcessTermination('SIGINT'));
  process.on('SIGTERM', () => handleProcessTermination('SIGTERM'));
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getDbStatus = getDbStatus;
