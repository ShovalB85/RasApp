#!/usr/bin/env node

/**
 * Simple script to test server connection
 * Usage: node test-connection.js [url]
 */

const url = process.argv[2] || 'http://localhost:3001';

async function testConnection() {
  console.log(`Testing connection to: ${url}\n`);

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${url}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test login endpoint
    const loginResponse = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalId: '8223283',
        password: 'P)O(I*q1w2e3'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login test: Success');
      console.log('   User:', loginData.user.name);
      console.log('   Token received:', loginData.token ? 'Yes' : 'No');
    } else {
      const error = await loginResponse.json();
      console.log('❌ Login test failed:', error.error);
    }

    console.log('\n✅ Server is accessible and working!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Server is running (npm run dev)');
    console.log('   2. URL is correct');
    console.log('   3. Database is initialized (npm run db:migrate)');
    process.exit(1);
  }
}

testConnection();


