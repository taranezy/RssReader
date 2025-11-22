// Direct test to verify demo user and feeds creation
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, './data', 'rss-reader.db');
const db = new Database(dbPath);

console.log('\n=== DEMO FEEDS TEST ===\n');

// Check if demo user exists
console.log('1. Checking for demo user...');
const demoUser = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@example.com');

if (demoUser) {
  console.log(`   ✓ Demo user found: ID=${demoUser.id}, email=${demoUser.email}`);
  
  // Check feeds for demo user
  console.log(`\n2. Checking feeds for demo user (ID=${demoUser.id})...`);
  const feeds = db.prepare('SELECT * FROM rss_feeds WHERE user_id = ?').all(demoUser.id);
  
  console.log(`   Found ${feeds.length} feeds:`);
  if (feeds.length > 0) {
    feeds.forEach((feed, idx) => {
      console.log(`   ${idx + 1}. ${feed.title} (ID: ${feed.id})`);
    });
    console.log(`\n   ✓ SUCCESS: Demo user has ${feeds.length} feeds`);
  } else {
    console.log('   ✗ ERROR: No feeds found for demo user!');
    console.log('   This means populateInitialFeeds() is not being called or is failing.');
  }
} else {
  console.log('   ✗ Demo user NOT found in database!');
  console.log('   Demo user needs to be created on first login.');
}

// Summary
console.log('\n=== SUMMARY ===');
const allUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
const allFeeds = db.prepare('SELECT COUNT(*) as count FROM rss_feeds').get();
const allItems = db.prepare('SELECT COUNT(*) as count FROM rss_items').get();

console.log(`Total users: ${allUsers.count}`);
console.log(`Total feeds: ${allFeeds.count}`);
console.log(`Total items: ${allItems.count}`);

db.close();
