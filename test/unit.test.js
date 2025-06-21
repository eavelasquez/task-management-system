// Simple unit tests that don't require a running server
const path = require('path');
const fs = require('fs');

function testProjectStructure() {
  console.log('🧪 Testing project structure...');

  const requiredFiles = [
    'src/app.js',
    'src/server.js',
    'src/config/database.js',
    'src/models/Activity.js',
    'package.json'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  console.log('✅ Project structure test passed');
}

function testPackageJson() {
  console.log('🧪 Testing package.json...');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  if (!packageJson.name) {
    throw new Error('Package.json missing name');
  }

  if (!packageJson.version) {
    throw new Error('Package.json missing version');
  }

  const requiredDeps = ['express', 'mongoose', 'cors'];
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      throw new Error(`Missing required dependency: ${dep}`);
    }
  }

  console.log('✅ Package.json test passed');
}

function testEnvironmentConfig() {
  console.log('🧪 Testing environment configuration...');

  // Test that required environment variables have defaults
  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (typeof port !== 'string' && typeof port !== 'number') {
    throw new Error('Invalid PORT configuration');
  }

  if (!['development', 'test', 'production', 'staging'].includes(nodeEnv)) {
    console.warn(`⚠️  Unusual NODE_ENV value: ${nodeEnv}`);
  }

  console.log('✅ Environment configuration test passed');
}

function testBasicRequires() {
  console.log('🧪 Testing basic requires...');

  try {
    // Test that utility modules can be required without side effects
    const utilsPath = path.join(__dirname, '../src/utils/logger.js');
    if (fs.existsSync(utilsPath)) {
      require('../src/utils/logger.js');
      console.log('✅ Logger module can be required');
    }

    // Test models can be required (they don't auto-connect)
    const modelsPath = path.join(__dirname, '../src/models/Activity.js');
    if (fs.existsSync(modelsPath)) {
      require('../src/models/Activity.js');
      console.log('✅ Activity model can be required');
    }
  } catch (error) {
    throw new Error(`Failed to require modules: ${error.message}`);
  }

  console.log('✅ Basic requires test passed');
}

async function runUnitTests() {
  try {
    console.log('🚀 Running unit tests...\n');

    testProjectStructure();
    testPackageJson();
    testEnvironmentConfig();
    testBasicRequires();

    console.log('\n✅ All unit tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Unit tests failed:', error.message);
    process.exit(1);
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runUnitTests();
}

module.exports = {
  testProjectStructure,
  testPackageJson,
  testEnvironmentConfig,
  testBasicRequires,
  runUnitTests,
}; 
