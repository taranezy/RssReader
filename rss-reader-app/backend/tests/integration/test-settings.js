// Quick test to check settings in database
const Database = require('./database.js');
const db = new Database();

// Get the demo user or first user's settings
console.log('\n=== Testing Settings Query ===\n');

// Check if users table has any rows
const allUsers = db.db.prepare('SELECT * FROM users').all();
console.log('Users in database:', allUsers.length);
if (allUsers.length > 0) {
  allUsers.forEach(user => console.log(`  - ${user.email} (id: ${user.id})`));
}

// Get settings for first user if exists
if (allUsers.length > 0) {
  const userId = allUsers[0].id;
  console.log(`\nGetting settings for user ${userId}...`);
  const settings = db.getUserSettings(userId);
  console.log('Settings:', JSON.stringify(settings, null, 2));
} else {
  console.log('No users in database, inserting demo user...');
  const newUser = db.createUser('demo@test.com', 'demo', null);
  console.log('Created user:', newUser);
  const settings = db.getUserSettings(newUser.lastInsertRowid);
  console.log('Settings:', JSON.stringify(settings, null, 2));
}

// Also check the raw database row
console.log('\n=== Raw Database Rows ===\n');
const rawSettings = db.db.prepare('SELECT * FROM user_settings LIMIT 1').all();
console.log('Raw settings rows:', rawSettings);

db.close();
console.log('\nDone!\n');
