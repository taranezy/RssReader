const RssProxyService = require('./rss-proxy');

async function testFullContent() {
  const proxy = new RssProxyService();
  
  console.log('\n=== Testing Full Article Content Extraction ===\n');
  
  try {
    console.log('Converting politika.rs with full article content...');
    console.log('This will fetch and extract content from each article page');
    console.log('(This may take 10-30 seconds depending on number of articles)\n');
    
    const result = await proxy.convertHtmlToRss('https://www.politika.rs/');
    
    console.log(`\n✓ Conversion successful!`);
    console.log(`RSS feed size: ${result.length} bytes`);
    
    // Check if content is enriched (look for multiple items with substantial text)
    const itemCount = (result.match(/<item>/g) || []).length;
    const hasLongDescriptions = (result.match(/<description>.{500,}<\/description>/g) || []).length;
    
    console.log(`✓ Number of items: ${itemCount}`);
    console.log(`✓ Items with substantial content: ${hasLongDescriptions}`);
    
    // Show a sample item
    const itemMatch = result.match(/<item>[\s\S]*?<\/item>/);
    if (itemMatch) {
      console.log('\n--- Sample Article Item ---');
      console.log(itemMatch[0].substring(0, 800) + '...\n');
    }
    
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
}

testFullContent();
