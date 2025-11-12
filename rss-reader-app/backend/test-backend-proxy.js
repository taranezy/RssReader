const axios = require('axios');

// Test the backend proxy directly
const testBackendProxy = async () => {
  const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-jUrloU__VG513KmWT5ttA';
  const backendProxyUrl = `http://localhost:3000/api/proxy/fetch-feed?url=${encodeURIComponent(feedUrl)}`;
  
  console.log('Testing backend proxy at:', backendProxyUrl);
  console.log('');
  
  try {
    const response = await axios.get(backendProxyUrl, {
      timeout: 30000,
      responseType: 'text'
    });
    
    console.log('✓ Backend response status:', response.status);
    console.log('✓ Content-Type:', response.headers['content-type']);
    console.log('✓ Content length:', response.data.length, 'bytes');
    
    // Count items
    const entries = response.data.match(/<entry>/g) || [];
    const items = response.data.match(/<item>/g) || [];
    const itemCount = Math.max(entries.length, items.length);
    
    console.log('✓ Feed items found:', itemCount);
    
    if (itemCount > 0) {
      const allItems = entries.length > 0 ? response.data.match(/<entry>[\s\S]*?<\/entry>/g) || [] : response.data.match(/<item>[\s\S]*?<\/item>/g) || [];
      console.log('\n=== First 5 Items ===\n');
      allItems.slice(0, 5).forEach((item, idx) => {
        const titleMatch = item.match(/<title>([^<]*)<\/title>/);
        const pubMatch = item.match(/<published>([^<]*)<\/published>/) || item.match(/<pubDate>([^<]*)<\/pubDate>/);
        console.log(`${idx + 1}. Title: ${titleMatch?.[1] || 'N/A'}`);
        console.log(`   Published: ${pubMatch?.[1] || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠ No items found in backend response');
      console.log('First 500 chars:');
      console.log(response.data.substring(0, 500));
    }
    
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.response) {
      console.log('✗ Status:', error.response.status);
      console.log('✗ Response:', error.response.data?.substring?.(0, 200) || error.response.data);
    }
  }
};

testBackendProxy().catch(console.error);
