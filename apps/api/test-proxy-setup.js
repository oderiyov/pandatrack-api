// apps/api/test-proxy-setup.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const ProxyManager = require('./src/scrapers/utils/ProxyManager');
const RequestManager = require('./src/scrapers/utils/RequestManager');

async function testProxySetup() {
    console.log('=== Proxy Setup Test ===\n');
    
    // Test 1: ProxyManager initialization
    console.log('Test 1: ProxyManager initialization');
    const proxyManager = new ProxyManager();
    const stats = proxyManager.getStats();
    
    console.log('Stats:', stats);
    
    if (!stats.enabled) {
        console.log('⚠️  Proxies disabled. Set USE_PROXIES=true in .env');
        return;
    }
    
    if (stats.totalProxies === 0) {
        console.log('⚠️  No proxies configured. Add PROXY_LIST to .env');
        return;
    }
    
    console.log(`✓ Loaded ${stats.totalProxies} proxies\n`);
    
    // Test 2: Test all proxies connectivity
    console.log('Test 2: Testing proxy connectivity...');
    const testResults = await proxyManager.testAll();
    
    console.log('\nResults:');
    console.log(`Total: ${testResults.total}`);
    console.log(`Working: ${testResults.working}`);
    console.log(`Failed: ${testResults.failed}\n`);
    
    testResults.results.forEach((result, i) => {
        if (result.working) {
            console.log(`✓ Proxy ${i + 1}: Working (IP: ${result.ip})`);
        } else {
            console.log(`✗ Proxy ${i + 1}: Failed (${result.error})`);
        }
    });
    
    if (testResults.working === 0) {
        console.log('\n❌ No working proxies found!');
        return;
    }
    
    // Test 3: Test RequestManager with proxy
    console.log('\n\nTest 3: RequestManager with proxy rotation');
    const requestManager = new RequestManager({
        timeout: 15000,
        rateLimit: { requests: 5, per: 60000 }
    });
    
    console.log('Making 3 requests to httpbin.org/ip...\n');
    
    for (let i = 1; i <= 3; i++) {
        try {
            const response = await requestManager.request('https://httpbin.org/ip', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`Request ${i}:`);
            console.log(`  Status: ${response.status}`);
            console.log(`  IP: ${response.data.origin}`);
            console.log(`  Proxy working: ✓\n`);
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.log(`Request ${i}: Failed`);
            console.log(`  Error: ${error.message}\n`);
        }
    }
    
    // Test 4: Proxy stats
    console.log('Test 4: Final proxy statistics');
    const finalStats = requestManager.getProxyStats();
    console.log('Stats:', finalStats);
    
    console.log('\n=== Test Complete ===');
}

// Run test
testProxySetup().catch(console.error);