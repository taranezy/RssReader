const axios = require('axios');

// Test the specific YouTube RSS feed that's not showing items
const testYouTubeRSSParsing = async () => {
  const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ';
  
  console.log('Testing YouTube RSS feed parsing...');
  console.log('URL:', feedUrl);
  console.log('');
  
  try {
    const response = await axios.get(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000,
      responseType: 'text'
    });
    
    console.log('✓ Feed fetched successfully');
    console.log('✓ Content length:', response.data.length, 'bytes');
    console.log('');
    
    // Parse the feed structure
    console.log('=== Feed Structure Analysis ===\n');
    
    // Check feed type (Atom vs RSS)
    const isAtom = response.data.includes('<feed') && response.data.includes('xmlns="http://www.w3.org/2005/Atom"');
    const isRSS = response.data.includes('<rss') || response.data.includes('<item>');
    
    console.log('Feed Type:');
    console.log('  - Is Atom:', isAtom);
    console.log('  - Is RSS:', isRSS);
    console.log('');
    
    // Count items/entries
    const entries = response.data.match(/<entry>/g) || [];
    const items = response.data.match(/<item>/g) || [];
    const itemCount = Math.max(entries.length, items.length);
    
    console.log('Item Count:', itemCount);
    console.log('');
    
    if (itemCount > 0) {
      console.log('=== Parsing First Entry ===\n');
      
      // Extract first entry
      let firstEntry;
      if (entries.length > 0) {
        const match = response.data.match(/<entry>([\s\S]*?)<\/entry>/);
        firstEntry = match ? match[0] : null;
      } else {
        const match = response.data.match(/<item>([\s\S]*?)<\/item>/);
        firstEntry = match ? match[0] : null;
      }
      
      if (firstEntry) {
        console.log('Full First Entry (first 2000 chars):');
        console.log(firstEntry.substring(0, 2000));
        console.log('');
        
        // Extract key fields
        const titleMatch = firstEntry.match(/<title>([^<]*)<\/title>/);
        const publishMatch = firstEntry.match(/<published>([^<]*)<\/published>/);
        const updatedMatch = firstEntry.match(/<updated>([^<]*)<\/updated>/);
        const linkMatch = firstEntry.match(/<link[^>]*href="([^"]*)"/) || firstEntry.match(/<link>([^<]*)<\/link>/);
        const authorMatch = firstEntry.match(/<author>([\s\S]*?)<\/author>/);
        const summaryMatch = firstEntry.match(/<summary[^>]*>([^<]*)<\/summary>/);
        const contentMatch = firstEntry.match(/<content[^>]*>([^<]*)<\/content>/);
        
        console.log('Parsed Fields:');
        console.log('  Title:', titleMatch?.[1] || 'NOT FOUND');
        console.log('  Published:', publishMatch?.[1] || 'NOT FOUND');
        console.log('  Updated:', updatedMatch?.[1] || 'NOT FOUND');
        console.log('  Link:', linkMatch?.[1] || 'NOT FOUND');
        console.log('  Author:', authorMatch ? 'FOUND' : 'NOT FOUND');
        console.log('  Summary:', summaryMatch ? 'FOUND' : 'NOT FOUND');
        console.log('  Content:', contentMatch ? 'FOUND' : 'NOT FOUND');
        console.log('');
        
        // Show all tags in first entry
        console.log('All XML Tags in First Entry:');
        const tags = firstEntry.match(/<[^>]+>/g) || [];
        const uniqueTags = [...new Set(tags)];
        uniqueTags.slice(0, 20).forEach(tag => {
          console.log('  ' + tag);
        });
      }
    }
    
    // Show raw XML start
    console.log('\n=== Raw Feed Start (first 1000 chars) ===\n');
    console.log(response.data.substring(0, 1000));
    
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.response) {
      console.log('✗ Status:', error.response.status);
    }
  }
};

testYouTubeRSSParsing().catch(console.error);
