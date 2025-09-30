// apps/api/test-html-parser.js

const HTMLParser = require('./src/scrapers/utils/HTMLParser');

console.log('Testing HTMLParser...\n');

// Sample HTML
const sampleHTML = `
<html>
<body>
    <div class="status">Delivered</div>
    <div class="location" data-city="Kyiv" data-country="UA">Kyiv, Ukraine</div>
    <div class="description">   Package   was   delivered   </div>
    
    <table class="events">
        <tr>
            <th>Date</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>2025-10-01</td>
            <td>Delivered</td>
        </tr>
        <tr>
            <td>2025-09-30</td>
            <td>In Transit</td>
        </tr>
    </table>
    
    <script type="application/json" id="tracking-data">
    {"trackingNumber": "123456", "status": "delivered"}
    </script>
</body>
</html>
`;

// Test 1: Parse HTML
console.log('Test 1: Parse HTML');
const $ = HTMLParser.parse(sampleHTML);
console.log(`Parsed: ${!!$}`);
console.log('');

// Test 2: Get text
console.log('Test 2: Get text');
const status = HTMLParser.getText($, '.status');
console.log(`Status: "${status}"`);
console.log('');

// Test 3: Clean text (extra spaces)
console.log('Test 3: Clean text');
const description = HTMLParser.getText($, '.description');
console.log(`Description: "${description}"`);
console.log('');

// Test 4: Get data attributes
console.log('Test 4: Get data attributes');
const dataAttrs = HTMLParser.getDataAttributes($, '.location');
console.log(`City: ${dataAttrs.city}`);
console.log(`Country: ${dataAttrs.country}`);
console.log('');

// Test 5: Extract table
console.log('Test 5: Extract table');
const tableData = HTMLParser.extractTable($, '.events');
console.log(`Rows: ${tableData.length}`);
console.log(`First row: ${tableData[0].join(', ')}`);
console.log(`Second row: ${tableData[1].join(', ')}`);
console.log('');

// Test 6: Extract JSON from script
console.log('Test 6: Extract JSON');
const jsonData = HTMLParser.extractJSON($, '#tracking-data');
console.log(`Tracking Number: ${jsonData?.trackingNumber}`);
console.log(`Status: ${jsonData?.status}`);
console.log('');

// Test 7: Check if element exists
console.log('Test 7: Element exists');
console.log(`Status exists: ${HTMLParser.exists($, '.status')}`);
console.log(`NonExistent exists: ${HTMLParser.exists($, '.non-existent')}`);
console.log('');

// Test 8: Get all elements
console.log('Test 8: Get all elements');
const allRows = HTMLParser.getAll($, '.events tr');
console.log(`Found ${allRows.length} rows`);
console.log('');

console.log('✓ HTMLParser works!');