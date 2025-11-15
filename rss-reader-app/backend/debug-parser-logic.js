#!/usr/bin/env node

const opmlData = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" xmlUrl="http://feeds.techcrunch.com/feed" />
    </outline>
  </body>
</opml>`;

const bodyMatch = opmlData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent = bodyMatch[1];

console.log('Body:', bodyContent);
console.log('\n');

// Manually trace through the parser logic
let i = 0;
const xml = bodyContent;

const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
console.log('Found opening tag:', openMatch[0]);

const openTag = openMatch[0];
console.log('Is self-closing?', openTag.endsWith('/>'));
console.log('Tag does NOT end with />, so looking for closing tag...\n');

// Find closing tag
const openTagEnd = openMatch[0].length;
console.log('Content after tag:', xml.substring(openTagEnd, openTagEnd + 150));

// Find </outline>
const closeIdx = xml.indexOf('</outline>');
console.log('\nClosing tag at:', closeIdx);
const content = xml.substring(openTagEnd, closeIdx);
console.log('Content between tags:');
console.log(content);

// Check for nested outline
console.log('\nChecking for nested <outline:');
const hasNested = /<outline\s/.test(content);
console.log('Has nested outline?', hasNested);

// Check if it's a feed
const isFeed = /type\s*=\s*["']rss["']/i.test(openTag);
console.log('Is marked as RSS feed?', isFeed);

console.log('\nLogic: isFeed =', isFeed, 'hasNested =', hasNested);
console.log('If isFeed && !hasNested -> add as feed');
console.log('Else if hasNested -> treat as folder');
