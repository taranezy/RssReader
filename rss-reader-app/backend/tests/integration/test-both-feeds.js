const ImportExportController = require('./src/controllers/ImportExportController');
const fs = require('fs');
const controller = new ImportExportController({}, {}, {}, {});

// Test with the test-feedly-import.opml (which has type="folder")
console.log('=== TEST FILE (with type="folder") ===\n');
const testData = fs.readFileSync('../../test-feedly-import.opml', 'utf8');
try {
  const result1 = controller.parseOPML(testData);
  result1.feeds.forEach(f => {
    console.log(`- ${f.title} (folder: "${f.category}")`);
  });
} catch (e) {
  console.log('ERROR:', e.message);
}

console.log('\n=== REAL FEEDLY (from attachment) ===\n');
// Test with the real Feedly export
try {
  const realData = fs.readFileSync('../../feedly-b333a9e8-cd49-4ad4-a440-c441e9943837-2025-11-07.opml', 'utf8');
  const result2 = controller.parseOPML(realData);
  console.log(`Total feeds: ${result2.feeds.length}\n`);
  const byCategory = {};
  result2.feeds.forEach(f => {
    const cat = f.category || '(No Folder)';
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat]++;
  });
  Object.keys(byCategory).sort().slice(0, 15).forEach(cat => {
    console.log(`- ${cat}: ${byCategory[cat]} feeds`);
  });
  
  // Show sample feeds from first folder
  const firstFolder = Object.keys(byCategory).find(c => c !== '(No Folder)');
  if (firstFolder) {
    console.log(`\nSample feeds in "${firstFolder}":`);
    result2.feeds.filter(f => f.category === firstFolder).slice(0, 3).forEach(f => {
      console.log(`  - ${f.title}`);
    });
  }
} catch (e) {
  console.log('ERROR:', e.message);
}
