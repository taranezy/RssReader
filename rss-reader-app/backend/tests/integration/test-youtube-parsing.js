const axios = require('axios');

const youtubeUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ';

async function testYouTubeFeed() {
  try {
    console.log('Testing YouTube feed:', youtubeUrl);
    console.log('');

    const response = await axios.get(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
      responseType: 'text'
    });

    console.log('✓ Feed fetched successfully');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content length:', response.data.length, 'bytes');
    console.log('');

    // Check content
    const content = response.data;
    
    // Parse XML
    const xmlStart = content.includes('<?xml') ? 'Yes' : 'No';
    const hasAtom = content.includes('<feed') ? 'Yes' : 'No';
    const hasRss = content.includes('<rss') ? 'Yes' : 'No';
    const entryCount = (content.match(/<entry>/g) || []).length;
    const itemCount = (content.match(/<item>/g) || []).length;

    console.log('XML Declaration:', xmlStart);
    console.log('Has <feed> (Atom):', hasAtom);
    console.log('Has <rss>:', hasRss);
    console.log('Entry count:', entryCount);
    console.log('Item count:', itemCount);
    console.log('');

    // Parse and check first entry
    if (content.includes('<entry>')) {
      console.log('First 1500 chars of feed:');
      console.log(content.substring(0, 1500));
      console.log('...');
      console.log('');

      // Extract first entry
      const entryStart = content.indexOf('<entry>');
      const entryEnd = content.indexOf('</entry>') + 8;
      const firstEntry = content.substring(entryStart, entryEnd);

      console.log('First Entry:');
      console.log(firstEntry);
    }
  } catch (error) {
    console.error('✗ Error fetching YouTube feed:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', error.response.data.substring(0, 200));
    }
  }
}

testYouTubeFeed();
