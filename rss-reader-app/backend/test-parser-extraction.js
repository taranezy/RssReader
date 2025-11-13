const axios = require('axios');

// Simulate what the frontend parser would do
const youtubeUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ';

async function testParserLogic() {
  try {
    const response = await axios.get(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
      responseType: 'text'
    });

    const xmlContent = response.data;
    console.log('✓ Feed fetched');
    console.log('');

    // Create a simple DOM parser simulation (like the browser would do)
    // We'll check the structure manually
    const entryStart = xmlContent.indexOf('<entry>');
    const entryEnd = xmlContent.indexOf('</entry>', entryStart) + 8;
    const firstEntry = xmlContent.substring(entryStart, entryEnd);

    console.log('First Entry XML:');
    console.log(firstEntry);
    console.log('');

    // Check what we can find
    console.log('Extraction Check:');
    
    // Check for summary tag
    const summaryMatch = firstEntry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    console.log('- <summary> tag found:', summaryMatch ? 'YES' : 'NO');
    if (summaryMatch) {
      console.log('  Content:', summaryMatch[1].substring(0, 100));
    }

    // Check for media:description
    const mediaDescMatch = firstEntry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/);
    console.log('- <media:description> tag found:', mediaDescMatch ? 'YES' : 'NO');
    if (mediaDescMatch) {
      console.log('  Content:', mediaDescMatch[1].substring(0, 100));
    }

    // Check for media:group structure
    const mediaGroupMatch = firstEntry.match(/<media:group>([\s\S]*?)<\/media:group>/);
    console.log('- <media:group> tag found:', mediaGroupMatch ? 'YES' : 'NO');
    if (mediaGroupMatch) {
      const mediaGroupContent = mediaGroupMatch[1];
      const nestedDescMatch = mediaGroupContent.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/);
      console.log('- <media:description> inside <media:group>:', nestedDescMatch ? 'YES' : 'NO');
      if (nestedDescMatch) {
        console.log('  Content:', nestedDescMatch[1].substring(0, 100));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParserLogic();
