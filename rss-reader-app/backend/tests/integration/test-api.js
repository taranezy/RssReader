// Test the full API endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/user-settings',
  method: 'GET',
  headers: {
    'Cookie': 'sessionId=test'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

console.log('Testing GET /api/user-settings...');
req.end();
