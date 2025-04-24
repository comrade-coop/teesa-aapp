// Mock server-only
jest.mock('server-only', () => {}, { virtual: true });

// Load environment variables from .env
require('dotenv').config({ path: './.env' });

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add test script to package.json
if (typeof process.env.JEST_WORKER_ID === 'undefined') {
  const fs = require('fs');
  const path = require('path');
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.scripts.test) {
    packageJson.scripts.test = 'jest';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Added test script to package.json');
  }
}
