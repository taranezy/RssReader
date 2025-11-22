const Database = require('better-sqlite3');
const path = require('path');

// Migration script to add image_url column to rss_items table
const dbPath = path.join(__dirname, 'data', 'rss-reader.db');
console.log(`Connecting to database: ${dbPath}`);

const db = new Database(dbPath);

try {
  console.log('Adding image_url column to rss_items table...');
  db.exec(`ALTER TABLE rss_items ADD COLUMN image_url TEXT;`);
  console.log('✅ Successfully added image_url column');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('✅ Column already exists, no migration needed');
  } else {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

db.close();
console.log('Migration completed successfully');
