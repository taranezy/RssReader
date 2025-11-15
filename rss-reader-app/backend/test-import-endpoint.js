/**
 * Test the /api/import endpoint with the Feedly no-type OPML format
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

// Read the test OPML file (no-type version)
const testOPMLPath = path.join(__dirname, '..', '..', 'test-feedly-no-type.opml');
const xmlData = fs.readFileSync(testOPMLPath, 'utf8');

console.log('\n=== TESTING /api/import ENDPOINT ===\n');

// Create a valid JWT token for testing (adjust if needed)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.qzl7S8z7d5UqV5KX5c5Y0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0';

const postData = JSON.stringify({
  xmlData: xmlData
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': `token=${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('\n=== END TEST ===\n');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(postData);
req.end();

// Timeout after 5 seconds
setTimeout(() => {
  console.error('Request timeout');
  process.exit(1);
}, 5000);
