// apps/api/test-scraper-core.js

const ScraperCore = require('./src/scrapers/ScraperCore');

console.log('Testing ScraperCore...\n');

async function runTests() {
    // Create test scraper
    const scraper = new ScraperCore({
        name: 'TestScraper',
        baseUrl: 'https://httpbin.org',
        rateLimit: { requests: 5, per: 10000 },
        timeout: 10000
    });
    
    console.log('Test 1: Initial metrics');
    let metrics = scraper.getMetrics();
    console.log(`Total requests: ${metrics.totalRequests}`);
    console.log(`Success rate: ${metrics.successRate}`);
    console.log('');

    console.log('Test 2: Make successful request');
    try {
        const response = await scraper.makeRequest('https://httpbin.org/html');
        console.log(`Status: ${response.status}`);
        console.log(`Content length: ${response.data.length} bytes`);
        console.log('✓ Request successful');
    } catch (error) {
        console.log(`✗ Request failed: ${error.message}`);
    }
    console.log('');

    console.log('Test 3: Parse HTML');
    const html = '<html><body><div class="test">Hello World</div></body></html>';
    const $ = scraper.parseHTML(html);
    const text = $('.test').text();
    console.log(`Parsed text: "${text}"`);
    console.log('');

    console.log('Test 4: Random delay distribution (5 samples)');
    for (let i = 1; i <= 5; i++) {
        const delay = scraper.gaussianRandom(2000, 5000);
        console.log(`  ${i}. ${delay}ms`);
    }
    console.log('');

    console.log('Test 5: Final metrics');
    metrics = scraper.getMetrics();
    console.log(`Total requests: ${metrics.totalRequests}`);
    console.log(`Successful: ${metrics.successfulRequests}`);
    console.log(`Success rate: ${metrics.successRate}`);
    console.log(`Average response time: ${metrics.averageResponseTime}`);
    console.log('');

    console.log('✓ ScraperCore works!');
}

runTests().catch(console.error);