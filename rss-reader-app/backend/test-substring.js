const xml = `
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" xmlUrl="http://feeds.techcrunch.com/feed" />
    </outline>
`;

console.log('XML:', JSON.stringify(xml));
console.log('\nXML length:', xml.length);

// Find first <outline
const match = xml.match(/<outline\s[^>]*>/);
console.log('\nFirst <outline match:', match[0]);
console.log('Match index:', xml.indexOf(match[0]));
console.log('Match length:', match[0].length);

const idx = xml.indexOf(match[0]);
const endPos = idx + match[0].length;

console.log('\nSubstring from endPos:');
console.log(JSON.stringify(xml.substring(endPos, endPos + 150)));
