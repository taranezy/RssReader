/**
 * Debug the actual OPML parsing with your real structure
 */
const fs = require('fs');
const path = require('path');

// Your actual OPML structure
const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test</title>
  </head>
  <body>
    <outline text="Scrum and Planing" title="Scrum and Planing">
      <outline type="rss" text="dzone.com: latest front page" title="dzone.com: latest front page" xmlUrl="http://feeds.dzone.com/dzone/frontpage" htmlUrl="https://dzone.com"/>
      <outline type="rss" text="Mike Cohn's Blog – Succeeding With Agile® RSS Feed" title="Mike Cohn's Blog – Succeeding With Agile® RSS Feed" xmlUrl="http://www.mountaingoatsoftware.com/blog/rss" htmlUrl="https://www.mountaingoatsoftware.com/blog/"/>
    </outline>
  </body>
</opml>`;

console.log('\n=== DEBUGGING OPML PARSING ===\n');

// Extract body
const bodyMatch = xmlData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

console.log('Body content length:', bodyContent.length);
console.log('\nBody content:');
console.log(bodyContent);
console.log('\n---\n');

const feeds = [];

const processOutlines = (xml, parentFolder = '', level = 0) => {
  const indent = '  '.repeat(level);
  console.log(`${indent}[Level ${level}] Processing with parentFolder: "${parentFolder}"\n`);
  
  let i = 0;
  const xmlLength = xml.length;
  
  while (i < xmlLength) {
    // Find next opening outline tag
    const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
    if (!openMatch) {
      console.log(`${indent}[Level ${level}] No more outline tags found. Breaking.`);
      break;
    }

    const openTagStart = i + openMatch.index;
    const openTag = openMatch[0];
    const openTagEnd = openTagStart + openTag.length;

    console.log(`${indent}[Level ${level}] Found opening tag at position ${openTagStart}:`);
    console.log(`${indent}  Tag: ${openTag.substring(0, 80)}${openTag.length > 80 ? '...' : ''}`);

    // Check if self-closing
    const isSelfClosing = openTag.endsWith('/>');
    console.log(`${indent}  Self-closing: ${isSelfClosing}`);

    if (isSelfClosing) {
      // Self-closing tag - must be a feed
      console.log(`${indent}  → Treating as FEED (self-closing)`);
      const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
      const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
      
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        const title = textMatch ? textMatch[1] : 'Untitled Feed';
        
        const feed = {
          title: title,
          url: url,
          category: parentFolder
        };

        feeds.push(feed);
        console.log(`${indent}  ✅ Added feed: "${feed.title}" in category: "${feed.category}"`);
      }

      i = openTagEnd;
    } else {
      // Non-self-closing tag - find matching </outline>
      console.log(`${indent}  → Non-self-closing, searching for matching closing tag...`);
      
      let closeTagIndex = -1;
      let nestLevel = 0;
      let searchPos = openTagEnd;

      while (searchPos < xmlLength) {
        const nextOpen = xml.indexOf('<outline', searchPos);
        const nextClose = xml.indexOf('</outline>', searchPos);

        console.log(`${indent}    nextOpen: ${nextOpen}, nextClose: ${nextClose}, nestLevel: ${nestLevel}`);

        if (nextClose === -1) {
          console.log(`${indent}    No closing tag found!`);
          break;
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Another opening tag before closing
          const openTagEndMatch = xml.substring(nextOpen).match(/^\<outline[^>]*>/);
          const tagIsSelfClosing = openTagEndMatch && openTagEndMatch[0].endsWith('/>');
          
          console.log(`${indent}    Found nested opening at ${nextOpen}, self-closing: ${tagIsSelfClosing}`);
          
          if (openTagEndMatch && !tagIsSelfClosing) {
            nestLevel++;
            console.log(`${indent}    Incremented nestLevel to ${nestLevel}`);
          }
          searchPos = nextOpen + 8;
        } else {
          // Found a closing tag
          if (nestLevel === 0) {
            closeTagIndex = nextClose;
            console.log(`${indent}    Found matching closing tag at ${closeTagIndex}`);
            break;
          } else {
            nestLevel--;
            console.log(`${indent}    Decremented nestLevel to ${nestLevel}`);
            searchPos = nextClose + 10;
          }
        }
      }

      if (closeTagIndex !== -1) {
        const content = xml.substring(openTagEnd, closeTagIndex);
        
        const hasNestedOutline = /<outline\s/.test(content);
        const isFeedTag = /type\s*=\s*["']rss["']/i.test(openTag);

        console.log(`${indent}  Content length: ${content.length}`);
        console.log(`${indent}  Has nested outline: ${hasNestedOutline}`);
        console.log(`${indent}  Is RSS feed tag: ${isFeedTag}`);

        if (isFeedTag) {
          console.log(`${indent}  → Treating as FEED (type="rss")`);
          const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
          const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          
          if (urlMatch && urlMatch[1]) {
            const feed = {
              title: textMatch ? textMatch[1] : 'Untitled Feed',
              url: urlMatch[1],
              category: parentFolder
            };

            feeds.push(feed);
            console.log(`${indent}  ✅ Added feed: "${feed.title}" in category: "${feed.category}"`);
          }
        } else if (hasNestedOutline) {
          // This is a folder
          const folderNameMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          const folderName = folderNameMatch ? folderNameMatch[1] : 'Uncategorized';
          
          console.log(`${indent}  → Treating as FOLDER: "${folderName}"`);
          console.log(`${indent}  → Recursing with parentFolder: "${folderName}"\n`);
          
          // Recursively process nested outlines
          processOutlines(content, folderName, level + 1);
        } else if (!isFeedTag) {
          // No type attribute and no nested outlines
          const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
          if (urlMatch && urlMatch[1]) {
            const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
            const feed = {
              title: textMatch ? textMatch[1] : 'Untitled Feed',
              url: urlMatch[1],
              category: parentFolder
            };

            feeds.push(feed);
            console.log(`${indent}  ✅ Added feed (no type): "${feed.title}" in category: "${feed.category}"`);
          }
        }

        i = closeTagIndex + 10; // Move past </outline>
      } else {
        console.log(`${indent}  Could not find closing tag!`);
        i = openTagEnd;
      }
    }
    
    console.log('');
  }
};

processOutlines(bodyContent);

console.log('\n=== RESULT ===\n');
console.log(`Found ${feeds.length} feeds:\n`);
feeds.forEach(f => {
  console.log(`  - "${f.title}"`);
  console.log(`    URL: ${f.url}`);
  console.log(`    Category: "${f.category || '(none)'}"\n`);
});
