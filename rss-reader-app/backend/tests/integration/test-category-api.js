/**
 * Test POST /api/feeds with category field
 */
const http = require('http');

console.log('\n=== TESTING POST /api/feeds WITH CATEGORY ===\n');

// Test data matching what frontend sends
const feedData = {
  id: 'test-feed-' + Date.now(),
  url: 'https://example.com/test-feed',
  title: 'Test Feed with Category',
  description: 'This is a test feed',
  category: 'Technology',  // THE KEY FIELD!
  color: '#FF5733',
  isActive: true,
  addedDate: new Date().toISOString(),
  lastFetched: null
};

const postData = JSON.stringify(feedData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/feeds',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'connect.sid=s:i9-701YvcVZ26Uq5jwJwmnrz9aT2JnhW.PoxWMD99meoKb6wiu3qFly/Zxmh9at+eYmC1NZXWKmg'
  }
};

console.log('Sending POST request:');
console.log(`URL: ${options.path}`);
console.log(`Data:`, feedData);
console.log('');

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
      
      if (json.data) {
        console.log('\n✅ Feed created!');
        console.log(`   ID: ${json.data.id}`);
        console.log(`   Title: ${json.data.title}`);
        console.log(`   Category: "${json.data.category || '(empty)'}"`);
        
        if (json.data.category === 'Technology') {
          console.log('\n✅ SUCCESS! Category is preserved!');
        } else {
          console.log('\n❌ FAILED! Category was not preserved!');
        }
      }
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

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Request timeout');
  process.exit(1);
}, 10000);
