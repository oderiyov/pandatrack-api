// apps/api/src/services/MultiSourceResolver.js
const ProviderFactory = require('../providers/ProviderFactory');

class MultiSourceResolver {
    constructor(quotaManager) {
        this.quotaManager = quotaManager;
    }

    async resolve(trackingNumber, sources, options = {}) {
        try {
            // Фаза 1: Native APIs (безкоштовні) - паралельно
            const nativeResults = await this.tryNativeSources(trackingNumber, sources);
            
            if (this.hasGoodResult(nativeResults)) {
                return this.createSuccessResponse(nativeResults, trackingNumber, 'native');
            }

            // Фаза 2: TrackingMore (платні) - тільки якщо native не дали результату
            const paidResults = await this.tryPaidSources(trackingNumber, sources, nativeResults);
            
            if (this.hasGoodResult(paidResults)) {
                return this.createSuccessResponse(paidResults, trackingNumber, 'paid');
            }

            // Немає результатів з жодного джерела
            return this.createFailureResponse(trackingNumber, sources, nativeResults, paidResults);

        } catch (error) {
            console.error('MultiSourceResolver error:', error.message);
            return {
                success: false,
                error: error.message,
                trackingNumber: trackingNumber,
                timestamp: new Date().toISOString()
            };
        }
    }

    async tryNativeSources(trackingNumber, sources) {
        const nativeSources = sources.filter(s => s.api === 'native');
        if (nativeSources.length === 0) return [];

        console.log(`Trying ${nativeSources.length} native sources for ${trackingNumber}`);

        const promises = nativeSources.map(async (source) => {
            try {
                await this.quotaManager.checkAndReserve(source.code);
                
                const provider = ProviderFactory.create(source.code);
                const result = await provider.track(trackingNumber);
                
                if (result.success) {
                    await this.quotaManager.recordUsage(source.code, provider.cost);
                    return {
                        source: source.name,
                        code: source.code,
                        result: result,
                        success: true,
                        stage: source.stage || 'unknown'
                    };
                }
                
                return {
                    source: source.name,
                    code: source.code,
                    success: false,
                    error: result.error || 'No data returned'
                };

            } catch (error) {
                await this.quotaManager.releaseReservation(source.code);
                return {
                    source: source.name,
                    code: source.code,
                    success: false,
                    error: error.message
                };
            }
        });

        const results = await Promise.allSettled(promises);
        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value)
            .filter(r => r.success);
    }

    async tryPaidSources(trackingNumber, sources, nativeResults) {
        // Визначаємо які стадії не покрили native sources
        const coveredStages = nativeResults.map(r => r.stage);
        const paidSources = sources.filter(s => 
            s.api === 'trackingmore' && !coveredStages.includes(s.stage)
        );

        if (paidSources.length === 0) return [];

        console.log(`Trying ${paidSources.length} paid sources for ${trackingNumber}`);

        // Для TrackingMore беремо тільки найпріоритетнішого
        const bestPaidSource = paidSources.sort((a, b) => (a.priority || 99) - (b.priority || 99))[0];

        try {
            await this.quotaManager.checkAndReserve('trackingmore');
            
            const provider = ProviderFactory.create('trackingmore');
            const result = await provider.track(trackingNumber, bestPaidSource.code);
            
            if (result.success) {
                await this.quotaManager.recordUsage('trackingmore', provider.cost);
                return [{
                    source: bestPaidSource.name,
                    code: bestPaidSource.code,
                    result: result,
                    success: true,
                    stage: bestPaidSource.stage || 'unknown'
                }];
            }
            
            return [];

        } catch (error) {
            await this.quotaManager.releaseReservation('trackingmore');
            console.warn('Paid source failed:', error.message);
            return [];
        }
    }

    hasGoodResult(results) {
        return results.some(r => r.success && r.result.data && r.result.data.events.length > 0);
    }

    createSuccessResponse(results, trackingNumber, phase) {
        const successfulResults = results.filter(r => r.success);
        
        if (successfulResults.length === 1) {
            // Один результат
            const result = successfulResults[0];
            return {
                success: true,
                data: result.result.data,
                sources: [result.source],
                primarySource: result.source,
                phase: phase,
                multiSource: false,
                timestamp: new Date().toISOString()
            };
        }

        // Кілька результатів - агрегація
        const aggregated = this.aggregateResults(successfulResults, trackingNumber);
        return {
            success: true,
            data: aggregated.data,
            sources: successfulResults.map(r => r.source),
            primarySource: aggregated.primarySource,
            alternativeSources: aggregated.alternativeSources,
            phase: phase,
            multiSource: true,
            conflictsResolved: aggregated.conflicts,
            timestamp: new Date().toISOString()
        };
    }

    aggregateResults(results, trackingNumber) {
        // Вибираємо найкращий результат як primary
        const primary = results.reduce((best, current) => {
            const currentEvents = current.result.data.events?.length || 0;
            const bestEvents = best.result.data.events?.length || 0;
            
            // Пріоритет: більше events > native API > новіші дані
            if (currentEvents > bestEvents) return current;
            if (currentEvents === bestEvents) {
                // При рівній кількості events віддаємо перевагу native API
                if (current.result.cost === 0 && best.result.cost > 0) return current;
                if (best.result.cost === 0 && current.result.cost > 0) return best;
                
                // При рівних умовах - свіжіші дані
                const currentUpdate = new Date(current.result.data.lastUpdate);
                const bestUpdate = new Date(best.result.data.lastUpdate);
                if (currentUpdate > bestUpdate) return current;
            }
            return best;
        });

        // Об'єднуємо всі події з різних джерел
        const allEvents = results
            .flatMap(r => 
                (r.result.data.events || []).map(event => ({
                    ...event,
                    source: r.source
                }))
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter((event, index, arr) => {
                // Видаляємо дублікати на основі дати та статусу
                return index === arr.findIndex(e => 
                    e.date === event.date && e.status === event.status
                );
            });

        // Виявляємо конфлікти
        const conflicts = this.detectConflicts(results);

        return {
            data: {
                ...primary.result.data,
                events: allEvents,
                coverage: {
                    export: results.some(r => r.stage === 'export'),
                    transit: results.some(r => r.stage === 'transit'),
                    import: results.some(r => r.stage === 'import'),
                    domestic: results.some(r => r.stage === 'domestic')
                }
            },
            primarySource: primary.source,
            alternativeSources: results.filter(r => r !== primary).map(r => r.source),
            conflicts: conflicts
        };
    }

    detectConflicts(results) {
        const conflicts = [];
        
        // Перевіряємо конфлікти в статусах
        const statuses = results.map(r => ({ source: r.source, status: r.result.data.status }));
        const uniqueStatuses = [...new Set(statuses.map(s => s.status))];
        
        if (uniqueStatuses.length > 1) {
            conflicts.push({
                type: 'status_mismatch',
                details: statuses,
                resolution: 'Used most detailed source'
            });
        }

        return conflicts;
    }

    createFailureResponse(trackingNumber, sources, nativeResults, paidResults) {
        return {
            success: false,
            error: 'No tracking data found from any source',
            trackingNumber: trackingNumber,
            sourcesAttempted: sources.map(s => s.name),
            nativeResults: nativeResults.length,
            paidResults: paidResults.length,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MultiSourceResolver;