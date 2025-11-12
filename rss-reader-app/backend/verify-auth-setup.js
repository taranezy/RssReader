#!/usr/bin/env node

/**
 * Production Setup Verification Script
 * Run this on your production server to verify authentication setup
 * Usage: node verify-auth-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  RSS Reader - Production Auth Setup Verification      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const checks = [];

// Check 1: .env file exists
console.log('🔍 Check 1: .env file exists');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file found\n');
  checks.push(true);
} else {
  console.log('   ✗ .env file NOT found');
  console.log('   ℹ️ Create backend/.env with required variables\n');
  checks.push(false);
}

// Check 2: Read and verify .env contents
if (fs.existsSync(envPath)) {
  console.log('🔍 Check 2: .env file contents');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });
    
    const required = ['NODE_ENV', 'FRONTEND_URL', 'SESSION_SECRET'];
    let allPresent = true;
    
    required.forEach(varName => {
      const value = envVars[varName];
      if (value) {
        const display = varName === 'SESSION_SECRET' 
          ? (value.length > 20 ? '✓ Set (long)' : '⚠ Set (short)')
          : value;
        console.log(`   ✓ ${varName}=${display}`);
      } else {
        console.log(`   ✗ ${varName} is missing`);
        allPresent = false;
      }
    });
    
    console.log();
    checks.push(allPresent);
  } catch (err) {
    console.log('   ✗ Error reading .env:', err.message, '\n');
    checks.push(false);
  }
}

// Check 3: ConfigService can load
console.log('🔍 Check 3: ConfigService loads correctly');
try {
  const ConfigService = require('./src/services/ConfigService');
  const config = new ConfigService();
  
  console.log(`   ✓ NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   ✓ isProduction: ${config.isProduction}`);
  console.log(`   ✓ FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log(`   ✓ CORS_ORIGINS: ${JSON.stringify(config.CORS_ORIGINS)}`);
  console.log(`   ✓ SESSION_SECRET: ${config.SESSION_SECRET.substring(0, 20)}...`);
  console.log();
  checks.push(true);
} catch (err) {
  console.log('   ✗ Error loading ConfigService:', err.message, '\n');
  checks.push(false);
}

// Check 4: Database exists and is readable
console.log('🔍 Check 4: Database file');
const dbPath = path.join(__dirname, 'data/rss-reader.db');
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log(`   ✓ Database found: ${(stats.size / 1024).toFixed(2)} KB\n`);
  checks.push(true);
} else {
  console.log('   ⚠ Database file not found (will be created on first run)\n');
  checks.push(true); // Not critical
}

// Check 5: Verify environment type is production
console.log('🔍 Check 5: Environment verification');
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  console.log(`   ✓ Running as production\n`);
  checks.push(true);
} else if (nodeEnv === 'development' || !nodeEnv) {
  console.log(`   ⚠ Running as development (NODE_ENV=${nodeEnv || 'not set'})`);
  console.log('   ℹ️ Add NODE_ENV=production to .env and restart\n');
  checks.push(false);
} else {
  console.log(`   ? Unknown environment: ${nodeEnv}\n`);
  checks.push(true);
}

// Summary
console.log('╔════════════════════════════════════════════════════════╗');
const passCount = checks.filter(c => c).length;
const totalCount = checks.length;
const percentage = Math.round((passCount / totalCount) * 100);

if (percentage === 100) {
  console.log('║  ✓ All checks passed! Setup is ready.                  ║');
} else if (percentage >= 80) {
  console.log('║  ⚠ Most checks passed. Review warnings above.         ║');
} else {
  console.log('║  ✗ Several issues found. Please fix above errors.     ║');
}

console.log(`║  Result: ${passCount}/${totalCount} checks passed (${percentage}%)           ║`);
console.log('╚════════════════════════════════════════════════════════╝\n');

// Next steps
console.log('Next steps:');
console.log('1. Make sure .env file has correct values');
console.log('2. Restart the backend: npm start');
console.log('3. Check browser DevTools for session cookie');
console.log('4. Check /api/health endpoint returns 200');
console.log('5. Try demo login and verify /api/auth/user works\n');

process.exit(percentage === 100 ? 0 : 1);
