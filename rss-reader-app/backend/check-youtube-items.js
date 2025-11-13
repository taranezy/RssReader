const Database = require('better-sqlite3');
const db = new Database('data/rss-reader.db');

try {
  // Get schema info
  const schema = db.prepare("PRAGMA table_info(rss_feeds)").all();
  console.log('rss_feeds columns:');
  schema.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  console.log('');

  // Find the YouTube feed
  const feeds = db.prepare(`
    SELECT id, title, url 
    FROM rss_feeds 
    WHERE url LIKE ? 
    LIMIT 5
  `).all('%UCBJycsmduvYEL83R_U4JriQ%');

  console.log('YouTube Feeds Found:', feeds.length);
  console.log('');

  feeds.forEach(feed => {
    console.log(`Feed: ${feed.title}`);
    console.log(`ID: ${feed.id}`);
    console.log(`URL: ${feed.url}`);
    console.log(`Created: ${feed.createdAt}`);

    // Count items
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM rss_items WHERE feedId = ?').get(feed.id);
    console.log(`Items Count: ${itemCount.count}`);

    // Show sample items
    if (itemCount.count > 0) {
      const items = db.prepare(`
        SELECT id, title, description, pubDate, isRead 
        FROM rss_items 
        WHERE feedId = ? 
        LIMIT 3
      `).all(feed.id);

      console.log('Sample Items:');
      items.forEach(item => {
        const desc = item.description ? item.description.substring(0, 50) : '(no description)';
        console.log(`  - "${item.title.substring(0, 60)}"`);
        console.log(`    Desc: ${desc}...`);
        console.log(`    Read: ${item.isRead}`);
      });
    }
    console.log('');
  });

} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}
