// Simulate browser DOMParser behavior with Node.js
const { JSDOM } = require('jsdom');

const youtubeXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>yt:video:j31dmodZ-5c</id>
    <yt:videoId>j31dmodZ-5c</yt:videoId>
    <title>The Problem with this Humanoid Robot</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=j31dmodZ-5c"/>
    <published>2025-10-30T01:46:49+00:00</published>
    <media:group>
      <media:title>The Problem with this Humanoid Robot</media:title>
      <media:description>Rant. We have a problem.</media:description>
      <media:thumbnail url="https://i3.ytimg.com/vi/j31dmodZ-5c/hqdefault.jpg"/>
    </media:group>
  </entry>
</feed>`;

// Test with browser-like DOMParser
const { DOMParser } = new JSDOM('').window;

const parser = new DOMParser();
const xmlDoc = parser.parseFromString(youtubeXml, 'text/xml');

const entries = xmlDoc.querySelectorAll('entry');
console.log('Entries found:', entries.length);
console.log('');

entries.forEach((entry, idx) => {
  console.log(`Entry ${idx}:`);
  
  const title = entry.querySelector('title')?.textContent;
  console.log('  Title:', title);

  // Try various selectors
  console.log('  Testing selectors:');
  
  let desc1 = entry.querySelector('summary')?.textContent;
  console.log('    - querySelector("summary"):', desc1 ? 'FOUND' : 'NOT FOUND');
  
  let desc2 = entry.querySelector('media\\:group media\\:description')?.textContent;
  console.log('    - querySelector("media\\:group media\\:description"):', desc2 ? 'FOUND' : 'NOT FOUND');
  
  let desc3 = entry.querySelector('media\\:description')?.textContent;
  console.log('    - querySelector("media\\:description"):', desc3 ? 'FOUND' : 'NOT FOUND');
  
  const mediaGroup = entry.querySelector('media\\:group');
  console.log('    - querySelector("media\\:group"):', mediaGroup ? 'FOUND' : 'NOT FOUND');
  
  if (mediaGroup) {
    const desc4 = mediaGroup.querySelector('media\\:description')?.textContent;
    console.log('    - mediaGroup.querySelector("media\\:description"):', desc4 ? 'FOUND: ' + desc4 : 'NOT FOUND');
    
    // List all children
    console.log('    - mediaGroup children:');
    Array.from(mediaGroup.children).forEach(child => {
      console.log(`      ${child.nodeName}: ${child.textContent?.substring(0, 30)}`);
    });
  }

  // Try raw text parsing
  const serializer = new (require('jsdom').window.XMLSerializer)();
  const entryXml = serializer.serializeToString(entry);
  const descMatch = entryXml.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/);
  console.log('    - Raw XML regex parse:', descMatch ? 'FOUND: ' + descMatch[1].substring(0, 30) : 'NOT FOUND');
});
