// apps/api/src/providers/ProviderFactory.js - UPDATED для Hybrid Logic
const NovaPoshtaProvider = require('./NovaPoshtaProvider');
const UkrposhtaProvider = require('./UkrposhtaProvider');
const DHLProvider = require('./DHLProvider');
const MeestProvider = require('./MeestProvider');
const SATProvider = require('./SATProvider');
const DeliveryAutoProvider = require('./DeliveryAutoProvider');

class ProviderFactory {
    /**
     * Створює provider instance з hybrid config
     */
    static createProvider(carrierCode, dependencies = {}) {
        const config = this.getProviderConfig(carrierCode);
        
        // Додаємо dependencies (QuotaManager, CacheManager)
        config.quotaManager = dependencies.quotaManager || null;
        config.cacheManager = dependencies.cacheManager || null;
        
        switch (carrierCode) {
            case 'novaposhta':
            case 'nova-poshta':
                return new NovaPoshtaProvider(config);
                
            case 'ukrposhta':
                return new UkrposhtaProvider(config);
                
            case 'dhl':
                return new DHLProvider(config);
                
            case 'meest':
            case 'meest-express':
                return new MeestProvider(config);
                
            case 'sat':
                return new SATProvider(config);
                
            case 'delivery-auto':
            case 'deliveryauto':
                return new DeliveryAutoProvider(config);
                
            default:
                throw new Error(`Unknown provider: ${carrierCode}`);
        }
    }

    /**
     * Отримує конфігурацію для провайдера з .env
     */
    static getProviderConfig(carrierCode) {
        const normalizedCode = carrierCode.toLowerCase().replace('-', '_');
        
        return {
            name: carrierCode,
            enabled: process.env[`${normalizedCode.toUpperCase()}_ENABLED`] !== 'false',
            scrapingEnabled: process.env[`${normalizedCode.toUpperCase()}_SCRAPING_ENABLED`] === 'true',
            quota: {
                daily: parseInt(process.env[`${normalizedCode.toUpperCase()}_DAILY_LIMIT`]) || Infinity
            },
            cost: 0, // Native APIs безкоштовні
            supportsInternational: true,
            timeout: 15000
        };
    }

    /**
     * Створює всі providers з dependencies
     */
    static createAllProviders(dependencies = {}) {
        const carriers = [
            'nova-poshta',
            'ukrposhta',
            'dhl',
            'meest',
            'sat',
            'delivery-auto'
        ];
        
        const providers = {};
        
        carriers.forEach(carrier => {
            try {
                providers[carrier] = this.createProvider(carrier, dependencies);
            } catch (error) {
                console.warn(`Failed to create ${carrier} provider:`, error.message);
            }
        });
        
        return providers;
    }

    /**
     * Health check для всіх providers
     */
    static async healthCheckAll(dependencies = {}) {
        const providers = this.createAllProviders(dependencies);
        const healthChecks = {};
        
        for (const [name, provider] of Object.entries(providers)) {
            try {
                healthChecks[name] = await provider.healthCheck();
            } catch (error) {
                healthChecks[name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        return healthChecks;
    }

    /**
     * Отримує інформацію про всі providers
     */
    static async getProvidersInfo() {
        return {
            'nova-poshta': {
                name: 'Nova Poshta',
                country: 'UA',
                features: ['API', 'Cache', 'Hybrid'],
                cost: 0,
                quota: 'Unlimited',
                reliability: '99%'
            },
            'ukrposhta': {
                name: 'Ukrposhta',
                country: 'UA',
                features: ['API', 'Cache', 'Hybrid'],
                cost: 0,
                quota: 'Unlimited',
                reliability: '95%'
            },
            'dhl': {
                name: 'DHL',
                country: 'Global',
                features: ['API', 'Cache', 'Hybrid', 'Quota Management'],
                cost: 0,
                quota: '250/day',
                reliability: '99%'
            },
            'meest': {
                name: 'Meest Express',
                country: 'UA/Global',
                features: ['API', 'Scraping', 'Cache', 'Hybrid', 'Proxies'],
                cost: 0.0003, // $3/10K requests (proxy cost)
                quota: 'Unlimited',
                reliability: '85%'
            },
            'sat': {
                name: 'SAT',
                country: 'UA',
                features: ['API', 'Cache', 'Hybrid'],
                cost: 0,
                quota: 'Limited',
                reliability: '90%'
            },
            'delivery-auto': {
                name: 'Delivery Auto',
                country: 'UA',
                features: ['API', 'Cache', 'Hybrid'],
                cost: 0,
                quota: 'Limited',
                reliability: '85%'
            }
        };
    }
}

module.exports = ProviderFactory;