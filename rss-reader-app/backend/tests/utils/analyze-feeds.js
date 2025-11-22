/**
 * Check which feeds have categories
 */
const Database = require('./database');
const db = new Database();

console.log('\n=== FEEDS ANALYSIS ===\n');

const allFeeds = db.db.prepare(`
  SELECT id, title, category, added_date FROM rss_feeds WHERE user_id = 1 ORDER BY added_date DESC LIMIT 30
`).all();

console.log(`Total feeds (last 30): ${allFeeds.length}\n`);

let withCategory = 0;
let withoutCategory = 0;

allFeeds.forEach(f => {
  if (f.category && f.category.trim() !== '') {
    withCategory++;
    console.log(`✅ ${f.title.substring(0, 50)}`);
    console.log(`   Category: "${f.category}"`);
    console.log(`   Added: ${f.added_date}\n`);
  } else {
    withoutCategory++;
    console.log(`❌ ${f.title.substring(0, 50)}`);
    console.log(`   Category: (empty)`);
    console.log(`   Added: ${f.added_date}\n`);
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Feeds WITH categories: ${withCategory}`);
console.log(`Feeds WITHOUT categories: ${withoutCategory}\n`);

db.close();
