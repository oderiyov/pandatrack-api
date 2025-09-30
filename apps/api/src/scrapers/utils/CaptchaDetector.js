// apps/api/src/scrapers/utils/CaptchaDetector.js

/**
 * Detects CAPTCHA and blocking mechanisms
 */
class CaptchaDetector {
    constructor() {
        this.blockingPatterns = [
            /captcha/i,
            /recaptcha/i,
            /hcaptcha/i,
            /cloudflare/i,
            /ray id/i,
            /cf-ray/i,
            /access denied/i,
            /forbidden/i,
            /security check/i,
            /verification required/i,
            /suspicious activity/i,
            /blocked/i,
            /bot detected/i,
            /доступ заборонено/i,
            /перевірка безпеки/i,
            /підозріла активність/i
        ];
        
        this.captchaPatterns = [
            /recaptcha/i,
            /hcaptcha/i,
            /captcha-box/i,
            /g-recaptcha/i
        ];
    }

    check(response) {
        const result = {
            isBlocked: false,
            isCaptcha: false,
            reason: null,
            type: null,
            confidence: 0
        };
        
        // Check HTTP status
        if (response.status === 403) {
            result.isBlocked = true;
            result.reason = 'HTTP 403 Forbidden';
            result.type = 'http_status';
            result.confidence = 0.8;
        }
        
        if (response.status === 429) {
            result.isBlocked = true;
            result.reason = 'HTTP 429 Too Many Requests';
            result.type = 'rate_limit';
            result.confidence = 1.0;
            return result;
        }
        
        // Check response body
        const html = typeof response.data === 'string' ? 
                     response.data : JSON.stringify(response.data);
        
        // Check for CAPTCHA
        for (const pattern of this.captchaPatterns) {
            if (pattern.test(html)) {
                result.isBlocked = true;
                result.isCaptcha = true;
                result.reason = 'CAPTCHA detected';
                result.type = 'captcha';
                result.confidence = 0.95;
                return result;
            }
        }
        
        // Check for other blocking
        for (const pattern of this.blockingPatterns) {
            if (pattern.test(html)) {
                result.isBlocked = true;
                result.reason = 'Blocking pattern detected';
                result.type = 'content_block';
                result.confidence = 0.7;
                return result;
            }
        }
        
        // Check for Cloudflare challenge
        if (html.includes('cf-challenge-running') || 
            html.includes('jschl-answer')) {
            result.isBlocked = true;
            result.reason = 'Cloudflare challenge detected';
            result.type = 'cloudflare';
            result.confidence = 0.9;
            return result;
        }
        
        return result;
    }

    analyzeBlockingTrend(recentAttempts) {
        const blocked = recentAttempts.filter(a => a.isBlocked).length;
        const total = recentAttempts.length;
        
        if (total === 0) return { trend: 'unknown', blockRate: 0 };
        
        const blockRate = (blocked / total) * 100;
        
        return {
            trend: blockRate > 20 ? 'high' : blockRate > 5 ? 'medium' : 'low',
            blockRate: blockRate.toFixed(2),
            recommendation: this.getRecommendation(blockRate)
        };
    }

    getRecommendation(blockRate) {
        if (blockRate > 20) {
            return 'CRITICAL: Consider rotating IPs or reducing request frequency';
        }
        if (blockRate > 5) {
            return 'WARNING: Increase delays between requests';
        }
        return 'OK: Continue monitoring';
    }
}

module.exports = CaptchaDetector;