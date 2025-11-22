// Test to verify /api/user-settings returns correct data format
const http = require('http');
const Database = require('./database.js');

// First, get a real session by creating a test user
const db = new Database();

// Get the first user
const user = db.findUserByEmail('taranezy@gmail.com');
console.log('Test user:', user);

if (user) {
  // Now make an HTTP request with credentials
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/user-settings',
    method: 'GET',
    withCredentials: true
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('\nAPI Response Status:', res.statusCode);
      console.log('API Response Body:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });

  req.on('error', err => {
    console.error('Request error:', err.message);
  });

  req.end();
} else {
  console.log('No users found in database');
}

db.close();
