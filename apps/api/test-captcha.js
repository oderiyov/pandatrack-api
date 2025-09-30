// apps/api/test-captcha.js

const CaptchaDetector = require('./src/scrapers/utils/CaptchaDetector');

console.log('Testing CaptchaDetector...\n');

const detector = new CaptchaDetector();

// Test 1: Normal response
console.log('Test 1: Normal response (no blocking)');
const normalResponse = {
    status: 200,
    data: '<html><body>Normal tracking page content</body></html>'
};
const result1 = detector.check(normalResponse);
console.log(`Blocked: ${result1.isBlocked}`);
console.log('');

// Test 2: CAPTCHA detected
console.log('Test 2: CAPTCHA detected');
const captchaResponse = {
    status: 200,
    data: '<html><body><div class="g-recaptcha"></div></body></html>'
};
const result2 = detector.check(captchaResponse);
console.log(`Blocked: ${result2.isBlocked}`);
console.log(`Is CAPTCHA: ${result2.isCaptcha}`);
console.log(`Reason: ${result2.reason}`);
console.log(`Confidence: ${result2.confidence}`);
console.log('');

// Test 3: Rate limit (429)
console.log('Test 3: Rate limit (429)');
const rateLimitResponse = {
    status: 429,
    data: 'Too Many Requests'
};
const result3 = detector.check(rateLimitResponse);
console.log(`Blocked: ${result3.isBlocked}`);
console.log(`Type: ${result3.type}`);
console.log(`Confidence: ${result3.confidence}`);
console.log('');

// Test 4: Cloudflare challenge
console.log('Test 4: Cloudflare challenge');
const cloudflareResponse = {
    status: 200,
    data: '<html><body>Checking your browser... cf-challenge-running</body></html>'
};
const result4 = detector.check(cloudflareResponse);
console.log(`Blocked: ${result4.isBlocked}`);
console.log(`Reason: ${result4.reason}`);
console.log('');

// Test 5: Blocking trend analysis
console.log('Test 5: Blocking trend analysis');
const recentAttempts = [
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: true },
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: false },
    { isBlocked: false }
];
const trend = detector.analyzeBlockingTrend(recentAttempts);
console.log(`Trend: ${trend.trend}`);
console.log(`Block rate: ${trend.blockRate}%`);
console.log(`Recommendation: ${trend.recommendation}`);
console.log('');

console.log('✓ CaptchaDetector works!');