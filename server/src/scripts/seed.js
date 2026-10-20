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
const { compareSnapshots } = require('../services/comparisonEngine');

/**
 * Helper to build a complete project workspace with 3 snapshots (dev/test/prod),
 * custom validation rules, and an automatic pre-calculated drift report.
 */
async function createFullProject(user, { name, description, devVars, testVars, prodVars, rulesConfig }) {
  // 1. Create Project
  const project = await Project.create({
    name,
    description,
    owner: user._id
  });

  // 2. Create Snapshots
  const [devSnapshot, testSnapshot, prodSnapshot] = await Promise.all([
    Snapshot.create({
      project: project._id,
      environment: 'development',
      version: 1,
      label: 'Sprint Baseline (Dev)',
      variables: devVars,
      rawSource: devVars.map((v) => `${v.key}=${v.value}`).join('\n'),
      createdBy: user._id
    }),
    Snapshot.create({
      project: project._id,
      environment: 'testing',
      version: 1,
      label: 'Staging Release Candidate (Test)',
      variables: testVars,
      rawSource: testVars.map((v) => `${v.key}=${v.value}`).join('\n'),
      createdBy: user._id
    }),
    Snapshot.create({
      project: project._id,
      environment: 'production',
      version: 1,
      label: 'Active Production Cluster (Prod)',
      variables: prodVars,
      rawSource: prodVars.map((v) => `${v.key}=${v.value}`).join('\n'),
      createdBy: user._id
    })
  ]);

  // 3. Create Validation Rules
  const rules = await ValidationRule.insertMany(
    rulesConfig.map((r) => ({
      ...r,
      project: project._id
    }))
  );

  // 4. Generate Pre-calculated Historical Drift Report (Dev vs Prod)
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

  console.log(`[Seed] ✓ Created "${name}" (ID: ${project._id}) — Rules: ${rules.length}, Drift: ${driftReport.summary.driftScore}%`);
  return project;
}

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

    // Target demo emails
    const demoAccounts = ['demo@configdrift.com', 'demo1@configdrift.com'];

    for (const demoEmail of demoAccounts) {
      // 1. Clean existing records for this demo user
      const existingUser = await User.findOne({ email: demoEmail });
      if (existingUser) {
        console.log(`[Seed] Cleaning prior records for user: ${demoEmail}`);
        const userProjects = await Project.find({ owner: existingUser._id });
        const projectIds = userProjects.map((p) => p._id);

        await Promise.all([
          Snapshot.deleteMany({ project: { $in: projectIds } }),
          ValidationRule.deleteMany({ project: { $in: projectIds } }),
          DriftReport.deleteMany({ project: { $in: projectIds } }),
          Project.deleteMany({ owner: existingUser._id }),
          User.deleteOne({ _id: existingUser._id })
        ]);
      }

      // 2. Create Demo User
      const user = await User.create({
        name: demoEmail === 'demo@configdrift.com' ? 'Demo Engineer' : 'Gururaj Sohal',
        email: demoEmail,
        password: 'Password123!'
      });
      console.log(`[Seed] ✓ Created demo user: ${user.email} (Password: Password123!)`);

      // 3. Seed Demo Project 1: FinTech Core Platform
      await createFullProject(user, {
        name: 'FinTech Core Platform',
        description: 'High-throughput payment processing and ledger microservices with multi-environment parity verification',
        devVars: [
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
        ],
        testVars: [
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
        ],
        prodVars: [
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
        ],
        rulesConfig: [
          {
            key: 'API_TIMEOUT',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 1000, maxValue: 10000 },
            severity: 'error',
            description: 'API timeout must remain between 1000ms and 10000ms across all environments.'
          },
          {
            key: 'DEBUG',
            targetEnvironment: 'production',
            ruleType: 'forbidden_in_env',
            parameters: { forbiddenEnvironment: 'production', forbiddenValue: 'true' },
            severity: 'error',
            description: 'Debug mode must never be enabled in production environments.'
          },
          {
            key: 'JWT_SECRET',
            targetEnvironment: 'all',
            ruleType: 'required',
            parameters: {},
            severity: 'error',
            description: 'JWT signing secret is required across every deployment environment.'
          },
          {
            key: 'DATABASE_URL',
            targetEnvironment: 'all',
            ruleType: 'required',
            parameters: {},
            severity: 'error',
            description: 'Database connection URL is required in all environments.'
          },
          {
            key: 'RATE_LIMIT_MAX',
            targetEnvironment: 'all',
            ruleType: 'type',
            parameters: { expectedType: 'number' },
            severity: 'warning',
            description: 'Rate limit maximum must be a valid numeric integer.'
          }
        ]
      });

      // 4. Seed Demo Project 2: E-Commerce Checkout & Cart API
      await createFullProject(user, {
        name: 'E-Commerce Checkout & Cart API',
        description: 'Distributed cart management, inventory synchronization, and Stripe checkout webhook pipeline',
        devVars: [
          { key: 'PORT', value: '4000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'development', dataType: 'string', isSecret: false },
          { key: 'DATABASE_URL', value: 'mongodb://localhost:27017/shop_dev', dataType: 'string', isSecret: true },
          { key: 'REDIS_CACHE_URL', value: 'redis://localhost:6379', dataType: 'string', isSecret: false },
          { key: 'STRIPE_WEBHOOK_SECRET', value: 'whsec_dev_mock_test_key_8833', dataType: 'string', isSecret: true },
          { key: 'CART_EXPIRY_MINUTES', value: '30', dataType: 'number', isSecret: false },
          { key: 'ENABLE_PROMO_ENGINE', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'INVENTORY_RETRY_LIMIT', value: '3', dataType: 'number', isSecret: false }
        ],
        testVars: [
          { key: 'PORT', value: '4000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'testing', dataType: 'string', isSecret: false },
          { key: 'DATABASE_URL', value: 'mongodb://staging-db:27017/shop_test', dataType: 'string', isSecret: true },
          { key: 'REDIS_CACHE_URL', value: 'redis://staging-cache:6379', dataType: 'string', isSecret: false },
          { key: 'STRIPE_WEBHOOK_SECRET', value: 'whsec_staging_test_key_9944', dataType: 'string', isSecret: true },
          { key: 'CART_EXPIRY_MINUTES', value: '30', dataType: 'number', isSecret: false },
          { key: 'ENABLE_PROMO_ENGINE', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'INVENTORY_RETRY_LIMIT', value: '3', dataType: 'number', isSecret: false }
        ],
        prodVars: [
          { key: 'PORT', value: '8000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'production', dataType: 'string', isSecret: false },
          { key: 'DATABASE_URL', value: 'mongodb+srv://admin:pass@shop-prod.cluster.mongodb.net/shop', dataType: 'string', isSecret: true },
          { key: 'REDIS_CACHE_URL', value: 'rediss://elasticache-redis.aws.internal:6379', dataType: 'string', isSecret: false },
          { key: 'STRIPE_WEBHOOK_SECRET', value: 'whsec_prod_live_secret_4422', dataType: 'string', isSecret: true },
          { key: 'CART_EXPIRY_MINUTES', value: '120', dataType: 'number', isSecret: false },
          { key: 'ENABLE_PROMO_ENGINE', value: 'false', dataType: 'boolean', isSecret: false },
          { key: 'INVENTORY_RETRY_LIMIT', value: '15', dataType: 'number', isSecret: false },
          { key: 'PROD_FALLBACK_GATEWAY', value: 'https://backup.gateway.io', dataType: 'string', isSecret: false }
        ],
        rulesConfig: [
          {
            key: 'CART_EXPIRY_MINUTES',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 10, maxValue: 60 },
            severity: 'warning',
            description: 'Shopping cart session duration must stay between 10 and 60 minutes.'
          },
          {
            key: 'STRIPE_WEBHOOK_SECRET',
            targetEnvironment: 'all',
            ruleType: 'required',
            parameters: {},
            severity: 'error',
            description: 'Stripe webhook signature validation secret is strictly required.'
          },
          {
            key: 'INVENTORY_RETRY_LIMIT',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 1, maxValue: 5 },
            severity: 'error',
            description: 'Inventory optimistic locking retry count must not exceed 5.'
          }
        ]
      });

      // 5. Seed Demo Project 3: Healthcare Patient Portal & Telehealth
      await createFullProject(user, {
        name: 'Healthcare Patient Portal & Telehealth',
        description: 'HIPAA-compliant medical record synchronization, HL7/FHIR messaging, and encrypted WebRTC telemetry',
        devVars: [
          { key: 'PORT', value: '8081', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'development', dataType: 'string', isSecret: false },
          { key: 'FHIR_SERVER_URL', value: 'http://localhost:8080/fhir', dataType: 'string', isSecret: false },
          { key: 'HIPAA_AUDIT_LOG_ENABLED', value: 'false', dataType: 'boolean', isSecret: false },
          { key: 'ENCRYPTION_KEY_BITS', value: '256', dataType: 'number', isSecret: false },
          { key: 'SESSION_TIMEOUT_MINUTES', value: '60', dataType: 'number', isSecret: false },
          { key: 'AWS_KMS_KEY_ID', value: 'arn:aws:kms:us-east-1:123456789:key/dev', dataType: 'string', isSecret: true },
          { key: 'PATIENT_EXPORT_BATCH_SIZE', value: '100', dataType: 'number', isSecret: false }
        ],
        testVars: [
          { key: 'PORT', value: '8081', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'testing', dataType: 'string', isSecret: false },
          { key: 'FHIR_SERVER_URL', value: 'https://staging-fhir.health.internal', dataType: 'string', isSecret: false },
          { key: 'HIPAA_AUDIT_LOG_ENABLED', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'ENCRYPTION_KEY_BITS', value: '256', dataType: 'number', isSecret: false },
          { key: 'SESSION_TIMEOUT_MINUTES', value: '15', dataType: 'number', isSecret: false },
          { key: 'AWS_KMS_KEY_ID', value: 'arn:aws:kms:us-east-1:123456789:key/stage', dataType: 'string', isSecret: true },
          { key: 'PATIENT_EXPORT_BATCH_SIZE', value: '100', dataType: 'number', isSecret: false }
        ],
        prodVars: [
          { key: 'PORT', value: '443', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'production', dataType: 'string', isSecret: false },
          { key: 'FHIR_SERVER_URL', value: 'https://fhir.health.internal', dataType: 'string', isSecret: false },
          { key: 'HIPAA_AUDIT_LOG_ENABLED', value: 'false', dataType: 'boolean', isSecret: false },
          { key: 'ENCRYPTION_KEY_BITS', value: '128', dataType: 'number', isSecret: false },
          { key: 'SESSION_TIMEOUT_MINUTES', value: '120', dataType: 'number', isSecret: false },
          { key: 'AWS_KMS_KEY_ID', value: 'arn:aws:kms:us-east-1:999888777:key/prod', dataType: 'string', isSecret: true },
          { key: 'PATIENT_EXPORT_BATCH_SIZE', value: '500', dataType: 'number', isSecret: false },
          { key: 'LEGACY_EMR_ADAPTER', value: 'http://legacy.emr.internal', dataType: 'string', isSecret: false }
        ],
        rulesConfig: [
          {
            key: 'HIPAA_AUDIT_LOG_ENABLED',
            targetEnvironment: 'production',
            ruleType: 'forbidden_in_env',
            parameters: { forbiddenEnvironment: 'production', forbiddenValue: 'false' },
            severity: 'error',
            description: 'HIPAA audit logging must never be disabled in production.'
          },
          {
            key: 'ENCRYPTION_KEY_BITS',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 256, maxValue: 512 },
            severity: 'error',
            description: 'Encryption key strength must be at least 256-bit AES.'
          },
          {
            key: 'SESSION_TIMEOUT_MINUTES',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 5, maxValue: 30 },
            severity: 'warning',
            description: 'Inactivity session timeout must remain between 5 and 30 minutes for compliance.'
          }
        ]
      });

      // 6. Seed Demo Project 4: Cloud Auth & Identity Gateway
      await createFullProject(user, {
        name: 'Cloud Auth & Identity Gateway',
        description: 'Centralized OAuth2 / OIDC token authority, JWT claims signing, and RBAC policy enforcement',
        devVars: [
          { key: 'PORT', value: '5001', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'development', dataType: 'string', isSecret: false },
          { key: 'AUTH_DB_URI', value: 'postgres://postgres:root@localhost:5432/idp_dev', dataType: 'string', isSecret: true },
          { key: 'JWT_SIGNING_ALGORITHM', value: 'RS256', dataType: 'string', isSecret: false },
          { key: 'TOKEN_EXPIRY_HOURS', value: '24', dataType: 'number', isSecret: false },
          { key: 'MFA_ENFORCED', value: 'false', dataType: 'boolean', isSecret: false },
          { key: 'CORS_ORIGIN', value: 'http://localhost:3000', dataType: 'string', isSecret: false },
          { key: 'MAX_LOGIN_ATTEMPTS', value: '10', dataType: 'number', isSecret: false }
        ],
        testVars: [
          { key: 'PORT', value: '5001', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'testing', dataType: 'string', isSecret: false },
          { key: 'AUTH_DB_URI', value: 'postgres://stage_user:pass@staging-db:5432/idp_test', dataType: 'string', isSecret: true },
          { key: 'JWT_SIGNING_ALGORITHM', value: 'RS256', dataType: 'string', isSecret: false },
          { key: 'TOKEN_EXPIRY_HOURS', value: '8', dataType: 'number', isSecret: false },
          { key: 'MFA_ENFORCED', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'CORS_ORIGIN', value: 'https://staging.cloud.io', dataType: 'string', isSecret: false },
          { key: 'MAX_LOGIN_ATTEMPTS', value: '5', dataType: 'number', isSecret: false }
        ],
        prodVars: [
          { key: 'PORT', value: '443', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'production', dataType: 'string', isSecret: false },
          { key: 'AUTH_DB_URI', value: 'postgres://admin:vault_pass@aurora-cluster.internal:5432/idp_prod', dataType: 'string', isSecret: true },
          { key: 'JWT_SIGNING_ALGORITHM', value: 'HS256', dataType: 'string', isSecret: false },
          { key: 'TOKEN_EXPIRY_HOURS', value: '72', dataType: 'number', isSecret: false },
          { key: 'MFA_ENFORCED', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'CORS_ORIGIN', value: '*', dataType: 'string', isSecret: false },
          { key: 'MAX_LOGIN_ATTEMPTS', value: '5', dataType: 'number', isSecret: false }
        ],
        rulesConfig: [
          {
            key: 'CORS_ORIGIN',
            targetEnvironment: 'production',
            ruleType: 'forbidden_in_env',
            parameters: { forbiddenEnvironment: 'production', forbiddenValue: '*' },
            severity: 'error',
            description: 'Wildcard CORS origin is forbidden in production environments.'
          },
          {
            key: 'TOKEN_EXPIRY_HOURS',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 1, maxValue: 12 },
            severity: 'warning',
            description: 'Token lifespan should not exceed 12 hours.'
          },
          {
            key: 'AUTH_DB_URI',
            targetEnvironment: 'all',
            ruleType: 'required',
            parameters: {},
            severity: 'error',
            description: 'Identity Provider database connection string is required.'
          }
        ]
      });

      // 7. Seed Demo Project 5: AI Inference & LLM Pipeline
      await createFullProject(user, {
        name: 'AI Inference & LLM Pipeline',
        description: 'High-throughput asynchronous GPU worker cluster for document embeddings and semantic vector indexing',
        devVars: [
          { key: 'PORT', value: '9000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'development', dataType: 'string', isSecret: false },
          { key: 'MODEL_ENDPOINT', value: 'http://localhost:11434', dataType: 'string', isSecret: false },
          { key: 'MAX_CONCURRENT_REQUESTS', value: '2', dataType: 'number', isSecret: false },
          { key: 'EMBEDDING_DIMENSION', value: '1536', dataType: 'number', isSecret: false },
          { key: 'VECTOR_DB_URL', value: 'http://localhost:6333', dataType: 'string', isSecret: false },
          { key: 'GPU_ACCELERATION', value: 'false', dataType: 'boolean', isSecret: false },
          { key: 'QUEUE_BATCH_SIZE', value: '10', dataType: 'number', isSecret: false }
        ],
        testVars: [
          { key: 'PORT', value: '9000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'testing', dataType: 'string', isSecret: false },
          { key: 'MODEL_ENDPOINT', value: 'https://staging-vllm.ai.internal', dataType: 'string', isSecret: false },
          { key: 'MAX_CONCURRENT_REQUESTS', value: '10', dataType: 'number', isSecret: false },
          { key: 'EMBEDDING_DIMENSION', value: '1536', dataType: 'number', isSecret: false },
          { key: 'VECTOR_DB_URL', value: 'http://staging-qdrant:6333', dataType: 'string', isSecret: false },
          { key: 'GPU_ACCELERATION', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'QUEUE_BATCH_SIZE', value: '25', dataType: 'number', isSecret: false }
        ],
        prodVars: [
          { key: 'PORT', value: '9000', dataType: 'number', isSecret: false },
          { key: 'NODE_ENV', value: 'production', dataType: 'string', isSecret: false },
          { key: 'MODEL_ENDPOINT', value: 'https://vllm-cluster.ai.internal', dataType: 'string', isSecret: false },
          { key: 'MAX_CONCURRENT_REQUESTS', value: '250', dataType: 'number', isSecret: false },
          { key: 'EMBEDDING_DIMENSION', value: '768', dataType: 'number', isSecret: false },
          { key: 'VECTOR_DB_URL', value: 'https://prod-qdrant.ai.internal:6333', dataType: 'string', isSecret: false },
          { key: 'GPU_ACCELERATION', value: 'true', dataType: 'boolean', isSecret: false },
          { key: 'QUEUE_BATCH_SIZE', value: '100', dataType: 'number', isSecret: false },
          { key: 'DEBUG_PROMPTS', value: 'true', dataType: 'boolean', isSecret: false }
        ],
        rulesConfig: [
          {
            key: 'EMBEDDING_DIMENSION',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 1536, maxValue: 3072 },
            severity: 'error',
            description: 'Embedding dimension must match the 1536+ vector database index specification.'
          },
          {
            key: 'MAX_CONCURRENT_REQUESTS',
            targetEnvironment: 'all',
            ruleType: 'range',
            parameters: { minValue: 1, maxValue: 100 },
            severity: 'warning',
            description: 'Concurrent worker limit must not exceed 100 to avoid GPU memory exhaustion.'
          },
          {
            key: 'DEBUG_PROMPTS',
            targetEnvironment: 'production',
            ruleType: 'forbidden_in_env',
            parameters: { forbiddenEnvironment: 'production', forbiddenValue: 'true' },
            severity: 'error',
            description: 'Logging raw model prompts is strictly forbidden in production to prevent data leakage.'
          }
        ]
      });
    }

    console.log('\n====================================================');
    console.log('  Database Seeding Completed Successfully! 🎉');
    console.log('====================================================');
    console.log('\nYou can now log in to ConfigDrift with:');
    console.log('  Email:    demo@configdrift.com (or demo1@configdrift.com)');
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
