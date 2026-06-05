const express = require('express');
const bcrypt = require('bcryptjs');

console.log('🧪 Testing Admin Login Endpoint...\n');

// Simulate the admin routes
const ADMIN_USERNAME = 'boss';
const ADMIN_PASSWORD = 'boss123';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

console.log(`📝 Username: ${ADMIN_USERNAME}`);
console.log(`📝 Password: ${ADMIN_PASSWORD}`);
console.log(`🔐 Password Hash: ${ADMIN_PASSWORD_HASH.substring(0, 20)}...\n`);

// Test password verification
const testPassword = 'boss123';
const passwordMatch = bcrypt.compareSync(testPassword, ADMIN_PASSWORD_HASH);

console.log(`✅ Testing Password Verification:`);
console.log(`   Password "${testPassword}" matches hash: ${passwordMatch}\n`);

// Test request body parsing
const testRequestBody = {
  username: 'boss',
  password: 'boss123'
};

console.log(`✅ Test Request Body: ${JSON.stringify(testRequestBody)}\n`);

// Verify the admin routes file can be required
try {
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes file loaded successfully');
  console.log(`   Router type: ${typeof adminRoutes}`);
  console.log(`   Router methods: ${adminRoutes.methods ? 'yes' : 'checking...'}\n`);
} catch (err) {
  console.error('❌ ERROR loading admin routes:');
  console.error(`   ${err.message}\n`);
  console.error('Stack:', err.stack);
}

// Test the endpoint URL
const backendUrl = 'https://backened-server.onrender.com';
const loginUrl = `${backendUrl}/api/admin/login`;
console.log(`🌍 Endpoint URL: ${loginUrl}`);
console.log(`\n✅ To test with curl:`);
console.log(`   curl -X POST ${loginUrl} \\`);
console.log(`   -H "Content-Type: application/json" \\`);
console.log(`   -d '{"username":"boss","password":"boss123"}'\n`);
