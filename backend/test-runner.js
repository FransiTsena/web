#!/usr/bin/env node

/**
 * Test runner for the freelance invoice tracking API
 * This script runs all API tests against the test server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting API tests...\n');

// Spawn a new process to run the test server and tests
const testProcess = spawn('node', ['test/api.test.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
});

testProcess.on('close', (code) => {
    console.log(`\n🏁 Tests finished with code ${code}`);

    if (code === 0) {
        console.log('✅ All tests passed!');
    } else {
        console.log('❌ Some tests failed!');
        process.exit(code);
    }
});

testProcess.on('error', (err) => {
    console.error('❌ Error running tests:', err.message);
    process.exit(1);
});