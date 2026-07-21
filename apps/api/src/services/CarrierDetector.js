// apps/api/src/services/CarrierDetector.js - FIXED patterns
class CarrierDetector {
    constructor() {
        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        return {
            // Українські перевізники
            'ukrposhta': [
                // Внутрішні українські формати
                { pattern: /^[0-9]{13}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^[0-9]{14}$/, confidence: 'high', stage: 'domestic' },
                
                // Імпорт в Україну (закінчення UA)
                { pattern: /^[A-Z]{2}\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^EM\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^CP\d{9}UA$/, confidence: 'high', stage: 'import' },
                { pattern: /^RG\d{9}UA$/, confidence: 'high', stage: 'import' },
                
                // Міжнародні UPU - ВИКЛЮЧАЄМО CV з цього списку
                // R-series (registered mail)
                { pattern: /^(RA|RB|RC|RD|RE|RG|RH|RI|RJ|RK|RL|RM|RN|RO|RP|RQ|RR|RS|RT|RU|RV|RW|RX|RY|RZ)\d{9}[A-Z]{2}$/, confidence: 'high', stage: 'international' },
                
                // C-series БЕЗ CV (CV це Meest)
                { pattern: /^(CA|CB|CC|CD|CE|CF|CG|CH|CI|CJ|CK|CL|CM|CN|CO|CP|CQ|CR|CS|CT|CU|CW|CX|CY|CZ)\d{9}[A-Z]{2}$/, confidence: 'high', stage: 'international' },
                
                // E-series (EMS)
                { pattern: /^(EA|EB|EC|ED|EE|EF|EG|EH|EI|EJ|EK|EL|EM|EN|EO|EP|EQ|ER|ES|ET|EU|EV|EW|EX|EY|EZ)\d{9}[A-Z]{2}$/, confidence: 'high', stage: 'international' },
                
                // L-series (letter post) БЕЗ LV якщо LV це також Meest
                { pattern: /^(LA|LB|LC|LD|LE|LF|LG|LH|LI|LJ|LK|LL|LM|LN|LO|LP|LQ|LR|LS|LT|LU|LW|LX|LY|LZ)\d{9}[A-Z]{2}$/, confidence: 'high', stage: 'international' },
                
                // Загальний UPU fallback зі ЗНИЖЕНИМ пріоритетом (на випадок якщо не Meest)
                { pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/, confidence: 'low', stage: 'international' }
            ],
            
            'nova-poshta': [
                { pattern: /^20\d{12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^59\d{12}$/, confidence: 'high', stage: 'domestic' }
            ],
            
            // ВИПРАВЛЕННЯ: Delivery Auto patterns з правильним пріоритетом
            'delivery-auto': [
                // КРИТИЧНО: Специфічні префікси Delivery Auto (найвищий пріоритет)
                { pattern: /^058\d{7}$/, confidence: 'high', stage: 'domestic' },    // 0580402558 - ВИСОКИЙ пріоритет
                { pattern: /^057\d{7}$/, confidence: 'high', stage: 'domestic' },    
                { pattern: /^056\d{7}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^055\d{7}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^054\d{7}$/, confidence: 'medium', stage: 'domestic' },  // Розширюємо префікси
                { pattern: /^053\d{7}$/, confidence: 'medium', stage: 'domestic' },

                // Фірмові коди Delivery Auto
                { pattern: /^DA\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^\d{8,10}DA$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^DELIVERY\d{6,10}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^DLV\d{8,12}$/, confidence: 'high', stage: 'domestic' },

                // Загальні patterns з НИЗЬКИМ пріоритетом (щоб не конфліктувати з SAT)
                { pattern: /^0\d{9}$/, confidence: 'low', stage: 'domestic' },       // Знижено з medium
                { pattern: /^\d{10}$/, confidence: 'very-low', stage: 'domestic' }   // Тільки як fallback
            ],
            
            // SAT patterns - з обмеженими префіксами
            'sat': [
                { pattern: /^SAT\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^ST\d{10,12}$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^SATELLITE\d{6,10}$/, confidence: 'high', stage: 'domestic' },
                
                // ДОДАТИ ЦІ РЯДКИ:
                { pattern: /^029\d{6}$/, confidence: 'high', stage: 'domestic' },    // 029000710
                { pattern: /^001\d{6}$/, confidence: 'high', stage: 'domestic' },    // 001000288
                { pattern: /^0\d{8}$/, confidence: 'medium', stage: 'domestic' },    // 9-digit numbers starting with 0
                
                // Existing patterns with lower priority:
                { pattern: /^020\d{7}$/, confidence: 'medium', stage: 'domestic' },    
                { pattern: /^021\d{7}$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^022\d{7}$/, confidence: 'medium', stage: 'domestic' },
                { pattern: /^\d{10,12}$/, confidence: 'very-low', stage: 'domestic' }
            ],

            'dhl': [
                // НОВІ eCommerce patterns з високим пріоритетом
                { pattern: /^[3-6]\d{13}$/, confidence: 'high', stage: 'international' },
                { pattern: /^4\d{13}$/, confidence: 'high', stage: 'international' },
                
                // Існуючі patterns...
                { pattern: /^\d{10}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{11}$/, confidence: 'high', stage: 'international' },
                { pattern: /^JD\d{18}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{4}\s?\d{4}\s?\d{4}$/, confidence: 'medium', stage: 'international' },
                { pattern: /^\d{12}$/, confidence: 'medium', stage: 'international' },
                { pattern: /^\d{9}$/, confidence: 'medium', stage: 'international' }
            ],

            // Інші українські перевізники
            'meest': [
                // Міжнародні CV formats
                { pattern: /^CV\d{9}(US|CA|PL|UA|GB|DE|FR|IT|ES|NL|BE|AT|CZ)$/i, confidence: 'high', stage: 'international' },
                { pattern: /^RK\d{9}[A-Z]{2}$/i, confidence: 'high', stage: 'international' },
                { pattern: /^RB\d{9}[A-Z]{2}$/i, confidence: 'high', stage: 'international' },
                
                // Внутрішні формати
                { pattern: /^719-\d{7}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^\d{7}[A-Z0-9]{9}$/, confidence: 'high', stage: 'domestic' }, // 2508205FM9K077RC
                { pattern: /^\d{11,15}[A-Z0-9]{2,8}$/, confidence: 'medium', stage: 'domestic' },
                
                // Фірмові коди
                { pattern: /^ME\d{10,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^[0-9]{8}-[0-9]{3}$/, confidence: 'high', stage: 'domestic' },
                
                // Fallback
                { pattern: /^\d{10,14}$/, confidence: 'very-low', stage: 'domestic' }
            ],
            
            'justin': [
                { pattern: /^J\d{10,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^JU\d{8,12}$/, confidence: 'high', stage: 'domestic' },
                { pattern: /^JUST\d{8,12}$/, confidence: 'high', stage: 'domestic' }
            ],

            // Міжнародні перевізники
            'fedex': [
                { pattern: /^\d{20}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{22}$/, confidence: 'high', stage: 'international' },
                { pattern: /^96\d{20}$/, confidence: 'high', stage: 'international' },
                { pattern: /^\d{12,14}$/, confidence: 'very-low', stage: 'international' }
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
                { pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/, confidence: 'very-low', stage: 'export' }
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
        const matches = [];
        
        console.log(`CarrierDetector: Analyzing tracking number: ${number}`);
        
        for (const [carrierCode, patterns] of Object.entries(this.patterns)) {
            for (const patternInfo of patterns) {
                if (patternInfo.pattern.test(number)) {
                    const apiType = this.getApiType(carrierCode);
                    const confidenceScore = this.getConfidenceScore(patternInfo.confidence);
                    const priorityScore = this.getPriority(carrierCode, apiType);
                    
                    const match = {
                        id: this.getCarrierId(carrierCode),
                        code: carrierCode,
                        name: this.getCarrierName(carrierCode),
                        api: apiType,
                        stage: patternInfo.stage,
                        confidence: patternInfo.confidence,
                        confidenceScore: confidenceScore,
                        priority: priorityScore,
                        totalScore: confidenceScore * 10 + (100 - priorityScore),
                        pattern: patternInfo.pattern.toString() // Для debug
                    };
                    
                    matches.push(match);
                    console.log(`CarrierDetector: Match found - ${carrierCode} (confidence: ${patternInfo.confidence}, totalScore: ${match.totalScore})`);
                }
            }
        }

        // Сортуємо за загальним скором (вищий скор = кращий match)
        matches.sort((a, b) => b.totalScore - a.totalScore);
        
        console.log(`CarrierDetector: Top matches for ${number}:`, matches.slice(0, 3).map(m => `${m.name} (${m.totalScore})`));
        
        // Беремо до 5 найкращих збігів
        const bestMatches = matches.slice(0, 5);
        sources.push(...bestMatches);

        // Завжди додаємо міжнародні джерела для UPU форматів
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            const internationalSources = this.detectInternationalSources(number);
            
            for (const intSource of internationalSources) {
                if (!sources.find(s => s.code === intSource.code)) {
                    sources.push({
                        ...intSource,
                        id: this.getCarrierId(intSource.code),
                        totalScore: this.getConfidenceScore(intSource.confidence) * 10 + (100 - intSource.priority)
                    });
                }
            }
        }

        // Дедуплікація джерел по code — один перевізник = одне джерело
        // (перевізник може матчитись кількома власними патернами + international)
        const uniqueSources = [];
        const seenCodes = new Set();
        for (const source of sources) {
            if (!seenCodes.has(source.code)) {
                seenCodes.add(source.code);
                uniqueSources.push(source)
            }
        }
        return uniqueSources;        
    }

    getConfidenceScore(confidence) {
        const scores = {
            'high': 4,
            'medium': 3,
            'low': 2,
            'very-low': 1
        };
        return scores[confidence] || 0;
    }

    detectInternationalSources(number) {
        const sources = [];
        
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            sources.push({
                code: 'ukrposhta',
                name: 'Укрпошта (UPU)',
                api: 'native',
                stage: 'international',
                confidence: 'high',
                priority: 1
            });

            sources.push({
                code: 'trackingmore-international',
                name: 'International Tracking',
                api: 'trackingmore',
                stage: 'international',
                confidence: 'medium',
                priority: 10
            });
        }
        
        return sources;
    }

    getApiType(carrierCode) {
        const nativeCarriers = ['ukrposhta', 'nova-poshta', 'meest', 'dhl', 'delivery-auto', 'sat'];
        return nativeCarriers.includes(carrierCode) ? 'native' : 'trackingmore';
    }

    getPriority(carrierCode, apiType) {
        if (apiType === 'native') {
            const nativePriorities = {
                'ukrposhta': 1,
                'nova-poshta': 2,
                'delivery-auto': 3,  // Високий пріоритет для нативного API
                'meest': 4,
                'dhl': 5,
                'sat': 6
            };
            return nativePriorities[carrierCode] || 7;
        }
        
        const trackingMorePriorities = {
            'china-post': 10,
            'cainiao': 15,
            'justin': 13,
            'fedex': 14,
            'ups': 11,
            'deutsche-post': 16,
            'royal-mail': 17,
            'postnl': 18,
            'trackingmore-international': 20
        };
        return trackingMorePriorities[carrierCode] || 25;
    }

    getCarrierId(carrierCode) {
        const carrierIds = {
            'ukrposhta': 2,
            'nova-poshta': 1,
            'meest': 3,
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
            'postnl': 14,
            'trackingmore-international': 99
        };
        return carrierIds[carrierCode] || null;
    }

    getCarrierName(carrierCode) {
        const carrierNames = {
            'ukrposhta': 'Укрпошта',
            'nova-poshta': 'Nova Poshta',
            'meest': 'Meest Express',
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
            'postnl': 'PostNL',
            'trackingmore-international': 'International Tracking'
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
        console.log(`CarrierDetector: Primary carrier selected: ${primary.name} (${primary.code})`);
        
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