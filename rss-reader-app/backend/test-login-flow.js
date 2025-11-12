// Test script to simulate frontend login and settings retrieval
const http = require('http');
const querystring = require('querystring');

let sessionCookie = '';

// Step 1: Demo login to get session
console.log('\n=== STEP 1: Demo Login ===');
const options1 = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/demo',
  method: 'GET'
};

const req1 = http.request(options1, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  // Capture Set-Cookie header
  if (res.headers['set-cookie']) {
    sessionCookie = res.headers['set-cookie'][0].split(';')[0];
    console.log('Session Cookie:', sessionCookie);
  }
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    
    // Step 2: Get current user to verify auth
    setTimeout(() => {
      console.log('\n=== STEP 2: Get Current User ===');
      const options2 = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/user',
        method: 'GET',
        headers: {
          'Cookie': sessionCookie
        }
      };
      
      const req2 = http.request(options2, (res) => {
        console.log('Status:', res.statusCode);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Response:', data);
          
          // Step 3: Get settings
          setTimeout(() => {
            console.log('\n=== STEP 3: Get Settings ===');
            const options3 = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/user-settings',
              method: 'GET',
              headers: {
                'Cookie': sessionCookie
              }
            };
            
            const req3 = http.request(options3, (res) => {
              console.log('Status:', res.statusCode);
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                console.log('Response:', data);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.data) {
                    console.log('\n✅ Settings received:');
                    console.log(JSON.stringify(parsed.data, null, 2));
                  }
                } catch (e) {
                  console.error('Failed to parse response');
                }
              });
            });
            
            req3.on('error', err => console.error('Request 3 error:', err.message));
            req3.end();
          }, 100);
        });
      });
      
      req2.on('error', err => console.error('Request 2 error:', err.message));
      req2.end();
    }, 100);
  });
});

req1.on('error', (error) => {
  console.error('Request 1 error:', error.message);
});

req1.end();
