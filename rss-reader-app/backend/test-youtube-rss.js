const axios = require('axios');

const testYouTubeRSS = async () => {
  const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJ1X_WBt-7DW-yEtNpamZZw';
  
  console.log('Testing YouTube RSS endpoint...');
  console.log('URL:', url);
  console.log('');
  
  // Test 1: With minimal User-Agent
  try {
    console.log('Test 1: With Mozilla User-Agent');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
      responseType: 'text'
    });
    console.log('✓ Status:', response.status);
    console.log('✓ Content length:', response.data.length);
    console.log('✓ Is RSS:', response.data.includes('<rss'));
    console.log('✓ First 200 chars:', response.data.substring(0, 200));
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.response) {
      console.log('✗ Status Code:', error.response.status);
      console.log('✗ Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
  
  console.log('\n---\n');
  
  // Test 2: With no User-Agent
  try {
    console.log('Test 2: With no User-Agent');
    const response = await axios.get(url, {
      timeout: 15000,
      responseType: 'text'
    });
    console.log('✓ Status:', response.status);
    console.log('✓ Content length:', response.data.length);
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.response) {
      console.log('✗ Status Code:', error.response.status);
    }
  }

  console.log('\n---\n');
  
  // Test 3: Direct channel ID (alternative format if available)
  const altUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJ1X_WBt-7DW-yEtNpamZZw';
  try {
    console.log('Test 3: Alternative fetch with detailed headers');
    const response = await axios.head(altUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000
    });
    console.log('✓ HEAD Status:', response.status);
    console.log('✓ Headers:', JSON.stringify(response.headers, null, 2));
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.response) {
      console.log('✗ HEAD Status Code:', error.response.status);
      console.log('✗ Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
};

testYouTubeRSS().catch(console.error);
