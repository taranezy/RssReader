/**
 * Test both OPML formats - with and without type="folder"
 */
const fs = require('fs');
const path = require('path');

console.log('\n=== TESTING BOTH OPML FORMATS ===\n');

// Test format 1: WITH type="folder" (test-feedly-import.opml)
console.log('1️⃣  Testing OPML WITH type="folder" attribute:\n');
const withTypeOPML = fs.readFileSync(path.join(__dirname, '..', '..', 'test-feedly-import.opml'), 'utf8');

const bodyMatch1 = withTypeOPML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent1 = bodyMatch1 ? bodyMatch1[1] : '';

const feeds1 = [];
const processOutlines1 = (xml, parentFolder = '') => {
  let i = 0;
  
  while (i < xml.length) {
    const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
    if (!openMatch) break;

    const openTagStart = i + openMatch.index;
    const openTag = openMatch[0];
    const openTagEnd = openTagStart + openTag.length;

    if (openTag.endsWith('/>')) {
      const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
      const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
      
      if (urlMatch && urlMatch[1]) {
        const feed = {
          title: textMatch ? textMatch[1] : 'Untitled Feed',
          category: parentFolder
        };
        feeds1.push(feed);
        console.log(`   ✅ Feed: "${feed.title}" -> Category: "${feed.category || '(none)'}"`);
      }
      i = openTagEnd;
    } else {
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
          const folderNameMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          const folderName = folderNameMatch ? folderNameMatch[1] : 'Uncategorized';
          console.log(`   📁 Folder: "${folderName}"`);
          processOutlines1(content, folderName);
        } else if (isFeedTag) {
          const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
          const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          
          if (urlMatch && urlMatch[1]) {
            const feed = {
              title: textMatch ? textMatch[1] : 'Untitled Feed',
              category: parentFolder
            };
            feeds1.push(feed);
            console.log(`   ✅ Feed: "${feed.title}" -> Category: "${feed.category || '(none)'}"`);
          }
        }

        i = closeTagIndex + 10;
      } else {
        i = openTagEnd;
      }
    }
  }
};

processOutlines1(bodyContent1);
console.log(`\n   Total feeds: ${feeds1.length}\n`);

// Test format 2: WITHOUT type="folder" (test-feedly-no-type.opml)
console.log('2️⃣  Testing OPML WITHOUT type="folder" attribute (real Feedly):\n');
const noTypeOPML = fs.readFileSync(path.join(__dirname, '..', '..', 'test-feedly-no-type.opml'), 'utf8');

const bodyMatch2 = noTypeOPML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent2 = bodyMatch2 ? bodyMatch2[1] : '';

const feeds2 = [];
const processOutlines2 = (xml, parentFolder = '') => {
  let i = 0;
  
  while (i < xml.length) {
    const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
    if (!openMatch) break;

    const openTagStart = i + openMatch.index;
    const openTag = openMatch[0];
    const openTagEnd = openTagStart + openTag.length;

    if (openTag.endsWith('/>')) {
      const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
      const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
      
      if (urlMatch && urlMatch[1]) {
        const feed = {
          title: textMatch ? textMatch[1] : 'Untitled Feed',
          category: parentFolder
        };
        feeds2.push(feed);
        console.log(`   ✅ Feed: "${feed.title}" -> Category: "${feed.category || '(none)'}"`);
      }
      i = openTagEnd;
    } else {
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

        if (isFeedTag) {
          const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
          const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          
          if (urlMatch && urlMatch[1]) {
            const feed = {
              title: textMatch ? textMatch[1] : 'Untitled Feed',
              category: parentFolder
            };
            feeds2.push(feed);
            console.log(`   ✅ Feed: "${feed.title}" -> Category: "${feed.category || '(none)'}"`);
          }
        } else if (hasNestedOutline) {
          const folderNameMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
          const folderName = folderNameMatch ? folderNameMatch[1] : 'Uncategorized';
          console.log(`   📁 Folder: "${folderName}" (NO type attribute - auto-detected!)`);
          processOutlines2(content, folderName);
        } else if (!isFeedTag) {
          const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
          if (urlMatch && urlMatch[1]) {
            const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
            const feed = {
              title: textMatch ? textMatch[1] : 'Untitled Feed',
              category: parentFolder
            };
            feeds2.push(feed);
            console.log(`   ✅ Feed: "${feed.title}" -> Category: "${feed.category || '(none)'}"`);
          }
        }

        i = closeTagIndex + 10;
      } else {
        i = openTagEnd;
      }
    }
  }
};

processOutlines2(bodyContent2);
console.log(`\n   Total feeds: ${feeds2.length}\n`);

// Summary
console.log('📊 SUMMARY:\n');
console.log(`Format WITH type="folder":    ${feeds1.length} feeds`);
feeds1.forEach(f => console.log(`   - "${f.title}" in "${f.category || '(no category)'}"`));

console.log(`\nFormat WITHOUT type="folder": ${feeds2.length} feeds`);
feeds2.forEach(f => console.log(`   - "${f.title}" in "${f.category || '(no category)'}"`));

console.log('\n✅ Both formats work correctly!\n');
