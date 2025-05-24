#!/usr/bin/env node

/**
 * Script to generate X (Twitter) API Bearer Token
 * 
 * Usage:
 * node scripts/generate-x-bearer-token.js YOUR_API_KEY YOUR_API_SECRET
 */

const https = require('https');

// Get API credentials from command line arguments
const [,, apiKey, apiSecret] = process.argv;

if (!apiKey || !apiSecret) {
  console.error('❌ Error: Please provide API Key and API Secret');
  console.error('Usage: node generate-x-bearer-token.js YOUR_API_KEY YOUR_API_SECRET');
  process.exit(1);
}

// Base64 encode the credentials
const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

// Prepare the request
const options = {
  hostname: 'api.twitter.com',
  path: '/oauth2/token',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
};

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.access_token) {
        console.log('\n✅ Successfully generated Bearer Token!\n');
        console.log('Bearer Token:', response.access_token);
        console.log('\n📝 Next steps:');
        console.log('1. Copy the bearer token above');
        console.log('2. Set it in Supabase:');
        console.log('   supabase secrets set X_API_BEARER_TOKEN="' + response.access_token + '"');
        console.log('\n⚠️  Keep this token secure and never commit it to version control!');
      } else {
        console.error('❌ Error: Could not generate token');
        console.error('Response:', data);
        
        if (res.statusCode === 403) {
          console.error('\n💡 Tip: Make sure your app has the correct permissions and your account has Basic tier or higher');
        }
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

// Send the request with form data
req.write('grant_type=client_credentials');
req.end();