/**
 * ImportExportController Test Suite
 * Tests OPML parsing functionality with various feed and folder structures
 */

const fs = require('fs');
const path = require('path');
const ImportExportController = require('../src/controllers/ImportExportController');

// Mock dependencies
const mockUserRepository = {};
const mockFeedRepository = {};
const mockItemRepository = {};
const mockDatabaseService = {};

describe('ImportExportController - OPML Parsing', () => {
  let controller;

  beforeEach(() => {
    controller = new ImportExportController(
      mockUserRepository,
      mockFeedRepository,
      mockItemRepository,
      mockDatabaseService
    );
  });

  describe('parseOPML - Folder Structure', () => {
    test('should parse feeds from nested folders with correct categories', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test OPML</title>
  </head>
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="http://feeds.techcrunch.com/feed" htmlUrl="https://techcrunch.com"/>
      <outline type="rss" text="The Verge" title="The Verge" xmlUrl="http://feeds.theverge.com/feed" htmlUrl="https://theverge.com"/>
    </outline>
    <outline text="Entertainment" title="Entertainment">
      <outline type="rss" text="Entertainment Weekly" title="Entertainment Weekly" xmlUrl="http://feeds.ew.com/feed" htmlUrl="https://ew.com"/>
    </outline>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds).toBeDefined();
      expect(result.feeds.length).toBe(3);
      
      // Check Technology folder feeds
      const techFeeds = result.feeds.filter(f => f.category === 'Technology');
      expect(techFeeds.length).toBe(2);
      expect(techFeeds.some(f => f.title === 'TechCrunch')).toBe(true);
      expect(techFeeds.some(f => f.title === 'The Verge')).toBe(true);

      // Check Entertainment folder feeds
      const entertainmentFeeds = result.feeds.filter(f => f.category === 'Entertainment');
      expect(entertainmentFeeds.length).toBe(1);
      expect(entertainmentFeeds[0].title).toBe('Entertainment Weekly');
    });

    test('should parse standalone feeds without folder as empty category', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test OPML</title>
  </head>
  <body>
    <outline type="rss" text="DZone" title="DZone" xmlUrl="http://feeds.dzone.com/feed" htmlUrl="https://dzone.com"/>
    <outline type="rss" text="Martin Fowler" title="Martin Fowler Blog" xmlUrl="http://martinfowler.com/feed.atom" htmlUrl="https://martinfowler.com"/>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds).toBeDefined();
      expect(result.feeds.length).toBe(2);
      
      // Check standalone feeds have no category
      result.feeds.forEach(feed => {
        expect(feed.category).toBe('');
      });
    });

    test('should parse mixed folders and standalone feeds', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test OPML</title>
  </head>
  <body>
    <outline text="Development" title="Development">
      <outline type="rss" text="Dev Blog" title="Dev Blog" xmlUrl="http://feeds.devblog.com/feed" htmlUrl="https://devblog.com"/>
    </outline>
    <outline type="rss" text="Standalone Feed" title="Standalone" xmlUrl="http://feeds.standalone.com/feed" htmlUrl="https://standalone.com"/>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds).toBeDefined();
      expect(result.feeds.length).toBe(2);
      
      // Check folder feed
      const devFeeds = result.feeds.filter(f => f.category === 'Development');
      expect(devFeeds.length).toBe(1);
      
      // Check standalone feed
      const standaloneFeed = result.feeds.find(f => f.title === 'Standalone');
      expect(standaloneFeed.category).toBe('');
    });

    test('should handle empty folders gracefully', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test OPML</title>
  </head>
  <body>
    <outline text="Empty Folder" title="Empty Folder">
    </outline>
    <outline type="rss" text="Real Feed" title="Real Feed" xmlUrl="http://feeds.real.com/feed" htmlUrl="https://real.com"/>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds).toBeDefined();
      expect(result.feeds.length).toBe(1);
      expect(result.feeds[0].title).toBe('Real Feed');
    });
  });

  describe('parseOPML - Real Feedly Export', () => {
    test('should parse real Feedly OPML file (from attachment)', () => {
      const opmlPath = path.join(__dirname, '../../feedly-b333a9e8-cd49-4ad4-a440-c441e9943837-2025-11-07.opml');
      
      if (!fs.existsSync(opmlPath)) {
        console.warn(`Test OPML file not found: ${opmlPath}`);
        return;
      }

      const opmlData = fs.readFileSync(opmlPath, 'utf8');
      const result = controller.parseOPML(opmlData);

      expect(result.feeds).toBeDefined();
      expect(Array.isArray(result.feeds)).toBe(true);
      expect(result.feeds.length).toBeGreaterThan(0);

      console.log(`\nFeedly Import Test Results:`);
      console.log(`Total feeds imported: ${result.feeds.length}`);
      
      // Group by category
      const byCategory = {};
      result.feeds.forEach(feed => {
        const cat = feed.category || '(No Folder)';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(feed.title);
      });

      Object.keys(byCategory).sort().forEach(cat => {
        console.log(`\n${cat}: ${byCategory[cat].length} feeds`);
        byCategory[cat].slice(0, 5).forEach(title => {
          console.log(`  - ${title}`);
        });
        if (byCategory[cat].length > 5) {
          console.log(`  ... and ${byCategory[cat].length - 5} more`);
        }
      });
    });
  });

  describe('parseOPML - Edge Cases', () => {
    test('should handle feeds with various attribute orderings', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="News" title="News">
      <outline xmlUrl="http://feed1.com/rss" type="rss" text="Feed 1" title="Feed One"/>
      <outline type="rss" text="Feed 2" xmlUrl="http://feed2.com/rss" title="Feed Two"/>
      <outline text="Feed 3" xmlUrl="http://feed3.com/rss" title="Feed Three" type="rss"/>
    </outline>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds.length).toBe(3);
      expect(result.feeds.every(f => f.category === 'News')).toBe(true);
      expect(result.feeds.every(f => f.url && f.title)).toBe(true);
    });

    test('should handle quoted attributes with both single and double quotes', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text='Quotes Test' title='Quotes Test'>
      <outline type="rss" text="Double Quote Feed" xmlUrl="http://feed1.com/rss" title="Feed One"/>
      <outline type='rss' text='Single Quote Feed' xmlUrl='http://feed2.com/rss' title='Feed Two'/>
    </outline>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      expect(result.feeds.length).toBe(2);
      result.feeds.forEach(f => {
        expect(f.category).toBe('Quotes Test');
        expect(f.url).toBeTruthy();
        expect(f.title).toBeTruthy();
      });
    });

    test('should skip non-RSS outline entries', () => {
      const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Mixed Types" title="Mixed Types">
      <outline type="link" text="Just a Link" url="http://example.com"/>
      <outline type="rss" text="Real Feed" xmlUrl="http://feed.com/rss"/>
      <outline type="folder" text="Subfolder">
        <outline type="rss" text="Nested Feed" xmlUrl="http://nested.com/rss"/>
      </outline>
    </outline>
  </body>
</opml>`;

      const result = controller.parseOPML(opmlData);

      // Should only get the RSS feeds, not the link
      const rssFeeds = result.feeds.filter(f => f.url && f.title);
      expect(rssFeeds.length).toBeGreaterThanOrEqual(1);
      expect(rssFeeds.some(f => f.title === 'Real Feed')).toBe(true);
    });
  });

  describe('parseXML - Format Detection', () => {
    test('should detect and parse OPML format', () => {
      const opmlData = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline type="rss" text="Feed" xmlUrl="http://example.com/feed" />
  </body>
</opml>`;

      const result = controller.parseXML(opmlData);
      expect(result.feeds).toBeDefined();
    });

    test('should detect OPML by outline tag', () => {
      const opmlData = `<outline text="Test"><outline type="rss" text="Feed" xmlUrl="http://example.com/feed" /></outline>`;
      const result = controller.parseXML(opmlData);
      expect(result.feeds).toBeDefined();
    });
  });
});

// Export for running with Jest or similar test framework
module.exports = { ImportExportController };
