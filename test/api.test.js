const http = require('http');

async function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/health',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const healthData = JSON.parse(data);
          if (healthData.status === 'OK') {
            console.log('✅ Health endpoint test passed');
            resolve();
          } else {
            reject(new Error('Health endpoint returned invalid status'));
          }
        } else {
          reject(new Error(`Health endpoint returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(`Health endpoint test failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health endpoint test timed out'));
    });

    req.end();
  });
}

async function testApiEndpoints() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/api/activities',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const activities = JSON.parse(data);
            if (Array.isArray(activities)) {
              console.log('✅ Activities API test passed');
              resolve();
            } else {
              reject(new Error('Activities API returned invalid data format'));
            }
          } catch (error) {
            reject(new Error('Activities API returned invalid JSON'));
          }
        } else {
          reject(new Error(`Activities API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(`API test failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API test timed out'));
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('🧪 Running API tests...');
    await testHealthEndpoint();
    await testApiEndpoints();
    console.log('✅ All API tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ API tests failed:', error.message);
    process.exit(1);
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testHealthEndpoint,
  testApiEndpoints,
  runTests,
};
