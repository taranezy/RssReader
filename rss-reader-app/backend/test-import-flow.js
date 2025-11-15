/**
 * Test the full import flow to see where categories are lost
 */
const fs = require('fs');
const path = require('path');

// Read the database module
const Database = require('./database');

// Initialize database
const db = new Database();

// Read the test OPML file (using no-type version to test real Feedly structure)
const testOPMLPath = path.join(__dirname, '..', '..', 'test-feedly-no-type.opml');
const xmlData = fs.readFileSync(testOPMLPath, 'utf8');

console.log('\n=== TESTING IMPORT FLOW ===\n');

// Simulating the ImportExportController parseOPML method
console.log('1. Parsing OPML...\n');

const bodyMatch = xmlData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

const feeds = [];

const processOutlines = (xml, parentFolder = '') => {
  let i = 0;
  
  while (i < xml.length) {
    const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
    if (!openMatch) break;

    const openTagStart = i + openMatch.index;
    const openTag = openMatch[0];
    const openTagEnd = openTagStart + openTag.length;

    if (openTag.endsWith('/>')) {
      // Self-closing tag - feed
      const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
      const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
      
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        const title = textMatch ? textMatch[1] : 'Untitled Feed';
        
        const feed = {
          id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: url,
          title: title || 'Untitled Feed',
          description: '',
          color: '#4ECDC4',
          category: parentFolder,  // THIS IS SET HERE
          addedDate: new Date().toISOString(),
          items: []
        };

        feeds.push(feed);
        console.log(`   Added feed: "${feed.title}" with category: "${feed.category}"`);
      }

      i = openTagEnd;
    } else {
      // Non-self-closing tag - folder
      let closeTagIndex = -1;
      let nestLevel = 0;
      let searchPos = openTagEnd;

      while (searchPos < xml.length) {
        const nextOpen = xml.indexOf('<outline', searchPos);
        const nextClose = xml.indexOf('</outline>', searchPos);

        if (nextClose === -1) break;

        if (nextOpen !== -1 && nextOpen < nextClose) {
          const openTagEndMatch = xml.substring(nextOpen).match(/^\<outline[^>]*>/);
          if (openTagEndMatch && !openTagEndMatch[0].endsWith('/>')) {
            nestLevel++;
          }
          searchPos = nextOpen + 8;
        } else {
          if (nestLevel === 0) {
            closeTagIndex = nextClose;
            break;
          } else {
            nestLevel--;
            searchPos = nextClose + 10;
          }
        }
      }

      if (closeTagIndex !== -1) {
        const content = xml.substring(openTagEnd, closeTagIndex);
        
        const hasNestedOutline = /<outline\s/.test(content);
        const isFeedTag = /type\s*=\s*["']rss["']/i.test(openTag);

        if (!isFeedTag && hasNestedOutline) {
          // Folder
          const folderNameMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          const folderName = folderNameMatch ? folderNameMatch[1] : 'Uncategorized';
          console.log(`   Processing folder: "${folderName}"`);
          processOutlines(content, folderName);
        }

        i = closeTagIndex + 10;
      } else {
        i = openTagEnd;
      }
    }
  }
};

processOutlines(bodyContent);

console.log(`\n2. Parsed ${feeds.length} feeds with categories:\n`);
feeds.forEach(f => {
  console.log(`   - ${f.title} | Category: "${f.category}"`);
});

console.log(`\n3. Now simulating importData insertion into database...\n`);

// Simulate the importData flow
const userId = 1; // Test user
let feedsImported = 0;

for (const feedData of feeds) {
  try {
    const feed = {
      id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: feedData.url,
      title: feedData.title,
      description: feedData.description || '',
      color: feedData.color || '#4ECDC4',
      category: feedData.category || '',  // THIS IS SET HERE TOO
      isActive: true,
      addedDate: feedData.addedDate || new Date().toISOString()
    };

    console.log(`   Creating feed: "${feed.title}" with category: "${feed.category}"`);
    db.createFeed(feed, userId);
    feedsImported++;
  } catch (error) {
    console.error(`   ERROR creating feed: ${error.message}`);
  }
}

console.log(`\n4. Verifying feeds in database...\n`);

const allFeeds = db.db.prepare(`
  SELECT id, title, category FROM rss_feeds WHERE user_id = ? ORDER BY title
`).all(userId);

console.log(`Found ${allFeeds.length} feeds in database:\n`);
allFeeds.forEach(f => {
  console.log(`   - ${f.title} | Category: "${f.category}"`);
});

console.log('\n=== END TEST ===\n');

db.close();
