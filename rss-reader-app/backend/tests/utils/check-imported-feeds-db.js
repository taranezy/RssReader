const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/rss-reader.db');
const db = new Database(dbPath);

console.log('=== Checking Imported Feeds in Database ===\n');

// Get all feeds with their categories
const feeds = db.prepare(`
  SELECT id, user_id, title, url, category, created_at 
  FROM rss_feeds 
  ORDER BY created_at DESC 
  LIMIT 20
`).all();

console.log(`Total feeds in database: ${feeds.length}\n`);

if (feeds.length > 0) {
  console.log('Recent feeds:');
  feeds.forEach(f => {
    const cat = f.category || '(no category)';
    console.log(`✓ ${f.title.padEnd(40)} | Category: "${cat}" | User: ${f.user_id}`);
  });
  
  console.log('\n--- SUMMARY BY CATEGORY ---');
  const byCategory = {};
  feeds.forEach(f => {
    const cat = f.category || '(no category)';
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat]++;
  });
  
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`- ${cat}: ${byCategory[cat]} feeds`);
  });
} else {
  console.log('No feeds in database');
}

db.close();
