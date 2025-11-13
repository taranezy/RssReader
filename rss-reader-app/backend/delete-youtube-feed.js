const Database = require('better-sqlite3');
const db = new Database('data/rss-reader.db');

const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ';

try {
  const stmt = db.prepare('DELETE FROM rss_feeds WHERE url = ?');
  const result = stmt.run(url);
  console.log(`Deleted ${result.changes} feed(s)`);
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM rss_feeds').get();
  console.log(`Remaining feeds in database: ${remaining.count}`);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
