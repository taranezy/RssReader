#!/usr/bin/env node

const ImportExportController = require('./src/controllers/ImportExportController');

class MockDeps {}
const controller = new ImportExportController(new MockDeps(), new MockDeps(), new MockDeps(), new MockDeps());

const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" xmlUrl="http://feeds.techcrunch.com/feed" />
      <outline type="rss" text="The Verge" xmlUrl="http://feeds.theverge.com/feed" />
    </outline>
    <outline text="Entertainment" title="Entertainment">
      <outline type="rss" text="Entertainment Weekly" xmlUrl="http://feeds.ew.com/feed" />
    </outline>
    <outline type="rss" text="Standalone" xmlUrl="http://feeds.standalone.com/feed" />
  </body>
</opml>`;

// Find body
const bodyMatch = opmlData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent = bodyMatch[1];

console.log('Body Content:');
console.log('='.repeat(80));
console.log(bodyContent);
console.log('='.repeat(80));

// Find first outline
const firstOutline = bodyContent.match(/<outline[^>]*>/);
console.log('\nFirst outline tag:');
console.log(firstOutline[0]);

// Check if outline has nested content
const idx = bodyContent.indexOf(firstOutline[0]);
console.log(`\nFound at index: ${idx}`);
console.log(`Next 200 chars: ${bodyContent.substring(idx, idx + 200)}`);

// Try to parse
const result = controller.parseOPML(opmlData);
console.log('\n\nParsed Result:');
console.log(JSON.stringify(result, null, 2));
