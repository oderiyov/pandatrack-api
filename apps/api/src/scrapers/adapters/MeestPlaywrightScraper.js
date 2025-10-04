// apps/api/src/scrapers/adapters/MeestPlaywrightScraper.js

const PlaywrightScraperCore = require('../PlaywrightScraperCore');

/**
 * MeestPlaywrightScraper - Browser-based scraping для Meest Express
 * 
 * Використовує Playwright для обходу anti-bot захисту:
 * - Full JavaScript rendering
 * - Realistic browser fingerprint
 * - Cookie handling
 * - Human-like behavior
 */
class MeestPlaywrightScraper extends PlaywrightScraperCore {
    constructor(config = {}) {
        super({
            name: 'MeestPlaywrightScraper',
            baseUrl: 'https://ua.meest.com',
            timeout: 60000, // 45s для browser operations
            headless: config.headless !== false,
            deviceEmulation: config.deviceEmulation || 'desktop',
            useProxies: config.useProxies !== false,
            rateLimit: {
                requests: 3, // Conservative для browser
                per: 120000  // 3 requests per 2 minutes
            },
            ...config
        });
        
        this.trackingUrl = 'https://ua.meest.com/uk/tracking';
        
        console.log('MeestPlaywrightScraper initialized with browser automation');
    }

    /**
     * Main scraping method
     */
    async scrape(trackingNumber, options = {}) {
        console.log(`[MeestPlaywrightScraper] Starting browser scrape for ${trackingNumber}`);
        
        const startTime = Date.now();
        let page = null;

        try {
            // Rate limiting
            await this.checkRateLimit();

            // Init browser if needed
            await this.initBrowser();
            await this.createContext();
            
            page = await this.createPage();

            // Navigate to tracking page
            const trackingUrlWithNumber = `${this.trackingUrl}?number=${encodeURIComponent(trackingNumber)}&lang=uk`;
            
            await this.navigateWithRetry(page, trackingUrlWithNumber, {
                waitUntil: 'networkidle',
                retries: 2
            });

            try {
                await this.waitForCloudflare(page, 30000);
            } catch (cfError) {
                console.warn(`[${this.name}] Cloudflare challenge not completed, trying anyway...`);
            }

            await this.delay(3000);

            // Check if blocked
            if (await this.isPageBlocked(page)) {
                throw new Error('Page blocked by Meest anti-bot system');
            }

            // Wait for tracking data to load
            const trackingData = await this.extractTrackingData(page, trackingNumber);

            // Update metrics
            this.updateMetrics(true, Date.now() - startTime);

            return {
                ...trackingData,
                source: 'playwright',
                browser: 'chromium'
            };

        } catch (error) {
            this.updateMetrics(false, Date.now() - startTime);
            
            console.error(`[MeestPlaywrightScraper] Scraping failed:`, error.message);
            
            // Save screenshot for debugging
            if (page) {
                try {
                    await page.screenshot({ 
                        path: `./debug-meest-${trackingNumber}-${Date.now()}.png` 
                    });
                } catch (screenshotError) {
                    // Ignore screenshot errors
                }
            }

            return {
                error: error.message,
                trackingNumber
            };

        } finally {
            if (page) {
                await page.close().catch(() => {});
            }
            
            // Close browser після кожного scrape для економії ресурсів
            await this.close();
        }
    }

    /**
     * Extract tracking data from page
     */
    async extractTrackingData(page, trackingNumber) {
        console.log(`[MeestPlaywrightScraper] Extracting tracking data...`);

        // Wait for one of the possible selectors (flexible approach)
        try {
            await page.waitForSelector('.tracking-info, .tracking-events, .shipment-details, [class*="track"]', {
                timeout: 15000
            });
        } catch (error) {
            // Check if "not found" message
            const notFoundSelectors = [
                'text=/не знайдено/i',
                'text=/not found/i',
                'text=/номер невірний/i'
            ];

            for (const selector of notFoundSelectors) {
                const notFound = await page.locator(selector).count();
                if (notFound > 0) {
                    throw new Error('Tracking number not found on Meest website');
                }
            }

            throw new Error('Tracking data failed to load');
        }

        // Extract current status
        const status = await this.extractStatus(page);

        // Extract events
        const events = await this.extractEvents(page);

        // Extract estimated delivery (if available)
        const estimatedDelivery = await this.extractEstimatedDelivery(page);

        // Validate extracted data
        if (!events || events.length === 0) {
            throw new Error('No tracking events found');
        }

        return {
            trackingNumber,
            status: status || 'Unknown',
            statusCode: null,
            lastUpdate: events.length > 0 ? events[events.length - 1].date : new Date().toISOString(),
            events: events,
            estimatedDelivery: estimatedDelivery
        };
    }

    /**
     * Extract current status
     */
    async extractStatus(page) {
        const statusSelectors = [
            '.tracking-status',
            '.shipment-status',
            '[class*="status-current"]',
            '[class*="shipment-info"] .status',
            'h2[class*="status"]',
            'div[class*="status"] span'
        ];

        for (const selector of statusSelectors) {
            try {
                const statusElement = page.locator(selector).first();
                const count = await statusElement.count();
                
                if (count > 0) {
                    const statusText = await statusElement.textContent();
                    if (statusText && statusText.trim()) {
                        console.log(`[MeestPlaywrightScraper] Status found:`, statusText.trim());
                        return statusText.trim();
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return 'Unknown';
    }

    /**
     * Extract tracking events
     */
    async extractEvents(page) {
        console.log(`[MeestPlaywrightScraper] Extracting events...`);
        
        const events = [];

        // Strategy 1: Table rows
        const tableRows = page.locator('.tracking-events tr, .history-table tr, table[class*="track"] tr');
        const rowCount = await tableRows.count();
        
        console.log(`[MeestPlaywrightScraper] Found ${rowCount} table rows`);

        for (let i = 0; i < rowCount; i++) {
            try {
                const row = tableRows.nth(i);
                
                // Skip header rows
                const hasHeader = await row.locator('th').count();
                if (hasHeader > 0) continue;

                const cells = row.locator('td');
                const cellCount = await cells.count();

                if (cellCount >= 2) {
                    const date = await cells.nth(0).textContent();
                    const status = await cells.nth(1).textContent();
                    const location = cellCount > 2 ? await cells.nth(2).textContent() : '';

                    if (date && status && date.trim() && status.trim()) {
                        events.push({
                            date: this.parseDate(date.trim()),
                            status: status.trim(),
                            description: status.trim(),
                            location: location.trim(),
                            statusCode: null
                        });
                    }
                }
            } catch (error) {
                console.warn(`[MeestPlaywrightScraper] Error parsing row ${i}:`, error.message);
                continue;
            }
        }

        // Strategy 2: Event items (div/li structure) - якщо table не знайдено
        if (events.length === 0) {
            const eventItems = page.locator('.tracking-event, .history-item, [class*="event-item"], [class*="timeline-item"]');
            const itemCount = await eventItems.count();
            
            console.log(`[MeestPlaywrightScraper] Found ${itemCount} event items`);

            for (let i = 0; i < itemCount; i++) {
                try {
                    const item = eventItems.nth(i);

                    const date = await item.locator('.event-date, .date, [class*="date"]').first().textContent().catch(() => '');
                    const status = await item.locator('.event-status, .status, [class*="status"]').first().textContent().catch(() => '');
                    const location = await item.locator('.event-location, .location, [class*="location"]').first().textContent().catch(() => '');

                    if (date && status && date.trim() && status.trim()) {
                        events.push({
                            date: this.parseDate(date.trim()),
                            status: status.trim(),
                            description: status.trim(),
                            location: location.trim(),
                            statusCode: null
                        });
                    }
                } catch (error) {
                    console.warn(`[MeestPlaywrightScraper] Error parsing item ${i}:`, error.message);
                    continue;
                }
            }
        }

        console.log(`[MeestPlaywrightScraper] Extracted ${events.length} events`);
        return events;
    }

    /**
     * Extract estimated delivery
     */
    async extractEstimatedDelivery(page) {
        const deliverySelectors = [
            '[class*="estimated"]',
            '[class*="delivery-date"]',
            '[class*="expected"]',
            'text=/очікувана дата/i',
            'text=/estimated delivery/i'
        ];

        for (const selector of deliverySelectors) {
            try {
                const element = page.locator(selector).first();
                const count = await element.count();
                
                if (count > 0) {
                    const text = await element.textContent();
                    if (text && text.trim()) {
                        const parsedDate = this.parseDate(text.trim());
                        if (parsedDate) {
                            return parsedDate;
                        }
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return null;
    }

    /**
     * Parse date from various formats
     */
    parseDate(dateString) {
        if (!dateString) return null;
        
        try {
            // Format 1: DD.MM.YYYY HH:MM
            const ddmmyyyyMatch = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
            if (ddmmyyyyMatch) {
                const [, day, month, year, hour, minute] = ddmmyyyyMatch;
                return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
            }
            
            // Format 2: YYYY-MM-DD HH:MM:SS
            const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
            if (isoMatch) {
                return new Date(dateString).toISOString();
            }
            
            // Format 3: Спроба стандартного Date.parse
            const parsed = new Date(dateString);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
            
            return null;
            
        } catch (error) {
            console.warn(`[MeestPlaywrightScraper] Date parse error: ${dateString}`, error.message);
            return null;
        }
    }

    /**
     * Health check with browser
     */
    async healthCheck() {
        try {
            await this.initBrowser();
            const page = await this.createPage();
            
            await page.goto(this.trackingUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            
            const isBlocked = await this.isPageBlocked(page);
            const title = await page.title();
            
            await page.close();
            await this.close();
            
            return {
                status: isBlocked ? 'blocked' : 'ok',
                scraper: this.name,
                browser: 'chromium',
                pageTitle: title,
                metrics: this.getMetrics(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await this.close();
            
            return {
                status: 'error',
                scraper: this.name,
                error: error.message,
                metrics: this.getMetrics(),
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MeestPlaywrightScraper;