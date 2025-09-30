// apps/api/test-headers.js

const UserAgentPool = require('./src/scrapers/utils/UserAgentPool');
const HeaderGenerator = require('./src/scrapers/utils/HeaderGenerator');

console.log('Testing HeaderGenerator...\n');

const uaPool = new UserAgentPool();
const headerGen = new HeaderGenerator();

// Test 1: Basic headers
console.log('Test 1: Basic headers');
const ua1 = uaPool.getRandom();
const headers1 = headerGen.generate({ userAgent: ua1 });
console.log(`User-Agent: ${headers1['User-Agent'].substring(0, 60)}...`);
console.log(`Accept-Language: ${headers1['Accept-Language']}`);
console.log(`Has sec-ch-ua: ${!!headers1['sec-ch-ua']}`);
console.log('');

// Test 2: Headers with referer
console.log('Test 2: Headers with referer');
const headers2 = headerGen.generate({ 
    userAgent: ua1,
    referer: 'https://www.dhl.com'
});
console.log(`Referer: ${headers2['Referer']}`);
console.log(`Sec-Fetch-Site: ${headers2['Sec-Fetch-Site']}`);
console.log('');

// Test 3: POST headers
console.log('Test 3: POST headers');
const postHeaders = headerGen.generatePostHeaders({
    userAgent: ua1,
    origin: 'https://www.dhl.com',
    contentType: 'application/json'
});
console.log(`Content-Type: ${postHeaders['Content-Type']}`);
console.log(`Origin: ${postHeaders['Origin']}`);
console.log('');

console.log('✓ HeaderGenerator works!');