// apps/api/src/services/CarrierDetector.js
class CarrierDetector {
    constructor() {
        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        return {
            // Українські перевізники
            'ukrposhta': [
                { pattern: /^[0-9]{14}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^[A-Z]{2}\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^EM\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^CP\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^RG\d{9}UA$/, confidence: 'high', stage: 'import' }
            ],
            'nova-poshta': [
                { pattern: /^20\d{12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^59\d{12}$/, confidence: 'high', stage: 'domestic' }
            ],
            'meest-express': [
                { pattern: /^ME\d{10,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^M\d{8,10}$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^MEST\d{8,12}$/, confidence: 'high', stage: 'domestic' }
            ],
            'justin': [
                { pattern: /^J\d{10,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^JU\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^JUST\d{8,12}$/, confidence: 'high', stage: 'domestic' }
            ],
            'delivery-auto': [
                { pattern: /^DA\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^\d{8,10}DA$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^DELIVERY\d{6,10}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^DLV\d{8,12}$/, confidence: 'medium', stage: 'domestic' }
            ],
            'sat': [
                { pattern: /^SAT\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^ST\d{10,12}$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^SATELLITE\d{6,10}$/, confidence: 'high', stage: 'domestic' }
            ],

            // Міжнародні перевізники
            'dhl': [
                { pattern: /^\d{10}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{11}$/, confidence: 'high', stage: 'international' },
                { pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/, confidence: 'medium', stage: 'international' },
                { pattern: /^JD\d{18}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{4}\s?\d{4}\s?\d{4}$/, confidence: 'medium', stage: 'international' }
            ],
            'fedex': [
                { pattern: /^\d{12,14}$/, confidence: 'medium', stage: 'international' },
                { pattern: /^\d{20}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{22}$/, confidence: 'high', stage: 'international' },
                { pattern: /^96\d{20}$/, confidence: 'high', stage: 'international' }
            ],
            'ups': [
                { pattern: /^1Z[A-Z0-9]{16}$/, confidence: 'high', stage: 'international' },
                { pattern: /^T\d{10}$/, confidence: 'high', stage: 'international' }
            ],
            'china-post': [
                { pattern: /^[A-Z]{2}\d{9}CN$/, confidence: 'high', stage: 'export' },
                { pattern: /^C[A-Z]\d{9}CN$/, confidence: 'high', stage: 'export' },
                { pattern: /^L[A-Z]\d{9}CN$/, confidence: 'high', stage: 'export' },
                { pattern: /^R[A-Z]\d{9}CN$/, confidence: 'high', stage: 'export' }
            ],
            'cainiao': [
                { pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/, confidence: 'medium', stage: 'export' }
            ],

            // Європейські пошти
            'deutsche-post': [
                { pattern: /^[A-Z]{2}\d{9}DE$/, confidence: 'high', stage: 'export' },
                { pattern: /^00\d{18}$/, confidence: 'high', stage: 'export' }
            ],
            'royal-mail': [
                { pattern: /^[A-Z]{2}\d{9}GB$/, confidence: 'high', stage: 'export' },
                { pattern: /^[A-Z]{1}\d{8}[A-Z]{2}$/, confidence: 'high', stage: 'export' }
            ],
            'postnl': [
                { pattern: /^[A-Z]{2}\d{9}NL$/, confidence: 'high', stage: 'export' },
                { pattern: /^3S[A-Z0-9]{13}$/, confidence: 'high', stage: 'export' }
            ]
        };
    }

    detectMultipleSources(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
        const sources = [];

        for (const [carrierCode, patterns] of Object.entries(this.patterns)) {
            for (const patternInfo of patterns) {
                if (patternInfo.pattern.test(number)) {
                    const apiType = this.getApiType(carrierCode);
                    
                    sources.push({
                        id: this.getCarrierId(carrierCode),
                        code: carrierCode,
                        name: this.getCarrierName(carrierCode),
                        api: apiType,
                        stage: patternInfo.stage,
                        confidence: patternInfo.confidence,
                        priority: this.getPriority(carrierCode, apiType)
                    });
                    break;
                }
            }
        }

        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            sources.push(...this.detectInternationalSources(number));
        }

        return sources.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    }

    detectInternationalSources(number) {
        const sources = [];
        
        if (/^RO\d{9}EE$/.test(number)) {
            sources.push(
                { 
                    code: 'ukrposhta', 
                    name: 'Укрпошта (UPU)', 
                    api: 'native', 
                    stage: 'import',
                    confidence: 'high',
                    priority: 1 
                },
                { 
                    code: 'china-post', 
                    name: 'International Post', 
                    api: 'trackingmore', 
                    stage: 'transit',
                    confidence: 'medium',
                    priority: 2 
                }
            );
        } else if (/^[A-Z]{2}\d{9}CN$/.test(number)) {
            sources.push(
                { 
                    code: 'ukrposhta', 
                    name: 'Укрпошта (UPU)', 
                    api: 'native', 
                    stage: 'import',
                    confidence: 'high',
                    priority: 1 
                },
                { 
                    code: 'china-post', 
                    name: 'China Post', 
                    api: 'trackingmore', 
                    stage: 'export',
                    confidence: 'high',
                    priority: 2 
                }
            );
        } else {
            sources.push(
                { 
                    code: 'ukrposhta', 
                    name: 'Укрпошта (UPU)', 
                    api: 'native', 
                    stage: 'transit',
                    confidence: 'medium',
                    priority: 1 
                }
            );
        }
        
        return sources;
    }

    getApiType(carrierCode) {
        const nativeCarriers = ['ukrposhta', 'nova-poshta', 'dhl', 'delivery-auto', 'sat'];
        return nativeCarriers.includes(carrierCode) ? 'native' : 'trackingmore';
    }

    getPriority(carrierCode, apiType) {
        if (apiType === 'native') {
            const nativePriorities = {
                'ukrposhta': 1,
                'nova-poshta': 2,
                'dhl': 3,
                'delivery-auto': 4,
                'sat': 5
            };
            return nativePriorities[carrierCode] || 6;
        }
        
        const trackingMorePriorities = {
            'china-post': 10,
            'cainiao': 11,
            'meest-express': 12,
            'justin': 13,
            'fedex': 14,
            'ups': 15,
            'deutsche-post': 16,
            'royal-mail': 17,
            'postnl': 18
        };
        return trackingMorePriorities[carrierCode] || 20;
    }

    getCarrierId(carrierCode) {
        const carrierIds = {
            'ukrposhta': 2,
            'nova-poshta': 1,
            'meest-express': 3,
            'justin': 4,
            'delivery-auto': 5,
            'sat': 6,
            'dhl': 7,
            'fedex': 8,
            'ups': 9,
            'china-post': 10,
            'cainiao': 11,
            'deutsche-post': 12,
            'royal-mail': 13,
            'postnl': 14
        };
        return carrierIds[carrierCode] || null;
    }

    getCarrierName(carrierCode) {
        const carrierNames = {
            'ukrposhta': 'Укрпошта',
            'nova-poshta': 'Nova Poshta',
            'meest-express': 'Meest Express',
            'justin': 'Justin',
            'delivery-auto': 'Delivery Auto',
            'sat': 'SAT Satellite Express',
            'dhl': 'DHL',
            'fedex': 'FedEx',
            'ups': 'UPS',
            'china-post': 'China Post',
            'cainiao': 'Cainiao',
            'deutsche-post': 'Deutsche Post',
            'royal-mail': 'Royal Mail',
            'postnl': 'PostNL'
        };
        return carrierNames[carrierCode] || carrierCode;
    }

    detectCarrier(trackingNumber) {
        const sources = this.detectMultipleSources(trackingNumber);
        
        if (sources.length === 0) {
            return { 
                id: null, 
                code: 'unknown', 
                name: 'Unknown Carrier', 
                api: 'trackingmore',
                confidence: 'very-low'
            };
        }
        
        const primary = sources[0];
        return {
            id: primary.id,
            code: primary.code,
            name: primary.name,
            api: primary.api,
            confidence: primary.confidence
        };
    }
}

module.exports = CarrierDetector;