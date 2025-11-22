// Comprehensive test of the settings loading flow
const Database = require('./database.js');

console.log('\n=== COMPREHENSIVE SETTINGS FLOW TEST ===\n');

const db = new Database();

try {
  // 1. Check database has users
  console.log('1. Checking database for users...');
  const allUsers = db.db.prepare('SELECT id, email FROM users').all();
  if (allUsers.length === 0) {
    console.error('   ✗ NO USERS IN DATABASE!');
    console.log('   Creating test user...');
    const user = db.createUser('test@example.com', 'testuser', null);
    console.log('   ✓ Created user with ID:', user.lastInsertRowid);
  } else {
    console.log('   ✓ Found', allUsers.length, 'users');
    allUsers.forEach(u => console.log(`     - ${u.email} (id: ${u.id})`));
  }

  // 2. Get first user
  const testUser = db.db.prepare('SELECT id, email FROM users LIMIT 1').get();
  if (!testUser) {
    console.error('   ✗ Could not get any user');
    process.exit(1);
  }

  console.log('\n2. Testing with user:', testUser.email, '(id:', testUser.id, ')');

  // 3. Check user_settings table
  console.log('\n3. Checking user_settings table...');
  const userSettings = db.db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(testUser.id);
  if (!userSettings) {
    console.error('   ✗ NO SETTINGS FOUND FOR USER!');
    console.log('   Creating default settings...');
    db.db.prepare(`
      INSERT INTO user_settings (user_id, font, show_left_menu, show_feed_images, header_color, dark_mode, enable_pip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testUser.id, 'default', 1, 1, 'purple', 0, 1);
    console.log('   ✓ Created default settings');
  } else {
    console.log('   ✓ Found settings:');
    console.log('     Raw DB values:', JSON.stringify(userSettings, null, 2));
  }

  // 4. Test getUserSettings method (old database.js)
  console.log('\n4. Testing getUserSettings() method...');
  const settings = db.getUserSettings(testUser.id);
  console.log('   Returned:', JSON.stringify(settings, null, 2));

  // 5. Check for boolean logic errors
  console.log('\n5. Checking boolean values...');
  let hasErrors = false;
  if (typeof settings.showLeftMenu !== 'boolean') {
    console.error('   ✗ showLeftMenu is', typeof settings.showLeftMenu, '(should be boolean)');
    hasErrors = true;
  } else {
    console.log('   ✓ showLeftMenu is boolean:', settings.showLeftMenu);
  }

  if (typeof settings.showFeedImages !== 'boolean') {
    console.error('   ✗ showFeedImages is', typeof settings.showFeedImages, '(should be boolean)');
    hasErrors = true;
  } else {
    console.log('   ✓ showFeedImages is boolean:', settings.showFeedImages);
  }

  if (typeof settings.darkMode !== 'boolean') {
    console.error('   ✗ darkMode is', typeof settings.darkMode, '(should be boolean)');
    hasErrors = true;
  } else {
    console.log('   ✓ darkMode is boolean:', settings.darkMode);
  }

  if (typeof settings.enablePIP !== 'boolean') {
    console.error('   ✗ enablePIP is', typeof settings.enablePIP, '(should be boolean)');
    hasErrors = true;
  } else {
    console.log('   ✓ enablePIP is boolean:', settings.enablePIP);
  }

  // 6. Check the response format the controller would return
  console.log('\n6. Simulating SettingsController response format...');
  const controllerResponse = {
    success: true,
    data: settings
  };
  console.log('   Would return:', JSON.stringify(controllerResponse, null, 2));

  // 7. Test extractData() logic
  console.log('\n7. Testing extractData() logic...');
  function extractData(response) {
    return response?.data !== undefined ? response.data : response;
  }
  const extracted = extractData(controllerResponse);
  console.log('   After extractData():', JSON.stringify(extracted, null, 2));

  // Final status
  console.log('\n' + (hasErrors ? '❌' : '✅') + ' TEST COMPLETE');
  if (hasErrors) {
    console.log('   ERRORS FOUND - Boolean conversion is failing!');
  } else {
    console.log('   All checks passed - Settings flow should work!');
  }

} catch (error) {
  console.error('ERROR:', error.message);
  console.error(error.stack);
} finally {
  db.close();
  console.log('\n');
}
