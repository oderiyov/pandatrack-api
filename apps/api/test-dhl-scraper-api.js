// apps/api/test-dhl-scraper-api.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const DHLScraper = require('./src/scrapers/adapters/DHLScraper');

async function testDHLScraper() {
    console.log('=== DHL Scraper API Test ===\n');
    
    const scraper = new DHLScraper({
        baseUrl: 'https://www.dhl.com',
        rateLimit: { requests: 10, per: 60000 }
    });
    
    // Test tracking numbers
    const testNumbers = [
        '60120213284055',  // Known working number
        '31549478013000',  // Another test
    ];
    
    for (const trackingNumber of testNumbers) {
        console.log(`\n--- Testing: ${trackingNumber} ---`);
        
        try {
            const result = await scraper.scrape(trackingNumber, {
                language: 'en',
                countryCode: 'UA'
            });
            
            console.log('\n✓ Success:', result.success);
            
            if (result.success) {
                console.log('Tracking Number:', result.trackingNumber);
                console.log('Service:', result.service);
                console.log('Status:', result.status);
                console.log('Description:', result.description);
                console.log('Origin:', result.origin);
                console.log('Destination:', result.destination);
                console.log('Events:', result.events.length);
                console.log('Response Time:', result.responseTime + 'ms');
                
                // Show first 3 events
                if (result.events.length > 0) {
                    console.log('\nFirst 3 Events:');
                    result.events.slice(0, 3).forEach((event, i) => {
                        console.log(`  ${i + 1}. ${event.date}`);
                        console.log(`     Status: ${event.status}`);
                        console.log(`     Location: ${event.location || 'N/A'}`);
                    });
                }
            } else {
                console.log('✗ Error:', result.error);
            }
            
        } catch (error) {
            console.error('✗ Test failed:', error.message);
        }
        
        // Wait between tests
        if (testNumbers.indexOf(trackingNumber) < testNumbers.length - 1) {
            console.log('\nWaiting 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Show metrics
    console.log('\n=== FINAL METRICS ===');
    const metrics = scraper.getMetrics();
    console.log('Total Requests:', metrics.totalRequests);
    console.log('Successful:', metrics.successfulRequests);
    console.log('Failed:', metrics.failedRequests);
    console.log('Success Rate:', metrics.successRate);
    console.log('Avg Response Time:', metrics.averageResponseTime);
    console.log('Block Rate:', metrics.blockRate);
}

// Run test
testDHLScraper().catch(console.error);