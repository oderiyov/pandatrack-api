// apps/api/test-ua-pool.js

const UserAgentPool = require('./src/scrapers/utils/UserAgentPool');

console.log('Testing UserAgentPool...\n');

const pool = new UserAgentPool();

console.log(`Pool size: ${pool.size()}`);
console.log('\nGetting 5 random UAs:');

for (let i = 0; i < 5; i++) {
    const ua = pool.getRandom();
    console.log(`${i + 1}. ${ua.substring(0, 80)}...`);
}

console.log('\n✓ UserAgentPool works!');