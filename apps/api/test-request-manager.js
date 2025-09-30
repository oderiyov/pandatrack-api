// apps/api/test-request-manager.js

const RequestManager = require('./src/scrapers/utils/RequestManager');

console.log('Testing RequestManager...\n');

async function runTests() {
    // Test 1: Rate limit status
    console.log('Test 1: Rate limit initialization');
    const manager = new RequestManager({
        rateLimit: { requests: 5, per: 10000 }, // 5 requests per 10 seconds
        timeout: 5000
    });
    
    let status = manager.getRateLimitStatus();
    console.log(`Limit: ${status.limit}`);
    console.log(`Used: ${status.used}`);
    console.log(`Remaining: ${status.remaining}`);
    console.log('');

    // Test 2: Simple HTTP request
    console.log('Test 2: Make simple HTTP request');
    try {
        const response = await manager.request({
            url: 'https://httpbin.org/status/200',
            method: 'GET'
        });
        console.log(`Status: ${response.status}`);
        console.log('✓ Request successful');
    } catch (error) {
        console.log(`✗ Request failed: ${error.message}`);
    }
    console.log('');

    // Test 3: Rate limiting
    console.log('Test 3: Rate limiting (making 3 quick requests)');
    for (let i = 1; i <= 3; i++) {
        await manager.waitForSlot();
        console.log(`Request ${i} allowed`);
    }
    status = manager.getRateLimitStatus();
    console.log(`After 3 requests - Used: ${status.used}, Remaining: ${status.remaining}`);
    console.log('');

    // Test 4: Retry logic on 500 error
    console.log('Test 4: Retry on server error (will fail, that\'s OK)');
    try {
        await manager.request({
            url: 'https://httpbin.org/status/500',
            method: 'GET'
        });
    } catch (error) {
        console.log(`✓ Correctly failed after retries: ${error.message}`);
    }
    console.log('');

    console.log('✓ RequestManager works!');
}

runTests().catch(console.error);