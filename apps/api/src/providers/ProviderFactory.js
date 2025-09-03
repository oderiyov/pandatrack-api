// apps/api/src/providers/ProviderFactory.js
const UkrposhtaProvider = require('./UkrposhtaProvider');
const NovaPoshtaProvider = require('./NovaPoshtaProvider');
const TrackingMoreProvider = require('./TrackingMoreProvider');
const DHLProvider = require('./DHLProvider');
const DeliveryAutoProvider = require('./DeliveryAutoProvider');
const SATProvider = require('./SATProvider');

class ProviderFactory {
    static providers = new Map();
    static instances = new Map(); // Кеш інстансів

    static initialize() {
        // Реєстрація всіх провайдерів з конфігурацією
        this.register('ukrposhta', UkrposhtaProvider, {
            name: 'ukrposhta',
            cost: 0,
            quota: { daily: 999999, used: 0 },
            enabled: true,
            supportsInternational: true,
            stages: ['domestic', 'import', 'export', 'transit']
        });

        this.register('nova-poshta', NovaPoshtaProvider, {
            name: 'nova-poshta',
            cost: 0,
            quota: { daily: 10000, used: 0 },
            enabled: true,
            supportsInternational: false,
            stages: ['domestic']
        });

        this.register('trackingmore', TrackingMoreProvider, {
            name: 'trackingmore',
            cost: 0.019,
            quota: { daily: parseInt(process.env.TRACKINGMORE_DAILY_LIMIT) || 100, used: 0 },
            enabled: true,
            supportsInternational: true,
            stages: ['export', 'transit', 'import']
        });

        this.register('dhl', DHLProvider, {
            name: 'dhl',
            cost: 0,
            quota: { daily: 250, used: 0 },
            enabled: true,
            supportsInternational: true,
            stages: ['international', 'export', 'import']
        });

        this.register('delivery-auto', DeliveryAutoProvider, {
            name: 'delivery-auto',
            cost: 0,
            quota: { daily: 1000, used: 0 },
            enabled: true,
            supportsInternational: false,
            stages: ['domestic']
        });

        this.register('sat', SATProvider, {
            name: 'sat',
            cost: 0,
            quota: { daily: 500, used: 0 },
            enabled: true,
            supportsInternational: false,
            stages: ['domestic']
        });
    }

    static register(name, providerClass, config) {
        this.providers.set(name, { class: providerClass, config });
        console.log(`Registered provider: ${name}`);
    }

    static create(name) {
        // Перевіряємо кеш інстансів
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        const provider = this.providers.get(name);
        if (!provider) {
            throw new Error(`Provider ${name} not registered`);
        }

        try {
            const instance = new provider.class(provider.config);
            
            // Кешуємо інстанс для повторного використання
            this.instances.set(name, instance);
            
            return instance;
        } catch (error) {
            console.error(`Failed to create provider ${name}:`, error.message);
            throw new Error(`Cannot create provider ${name}: ${error.message}`);
        }
    }

    static getAvailable() {
        return Array.from(this.providers.keys());
    }

    static getConfig(name) {
        const provider = this.providers.get(name);
        return provider ? provider.config : null;
    }

    static isEnabled(name) {
        const config = this.getConfig(name);
        return config ? config.enabled : false;
    }

    static async healthCheckAll() {
        const results = {};
        
        for (const name of this.getAvailable()) {
            try {
                if (this.isEnabled(name)) {
                    const provider = this.create(name);
                    results[name] = await provider.healthCheck();
                } else {
                    results[name] = { status: 'disabled', provider: name };
                }
            } catch (error) {
                results[name] = { 
                    status: 'error', 
                    provider: name, 
                    error: error.message 
                };
            }
        }
        
        return results;
    }

    static clearCache() {
        this.instances.clear();
        console.log('Provider instance cache cleared');
    }

    static updateConfig(name, newConfig) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new Error(`Provider ${name} not found`);
        }

        // Оновлюємо конфігурацію
        provider.config = { ...provider.config, ...newConfig };
        
        // Очищуємо кешований інстанс щоб він створився з новою конфігурацією
        this.instances.delete(name);
        
        console.log(`Updated config for provider: ${name}`);
    }
}

// Ініціалізуємо фабрику при завантаженні модуля
ProviderFactory.initialize();

module.exports = ProviderFactory;