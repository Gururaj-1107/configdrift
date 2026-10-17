const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Snapshot = require('../models/Snapshot');
const ValidationRule = require('../models/ValidationRule');
const DriftReport = require('../models/DriftReport');
const { compareSnapshots } = require('../services/comparisonEngine');

async function seed() {
  console.log('====================================================');
  console.log('  ConfigDrift Database Seed & Demo Data Generator');
  console.log('====================================================\n');

  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('\n❌ Could not connect to MongoDB. Seeding aborted.');
      console.error('Please ensure MongoDB is running or configure MONGODB_URI in server/.env\n');
      process.exit(1);
    }

    console.log('[Seed] Connected to database:', mongoose.connection.name);

    // 1. Clean existing demo data
    const demoEmail = 'demo@configdrift.com';
    let user = await User.findOne({ email: demoEmail });
    if (user) {
      console.log(`[Seed] Cleaning prior records for existing demo user: ${demoEmail}`);
      const userProjects = await Project.find({ owner: user._id });
      const projectIds = userProjects.map((p) => p._id);

      await Promise.all([
        Snapshot.deleteMany({ project: { $in: projectIds } }),
        ValidationRule.deleteMany({ project: { $in: projectIds } }),
        DriftReport.deleteMany({ project: { $in: projectIds } }),
        Project.deleteMany({ owner: user._id }),
        User.deleteOne({ _id: user._id })
      ]);
    }

    // 2. Create Demo User (User model pre-save hook will hash this)
    user = await User.create({
      name: 'Demo Engineer',
      email: demoEmail,
      password: 'Password123!'
    });
    console.log(`[Seed] ✓ Created demo user: ${user.email} (Password: Password123!)`);

    // 3. Create Sample Project
    const project = await Project.create({
      name: 'FinTech Core Platform',
      description: 'High-throughput payment processing and ledger microservices with multi-environment parity verification',
      owner: user._id
    });
    console.log(`[Seed] ✓ Created sample project: "${project.name}" (ID: ${project._id})`);

    // 4. Create Snapshots for Dev, Test, and Prod
    const devVariables = [
      { key: 'PORT', value: '3000', dataType: 'number', isSecret: false },
      { key: 'NODE_ENV', value: 'development', dataType: 'string', isSecret: false },
      { key: 'API_TIMEOUT', value: '5000', dataType: 'number', isSecret: false },
      { key: 'DATABASE_URL', value: 'mongodb://localhost:27017/fintech_dev', dataType: 'string', isSecret: true },
      { key: 'JWT_SECRET', value: 'dev-super-secret-signing-key-321', dataType: 'string', isSecret: true },
      { key: 'DEBUG', value: 'true', dataType: 'boolean', isSecret: false },
      { key: 'CACHE_TTL', value: '60', dataType: 'number', isSecret: false },
      { key: 'RATE_LIMIT_MAX', value: '1000', dataType: 'number', isSecret: false },
      { key: 'STRIPE_API_KEY', value: 'mock_stripe_sandbox_key_987654321', dataType: 'string', isSecret: true },
      { key: 'FEATURE_FLAG_CRYPTO', value: 'true', dataType: 'boolean', isSecret: false }
    ];

    const testVariables = [
      { key: 'PORT', value: '3000', dataType: 'number', isSecret: false },
      { key: 'NODE_ENV', value: 'testing', dataType: 'string', isSecret: false },
      { key: 'API_TIMEOUT', value: '5000', dataType: 'number', isSecret: false },
      { key: 'DATABASE_URL', value: 'mongodb://test-cluster:27017/fintech_test', dataType: 'string', isSecret: true },
      { key: 'JWT_SECRET', value: 'test-staging-secret-key-654', dataType: 'string', isSecret: true },
      { key: 'DEBUG', value: 'false', dataType: 'boolean', isSecret: false },
      { key: 'CACHE_TTL', value: '300', dataType: 'number', isSecret: false },
      { key: 'RATE_LIMIT_MAX', value: '1000', dataType: 'number', isSecret: false },
      { key: 'STRIPE_API_KEY', value: 'mock_stripe_sandbox_key_987654321', dataType: 'string', isSecret: true },
      { key: 'FEATURE_FLAG_CRYPTO', value: 'false', dataType: 'boolean', isSecret: false }
    ];

    // Intentional configuration drift in production:
    // - API_TIMEOUT is 30000 (exceeds allowable range & differs from dev)
    // - DEBUG is "true" (forbidden in production!)
    // - RATE_LIMIT_MAX is "unlimited" (type mismatch: string instead of number)
    // - FEATURE_FLAG_CRYPTO is missing in production
    // - LEGACY_PROXY_URL is extra in production
    const prodVariables = [
      { key: 'PORT', value: '8080', dataType: 'number', isSecret: false },
      { key: 'NODE_ENV', value: 'production', dataType: 'string', isSecret: false },
      { key: 'API_TIMEOUT', value: '30000', dataType: 'number', isSecret: false },
      { key: 'DATABASE_URL', value: 'mongodb+srv://admin:pass@fintech-prod.mongodb.net/fintech', dataType: 'string', isSecret: true },
      { key: 'JWT_SECRET', value: 'prod-vault-master-secret-key-999', dataType: 'string', isSecret: true },
      { key: 'DEBUG', value: 'true', dataType: 'boolean', isSecret: false },
      { key: 'CACHE_TTL', value: '3600', dataType: 'number', isSecret: false },
      { key: 'RATE_LIMIT_MAX', value: 'unlimited', dataType: 'string', isSecret: false },
      { key: 'STRIPE_API_KEY', value: 'mock_stripe_live_token_998877', dataType: 'string', isSecret: true },
      { key: 'LEGACY_PROXY_URL', value: 'https://proxy.internal.corp:8443', dataType: 'string', isSecret: false }
    ];

    const [devSnapshot, testSnapshot, prodSnapshot] = await Promise.all([
      Snapshot.create({
        project: project._id,
        environment: 'development',
        version: 1,
        label: 'Sprint 24 Baseline',
        variables: devVariables,
        rawSource: devVariables.map((v) => `${v.key}=${v.value}`).join('\n'),
        createdBy: user._id
      }),
      Snapshot.create({
        project: project._id,
        environment: 'testing',
        version: 1,
        label: 'Staging Release Candidate 1.0',
        variables: testVariables,
        rawSource: testVariables.map((v) => `${v.key}=${v.value}`).join('\n'),
        createdBy: user._id
      }),
      Snapshot.create({
        project: project._id,
        environment: 'production',
        version: 1,
        label: 'Live Cluster Snapshot',
        variables: prodVariables,
        rawSource: prodVariables.map((v) => `${v.key}=${v.value}`).join('\n'),
        createdBy: user._id
      })
    ]);

    console.log(`[Seed] ✓ Created Development snapshot (v${devSnapshot.version}, ${devSnapshot.variables.length} keys)`);
    console.log(`[Seed] ✓ Created Testing snapshot (v${testSnapshot.version}, ${testSnapshot.variables.length} keys)`);
    console.log(`[Seed] ✓ Created Production snapshot (v${prodSnapshot.version}, ${prodSnapshot.variables.length} keys)`);

    // 5. Create Validation Rules
    const rules = await ValidationRule.insertMany([
      {
        project: project._id,
        key: 'API_TIMEOUT',
        targetEnvironment: 'all',
        ruleType: 'range',
        parameters: { minValue: 1000, maxValue: 10000 },
        severity: 'error',
        description: 'API timeout must remain between 1000ms and 10000ms across all environments.'
      },
      {
        project: project._id,
        key: 'DEBUG',
        targetEnvironment: 'production',
        ruleType: 'forbidden_in_env',
        parameters: { forbiddenEnvironment: 'production', forbiddenValue: 'true' },
        severity: 'error',
        description: 'Debug mode must never be enabled in production environments.'
      },
      {
        project: project._id,
        key: 'JWT_SECRET',
        targetEnvironment: 'all',
        ruleType: 'required',
        parameters: {},
        severity: 'error',
        description: 'JWT signing secret is required across every deployment environment.'
      },
      {
        project: project._id,
        key: 'DATABASE_URL',
        targetEnvironment: 'all',
        ruleType: 'required',
        parameters: {},
        severity: 'error',
        description: 'Database connection URL is required in all environments.'
      },
      {
        project: project._id,
        key: 'RATE_LIMIT_MAX',
        targetEnvironment: 'all',
        ruleType: 'type',
        parameters: { expectedType: 'number' },
        severity: 'warning',
        description: 'Rate limit maximum must be a valid numeric integer.'
      }
    ]);
    console.log(`[Seed] ✓ Created ${rules.length} validation rules (Range, Security, Type & Required)`);

    // 6. Generate Pre-calculated Historical Drift Report (Dev vs Prod)
    const comparisonResult = compareSnapshots(devSnapshot, prodSnapshot, rules);
    const driftReport = await DriftReport.create({
      project: project._id,
      baseSnapshot: devSnapshot._id,
      targetSnapshot: prodSnapshot._id,
      baseEnvironment: 'development',
      targetEnvironment: 'production',
      summary: comparisonResult.summary,
      findings: comparisonResult.findings,
      generatedBy: user._id
    });
    console.log(`[Seed] ✓ Created sample historical Drift Report (ID: ${driftReport._id})`);
    console.log(`       - Matched: ${driftReport.summary.matchedKeys}`);
    console.log(`       - Value Mismatches: ${driftReport.summary.differingKeys}`);
    console.log(`       - Missing in Target: ${driftReport.summary.missingKeys}`);
    console.log(`       - Extra in Target: ${driftReport.summary.extraKeys}`);
    console.log(`       - Type Mismatches: ${driftReport.summary.typeMismatches}`);
    console.log(`       - Rule Violations: ${driftReport.summary.ruleViolations}`);

    console.log('\n====================================================');
    console.log('  Database Seeding Completed Successfully! 🎉');
    console.log('====================================================');
    console.log('\nYou can now log in to ConfigDrift with:');
    console.log('  Email:    demo@configdrift.com');
    console.log('  Password: Password123!\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seed();
