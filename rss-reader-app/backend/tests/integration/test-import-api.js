/**
 * Test the actual import API endpoint
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

// Read the test OPML file (no-type version)
const testOPMLPath = path.join(__dirname, '..', '..', 'test-feedly-no-type.opml');
const xmlData = fs.readFileSync(testOPMLPath, 'utf8');

console.log('\n=== TESTING IMPORT API ENDPOINT ===\n');

// Make request to import endpoint
const postData = JSON.stringify({
  xmlData: xmlData
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.qzl7S8z7d5UqV5KX5c5Y0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0' // Replace with actual token
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API Response:');
    console.log(data);
    console.log('\n=== END TEST ===\n');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
