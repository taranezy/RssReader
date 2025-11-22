const Database = require('better-sqlite3');
const db = new Database('data/rss-reader.db');

try {
  // Get rss_items schema
  const schema = db.prepare("PRAGMA table_info(rss_items)").all();
  console.log('rss_items columns:');
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

    // Count items
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM rss_items WHERE feed_id = ?').get(feed.id);
    console.log(`Items Count: ${itemCount.count}`);

    // Show sample items
    if (itemCount.count > 0) {
      const items = db.prepare(`
        SELECT id, title, description, pub_date, is_read 
        FROM rss_items 
        WHERE feed_id = ? 
        LIMIT 3
      `).all(feed.id);

      console.log('Sample Items:');
      items.forEach(item => {
        const desc = item.description ? item.description.substring(0, 50) : '(no description)';
        console.log(`  - "${item.title.substring(0, 60)}"`);
        console.log(`    Desc: ${desc}...`);
        console.log(`    Read: ${item.is_read}`);
      });
    } else {
      console.log('⚠️  No items found for this feed');
    }
    console.log('');
  });

} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
} finally {
  db.close();
}
