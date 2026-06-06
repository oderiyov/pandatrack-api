// apps/api/src/scrapers/utils/HeaderGenerator.js

/**
 * Generates realistic browser headers для anti-detection
 */
class HeaderGenerator {
    constructor() {
        this.languages = [
            'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
            'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7',
            'en-US,en;q=0.9,uk;q=0.8',
            'en-US,en;q=0.9',
            'uk,en-US;q=0.9,en;q=0.8'
        ];
    }

    generate(options = {}) {
        const userAgent = options.userAgent || this.getDefaultUA();
        const referer = options.referer || null;
        
        const headers = {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': this.getRandomLanguage(),
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1'
        };
        
        if (referer) {
            headers['Referer'] = referer;
        }
        
        if (userAgent.includes('Chrome')) {
            headers['sec-ch-ua'] = this.getChromeSecChUa();
            headers['sec-ch-ua-mobile'] = userAgent.includes('Mobile') ? '?1' : '?0';
            headers['sec-ch-ua-platform'] = this.getPlatform(userAgent);
        }
        
        return {
            ...headers,
            ...options.customHeaders
        };
    }

    getDefaultUA() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    }

    getRandomLanguage() {
        return this.languages[Math.floor(Math.random() * this.languages.length)];
    }

    getChromeSecChUa() {
        return '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"';
    }

    getPlatform(userAgent) {
        if (userAgent.includes('Windows')) return '"Windows"';
        if (userAgent.includes('Macintosh')) return '"macOS"';
        if (userAgent.includes('Linux')) return '"Linux"';
        if (userAgent.includes('Android')) return '"Android"';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return '"iOS"';
        return '"Unknown"';
    }

    generatePostHeaders(options = {}) {
        const headers = this.generate(options);
        
        return {
            ...headers,
            'Content-Type': options.contentType || 'application/x-www-form-urlencoded',
            'Origin': options.origin,
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        };
    }
}

module.exports = HeaderGenerator;