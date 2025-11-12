const axios = require('axios');
const cheerio = require('cheerio');

const testYouTubeChannel = async () => {
  // Try both formats
  const channelTests = [
    'https://www.youtube.com/@DanasConferenceCenter',  // vanity URL format
    'https://www.youtube.com/c/DanasConferenceCenter',  // alternative vanity format
  ];

  for (const channelUrl of channelTests) {
    console.log('\n=== Testing:', channelUrl, '===');
    try {
      const response = await axios.get(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      console.log('✓ Channel accessible, status:', response.status);
      console.log('✓ Page title:', response.data.match(/<title>(.*?)<\/title>/)?.[1]);
      
      // Try to extract actual channel ID from the page
      const channelIdMatch = response.data.match(/\"channelId\":\"([^\"]+)\"/);
      if (channelIdMatch) {
        console.log('✓ Found channel ID in page:', channelIdMatch[1]);
        
        // Test RSS with this channel ID
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
        console.log('  Testing RSS URL:', rssUrl);
        try {
          const rssResponse = await axios.get(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            },
            timeout: 15000,
            responseType: 'text'
          });
          console.log('  ✓ RSS works! Status:', rssResponse.status);
          console.log('  ✓ Content length:', rssResponse.data.length);
          
          // Parse and count items
          const itemMatches = rssResponse.data.match(/<entry>/g) || [];
          const legacyItemMatches = rssResponse.data.match(/<item>/g) || [];
          const itemCount = Math.max(itemMatches.length, legacyItemMatches.length);
          console.log('  ✓ Feed items found:', itemCount);
          
          // Show first few items
          if (itemCount > 0) {
            const entries = rssResponse.data.match(/<entry>[\s\S]*?<\/entry>/g) || [];
            console.log('  ✓ First 3 items:');
            entries.slice(0, 3).forEach((entry, idx) => {
              const titleMatch = entry.match(/<title>([^<]*)<\/title>/);
              const pubMatch = entry.match(/<published>([^<]*)<\/published>/);
              const idMatch = entry.match(/<id>([^<]*)<\/id>/);
              console.log(`    ${idx + 1}. Title: ${titleMatch?.[1] || 'N/A'}`);
              console.log(`       Published: ${pubMatch?.[1] || 'N/A'}`);
              console.log(`       ID: ${idMatch?.[1]?.substring(0, 60)}...`);
            });
          }
        } catch (rssError) {
          console.log('  ✗ RSS failed:', rssError.response?.status || rssError.message);
        }
      }
    } catch (error) {
      console.log('✗ Error:', error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
      }
    }
  }
};

testYouTubeChannel().catch(console.error);
