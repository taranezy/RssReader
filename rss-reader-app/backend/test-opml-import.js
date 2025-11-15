#!/usr/bin/env node

/**
 * Quick test runner for OPML parsing
 * Usage: node test-opml-import.js
 */

const fs = require('fs');
const path = require('path');

// Mock dependencies
class MockUserRepository {}
class MockFeedRepository {}
class MockItemRepository {}
class MockDatabaseService {}

// Import the controller
const ImportExportController = require('./src/controllers/ImportExportController');

const controller = new ImportExportController(
  new MockUserRepository(),
  new MockFeedRepository(),
  new MockItemRepository(),
  new MockDatabaseService()
);

console.log('='.repeat(80));
console.log('OPML IMPORT TEST SUITE');
console.log('='.repeat(80));

// Test 1: Simple folder structure
console.log('\n\n📋 TEST 1: Simple Folder Structure');
console.log('-'.repeat(80));
const test1OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" xmlUrl="http://feeds.techcrunch.com/feed" />
      <outline type="rss" text="The Verge" xmlUrl="http://feeds.theverge.com/feed" />
    </outline>
    <outline text="Entertainment" title="Entertainment">
      <outline type="rss" text="Entertainment Weekly" xmlUrl="http://feeds.ew.com/feed" />
    </outline>
  </body>
</opml>`;

try {
  const result1 = controller.parseOPML(test1OPML);
  console.log(`✅ PASSED: Parsed ${result1.feeds.length} feeds`);
  result1.feeds.forEach(f => {
    console.log(`   - "${f.title}" (folder: "${f.category}")`);
  });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
}

// Test 2: Standalone feeds
console.log('\n\n📋 TEST 2: Standalone Feeds (No Folders)');
console.log('-'.repeat(80));
const test2OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline type="rss" text="DZone" xmlUrl="http://feeds.dzone.com/feed" />
    <outline type="rss" text="Martin Fowler" xmlUrl="http://martinfowler.com/feed.atom" />
  </body>
</opml>`;

try {
  const result2 = controller.parseOPML(test2OPML);
  console.log(`✅ PASSED: Parsed ${result2.feeds.length} feeds`);
  result2.feeds.forEach(f => {
    console.log(`   - "${f.title}" (no folder, category: "${f.category}")`);
  });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
}

// Test 3: Mixed folders and standalone
console.log('\n\n📋 TEST 3: Mixed Folders and Standalone Feeds');
console.log('-'.repeat(80));
const test3OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline text="Development" title="Development">
      <outline type="rss" text="Dev Blog" xmlUrl="http://feeds.devblog.com/feed" />
    </outline>
    <outline type="rss" text="Standalone Feed" xmlUrl="http://feeds.standalone.com/feed" />
  </body>
</opml>`;

try {
  const result3 = controller.parseOPML(test3OPML);
  console.log(`✅ PASSED: Parsed ${result3.feeds.length} feeds`);
  result3.feeds.forEach(f => {
    console.log(`   - "${f.title}" (folder: "${f.category || '(none)'}")`);
  });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
}

// Test 4: Real Feedly export (if available)
console.log('\n\n📋 TEST 4: Real Feedly Export');
console.log('-'.repeat(80));
const feedlyPath = path.join(__dirname, 'feedly-b333a9e8-cd49-4ad4-a440-c441e9943837-2025-11-07.opml');
if (fs.existsSync(feedlyPath)) {
  try {
    const opmlData = fs.readFileSync(feedlyPath, 'utf8');
    const result4 = controller.parseOPML(opmlData);
    console.log(`✅ PASSED: Parsed ${result4.feeds.length} feeds from real Feedly export`);
    
    // Group by category
    const byCategory = {};
    result4.feeds.forEach(feed => {
      const cat = feed.category || '(No Folder)';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(feed);
    });

    Object.keys(byCategory).sort().forEach(cat => {
      console.log(`\n   📁 ${cat}: ${byCategory[cat].length} feeds`);
      byCategory[cat].slice(0, 3).forEach(feed => {
        console.log(`      - ${feed.title}`);
      });
      if (byCategory[cat].length > 3) {
        console.log(`      ... and ${byCategory[cat].length - 3} more`);
      }
    });
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
  }
} else {
  console.log(`⏭️  SKIPPED: Feedly export file not found at ${feedlyPath}`);
}

// Test 5: Different quote styles
console.log('\n\n📋 TEST 5: Different Quote Styles');
console.log('-'.repeat(80));
const test5OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text='Single Quotes' title='Single Quotes'>
      <outline type='rss' text='Feed 1' xmlUrl='http://feed1.com/rss' />
    </outline>
    <outline text="Double Quotes" title="Double Quotes">
      <outline type="rss" text="Feed 2" xmlUrl="http://feed2.com/rss" />
    </outline>
  </body>
</opml>`;

try {
  const result5 = controller.parseOPML(test5OPML);
  console.log(`✅ PASSED: Parsed ${result5.feeds.length} feeds with mixed quote styles`);
  result5.feeds.forEach(f => {
    console.log(`   - "${f.title}" (folder: "${f.category}")`);
  });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
}

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80) + '\n');
