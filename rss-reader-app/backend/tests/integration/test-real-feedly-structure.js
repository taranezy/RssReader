const ImportExportController = require('./src/controllers/ImportExportController');
const controller = new ImportExportController({}, {}, {}, {});

// Simulate REAL Feedly structure (NO type="folder")
const realFeedlyStructure = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Feedly Export</title></head>
  <body>
    <outline text="Scrum and Planning" title="Scrum and Planning">
      <outline type="rss" text="DZone" xmlUrl="http://feeds.dzone.com/dzone/frontpage" />
      <outline type="rss" text="Mike Cohn Blog" xmlUrl="http://www.mountaingoatsoftware.com/blog/rss" />
    </outline>
    <outline text="Entertainment" title="Entertainment">
      <outline type="rss" text="YouTube Channel 1" xmlUrl="http://gdata.youtube.com/feeds/base/users/user1/uploads" />
    </outline>
    <outline type="rss" text="Standalone Feed" xmlUrl="http://example.com/feed" />
  </body>
</opml>`;

console.log('=== REAL FEEDLY STRUCTURE (NO type="folder") ===\n');
try {
  const result = controller.parseOPML(realFeedlyStructure);
  
  console.log(`Total feeds parsed: ${result.feeds.length}\n`);
  
  result.feeds.forEach(f => {
    const category = f.category ? `"${f.category}"` : '(no folder)';
    console.log(`✓ ${f.title.padEnd(30)} -> folder: ${category}`);
  });
  
  // Summary by category
  console.log('\n--- SUMMARY ---');
  const byCategory = {};
  result.feeds.forEach(f => {
    const cat = f.category || '(no folder)';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f.title);
  });
  
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`${cat}: ${byCategory[cat].length} feeds`);
  });
} catch (e) {
  console.log('ERROR:', e.message);
  console.log(e.stack);
}
