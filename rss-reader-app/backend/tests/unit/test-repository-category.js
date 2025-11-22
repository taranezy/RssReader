/**
 * Direct test of FeedRepository.addFeed with category
 */
const FeedRepository = require('./src/services/FeedRepository');
const Database = require('./database');

console.log('\n=== TESTING FeedRepository.addFeed WITH CATEGORY ===\n');

const db = new Database();
const feedRepository = new FeedRepository(db);

// Test data
const userId = 1;
const feedData = {
  url: 'https://example.com/test-' + Date.now(),
  title: 'Test Feed from Repository',
  description: 'Testing category preservation',
  category: 'Development',  // THE KEY FIELD!
  color: '#00AA00'
};

console.log('Adding feed with:');
console.log(`  URL: ${feedData.url}`);
console.log(`  Title: ${feedData.title}`);
console.log(`  Category: "${feedData.category}"`);
console.log('');

try {
  const result = feedRepository.addFeed(userId, feedData);
  
  console.log('✅ Feed created!\n');
  console.log('Feed object returned:');
  console.log(`  ID: ${result.id}`);
  console.log(`  Title: ${result.title}`);
  console.log(`  URL: ${result.url}`);
  console.log(`  Category: "${result.category || '(empty)'}"`);
  
  if (result.category === 'Development') {
    console.log('\n✅ SUCCESS! Category preserved in repository!');
  } else {
    console.log('\n❌ FAILED! Category not preserved!');
  }
  
  // Now check database
  console.log('\nVerifying in database...');
  const fromDb = db.getFeedById(result.id, userId);
  console.log(`  Category in DB: "${fromDb.category || '(empty)'}"`);
  
  if (fromDb.category === 'Development') {
    console.log('\n✅ SUCCESS! Category saved to database!');
  } else {
    console.log('\n❌ FAILED! Category not in database!');
  }
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
}

console.log('\n=== END TEST ===\n');

db.close();
