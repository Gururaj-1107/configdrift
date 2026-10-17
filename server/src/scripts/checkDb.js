const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Snapshot = require('../models/Snapshot');
const ValidationRule = require('../models/ValidationRule');
const DriftReport = require('../models/DriftReport');

const maskUriPassword = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/:([^:@]+)@/, ':••••••••@');
};

async function checkDatabase() {
  const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/configdrift';
  const maskedUri = maskUriPassword(rawUri);

  console.log('====================================================');
  console.log('  ConfigDrift Database Diagnostics & Health Check');
  console.log('====================================================');
  console.log(`Target URI: ${maskedUri}\n`);

  const startTime = Date.now();

  try {
    const conn = await connectDB();

    if (!conn || mongoose.connection.readyState !== 1) {
      throw new Error('Connection could not be established.');
    }

    const latency = Date.now() - startTime;
    console.log(`[Diagnostic] ✓ Connected successfully in ${latency}ms`);
    console.log(`[Diagnostic] Host:      ${mongoose.connection.host}`);
    console.log(`[Diagnostic] Database:  ${mongoose.connection.name}`);
    console.log(`[Diagnostic] Port:      ${mongoose.connection.port || 'default'}`);

    // Query Collection Counts
    const [userCount, projectCount, snapshotCount, ruleCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Snapshot.countDocuments(),
      ValidationRule.countDocuments(),
      DriftReport.countDocuments()
    ]);

    console.log('\n----------------------------------------------------');
    console.log('  Collection Record Counts');
    console.log('----------------------------------------------------');
    console.log(`  Users:            ${userCount}`);
    console.log(`  Projects:         ${projectCount}`);
    console.log(`  Snapshots:        ${snapshotCount}`);
    console.log(`  Validation Rules: ${ruleCount}`);
    console.log(`  Drift Reports:    ${reportCount}`);
    console.log('----------------------------------------------------');

    if (userCount === 0 && projectCount === 0) {
      console.log('\n💡 Database is empty. You can run seed data anytime with:');
      console.log('   npm run seed\n');
    } else {
      console.log('\n✓ Database is operational and contains data.\n');
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Check Failed:');
    console.error(`   ${error.message}\n`);

    console.log('----------------------------------------------------');
    console.log('  Troubleshooting & Setup Guide');
    console.log('----------------------------------------------------');
    console.log('1. Option A: Use Free MongoDB Atlas (Cloud - Recommended)');
    console.log('   - Sign up at https://www.mongodb.com/cloud/atlas');
    console.log('   - Create a free M0 cluster and database user.');
    console.log('   - In Network Access, allow 0.0.0.0/0 (or your IP).');
    console.log('   - Copy the connection string and paste into server/.env:');
    console.log('     MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/configdrift?retryWrites=true&w=majority\n');

    console.log('2. Option B: Run Local MongoDB via Docker');
    console.log('   docker run -d --name configdrift-mongo -p 27017:27017 mongo:latest\n');

    console.log('3. Option C: Run Local MongoDB Community Server');
    console.log('   - Download from https://www.mongodb.com/try/download/community');
    console.log('   - Start the Windows MongoDB service in services.msc\n');

    await disconnectDB();
    process.exit(1);
  }
}

checkDatabase();
