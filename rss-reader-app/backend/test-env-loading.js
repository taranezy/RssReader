const path = require('path');
const fs = require('fs');

// Print current working directory
console.log('Current CWD:', process.cwd());
console.log('__dirname:', __dirname);

// Try different paths
const paths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
  'D:\\Development\\RssReader\\rss-reader-app\\.env'
];

console.log('\nChecking .env file paths:');
paths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`${p}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
  if (exists) {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n').filter(l => l.includes('GOOGLE'));
    console.log('  Google lines:', lines);
  }
});

// Now test dotenv loading
console.log('\nTesting dotenv loading:');
const dotenv = require('dotenv');

// Try loading from backend directory
console.log('---Attempt 1: Load from backend/.env---');
const result1 = dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Parsed:', result1.parsed ? Object.keys(result1.parsed).length + ' keys' : 'None');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

// Try loading from rss-reader-app/.env
console.log('\n---Attempt 2: Load from rss-reader-app/.env---');
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
const result2 = dotenv.config({ path: path.join(__dirname, '../../.env') });
console.log('Parsed:', result2.parsed ? Object.keys(result2.parsed).length + ' keys' : 'None');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
