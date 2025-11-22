const axios = require('axios');
const cheerio = require('cheerio');

const testYouTubeChannel = async () => {
  const channelUrl = 'https://www.youtube.com/@DanasConferenceCenter';
  
  console.log('Testing YouTube channel:', channelUrl);
  console.log('');
  
  try {
    const response = await axios.get(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    console.log('✓ Channel page loaded');
    const pageData = response.data;
    
    // Method 1: Look for channelId in initial data
    let channelId = null;
    
    // Try to find channelId in the initial data JSON
    const idMatch = pageData.match(/"channelId":"([^"]+)"/);
    if (idMatch) {
      channelId = idMatch[1];
      console.log('✓ Found channel ID (method 1):', channelId);
    }
    
    // Method 2: Look for browseId (alternative)
    if (!channelId) {
      const browseMatch = pageData.match(/"browseId":"([^"]+)"/);
      if (browseMatch && browseMatch[1].startsWith('UC')) {
        channelId = browseMatch[1];
        console.log('✓ Found channel ID (method 2):', channelId);
      }
    }
    
    // Method 3: Extract from meta tags
    if (!channelId) {
      const $ = cheerio.load(pageData);
      const ogUrl = $('meta[property="og:url"]').attr('content');
      console.log('  og:url:', ogUrl);
      const metaMatch = pageData.match(/externalId":"([^"]+)"/);
      if (metaMatch) {
        channelId = metaMatch[1];
        console.log('✓ Found channel ID (method 3):', channelId);
      }
    }
    
    // Debug: Show all occurrences of channel-like strings
    if (!channelId) {
      console.log('\n⚠ Could not find standard channel ID. Searching for UC-prefixed IDs...');
      const ucMatches = pageData.match(/UC[A-Za-z0-9_-]{21}[AQww]/g);
      if (ucMatches) {
        const uniqueIds = [...new Set(ucMatches)];
        console.log('Found potential channel IDs:', uniqueIds.slice(0, 5));
        channelId = uniqueIds[0];
      }
    }
    
    if (channelId) {
      console.log('\n=== Testing RSS Feed ===\n');
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      console.log('RSS URL:', rssUrl);
      
      try {
        const rssResponse = await axios.get(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 15000,
          responseType: 'text'
        });
        
        console.log('✓ RSS Status:', rssResponse.status);
        console.log('✓ Content length:', rssResponse.data.length, 'bytes');
        
        // Parse and count items
        const entries = rssResponse.data.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        const items = rssResponse.data.match(/<item>[\s\S]*?<\/item>/g) || [];
        const itemCount = Math.max(entries.length, items.length);
        
        console.log('✓ Feed items found:', itemCount);
        
        if (itemCount > 0) {
          const allItems = entries.length > 0 ? entries : items;
          console.log('\n=== First 5 Items ===\n');
          allItems.slice(0, 5).forEach((item, idx) => {
            const titleMatch = item.match(/<title>([^<]*)<\/title>/);
            const pubMatch = item.match(/<published>([^<]*)<\/published>/) || item.match(/<pubDate>([^<]*)<\/pubDate>/);
            const linkMatch = item.match(/<link href="([^"]*)"/) || item.match(/<link>([^<]*)<\/link>/);
            
            console.log(`${idx + 1}. Title: ${titleMatch?.[1] || 'N/A'}`);
            console.log(`   Published: ${pubMatch?.[1] || 'N/A'}`);
            console.log(`   Link: ${linkMatch?.[1] || 'N/A'}`);
            console.log('');
          });
        } else {
          console.log('\n⚠ No items found in feed');
          console.log('First 500 chars of response:');
          console.log(rssResponse.data.substring(0, 500));
        }
      } catch (rssError) {
        console.log('✗ RSS Error:', rssError.message);
        if (rssError.response) {
          console.log('✗ Status:', rssError.response.status);
          console.log('✗ Response:', rssError.response.data?.substring(0, 200));
        }
      }
    } else {
      console.log('\n✗ Could not extract channel ID from page');
      console.log('Page analysis:');
      console.log('- Length:', pageData.length);
      console.log('- Contains "channelId":', pageData.includes('channelId'));
      console.log('- Contains "browseId":', pageData.includes('browseId'));
    }
    
  } catch (error) {
    console.log('✗ Error loading channel:', error.message);
  }
};

testYouTubeChannel().catch(console.error);
