// apps/api/src/services/MultiSourceResolver.js - ПОВНИЙ ВИПРАВЛЕНИЙ ФАЙЛ
const ProviderFactory = require('../providers/ProviderFactory');

class MultiSourceResolver {
    constructor(quotaManager, cacheManager, options = {}) {
        this.quotaManager = quotaManager;
        this.cacheManager = cacheManager;
        this.dependencies = {
            quotaManager: this.quotaManager,
            cacheManager: this.cacheManager
        };
        
        this.options = {
            maxConcurrentRequests: 3,
            timeoutMs: 30000,
            retryAttempts: 2,
            retryDelayMs: 1000,
            enableConflictResolution: true,
            logVerbose: process.env.NODE_ENV === 'development',
            ...options
        };
    }

    async resolve(trackingNumber, sources, options = {}) {
        const startTime = Date.now();
        const resolveOptions = { ...this.options, ...options };
        
        try {
            this.log(`Starting resolution for ${trackingNumber} with ${sources.length} sources`);

            // Валідація вхідних даних
            if (!this.validateInputs(trackingNumber, sources)) {
                return this.createErrorResponse('Invalid input parameters', trackingNumber);
            }

            // Фаза 1: Native APIs (безкоштовні) - паралельно з обмеженням
            const nativeResults = await this.tryNativeSources(trackingNumber, sources, resolveOptions);
            this.log(`Native phase completed: ${nativeResults.length} successful results`);
            
            if (this.hasGoodResult(nativeResults)) {
                const response = this.createSuccessResponse(nativeResults, trackingNumber, 'native');
                response.processingTime = Date.now() - startTime;
                return response;
            }

            // Фаза 2: Paid APIs - тільки якщо native не дали результату
            const paidResults = await this.tryPaidSources(trackingNumber, sources, nativeResults, resolveOptions);
            this.log(`Paid phase completed: ${paidResults.length} successful results`);
            
            if (this.hasGoodResult(paidResults)) {
                const response = this.createSuccessResponse(paidResults, trackingNumber, 'paid');
                response.processingTime = Date.now() - startTime;
                return response;
            }

            // Комбінуємо всі результати, навіть якщо вони неповні
            const allResults = [...nativeResults, ...paidResults];
            if (allResults.length > 0) {
                const response = this.createPartialResponse(allResults, trackingNumber);
                response.processingTime = Date.now() - startTime;
                return response;
            }

            // Немає результатів з жодного джерела
            return this.createFailureResponse(trackingNumber, sources, nativeResults, paidResults, startTime);

        } catch (error) {
            this.log(`MultiSourceResolver critical error: ${error.message}`, 'error');
            return this.createErrorResponse(error.message, trackingNumber, startTime);
        }
    }

    validateInputs(trackingNumber, sources) {
        if (!trackingNumber || typeof trackingNumber !== 'string' || trackingNumber.trim().length === 0) {
            return false;
        }
        if (!Array.isArray(sources) || sources.length === 0) {
            return false;
        }
        return sources.every(source => source.code && source.name);
    }

    async tryNativeSources(trackingNumber, sources, options) {
        const nativeSources = sources.filter(s => s.api === 'native');
        if (nativeSources.length === 0) return [];

        this.log(`Trying ${nativeSources.length} native sources for ${trackingNumber}`);

        // Обмежуємо кількість одночасних запитів
        const chunks = this.chunkArray(nativeSources, options.maxConcurrentRequests);
        const allResults = [];

        for (const chunk of chunks) {
            const promises = chunk.map(source => this.trySource(source, trackingNumber, options));
            const results = await Promise.allSettled(promises);
            
            const chunkResults = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value)
                .filter(r => r.success);

            allResults.push(...chunkResults);

            // Якщо знайшли гарний результат, не продовжуємо з наступними chunks
            if (this.hasGoodResult(chunkResults)) {
                this.log(`Found good result in chunk, stopping native phase`);
                break;
            }
        }

        return allResults;
    }

    async tryPaidSources(trackingNumber, sources, nativeResults, options) {
        // Визначаємо які стадії не покрили native sources
        const coveredStages = new Set(nativeResults.map(r => r.stage));
        const paidSources = sources.filter(s => 
            s.api === 'trackingmore' && !coveredStages.has(s.stage)
        );

        if (paidSources.length === 0) return [];

        this.log(`Trying ${paidSources.length} paid sources for ${trackingNumber}`);

        // Сортуємо за пріоритетом та беремо найкращий
        const bestPaidSource = paidSources
            .sort((a, b) => (a.priority || 99) - (b.priority || 99))[0];

        const result = await this.trySource(bestPaidSource, trackingNumber, options);
        return result.success ? [result] : [];
    }

    async trySource(source, trackingNumber, options) {
        let attempt = 0;
        
        while (attempt <= options.retryAttempts) {
            try {
                // Перевіряємо квоти перед запитом
                await this.quotaManager.checkAndReserve(source.code);
                console.log('[MultiSourceResolver] Creating provider:', source.code, 'with dependencies:', !!this.dependencies);
                const provider = ProviderFactory.createProvider(source.code, this.dependencies);
                console.log('[MultiSourceResolver] Provider created:', provider.name, 'has cacheManager:', !!provider.cacheManager);
                // Встановлюємо timeout для запиту
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), options.timeoutMs);
                });

                const trackPromise = provider.track(trackingNumber, source.code);
                const result = await Promise.race([trackPromise, timeoutPromise]);
                
                if (result.success && this.validateResult(result)) {
                    await this.quotaManager.recordUsage(source.code, provider.cost || 0);
                    
                    return {
                        source: source.name,
                        code: source.code,
                        result: this.normalizeResult(result),
                        success: true,
                        stage: source.stage || 'unknown',
                        cost: provider.cost || 0,
                        attempt: attempt + 1
                    };
                }
                
                // Неуспішний результат, але без retry
                await this.quotaManager.releaseReservation(source.code);
                return {
                    source: source.name,
                    code: source.code,
                    success: false,
                    error: result.error || 'No tracking data available',
                    attempt: attempt + 1
                };

            } catch (error) {
                await this.quotaManager.releaseReservation(source.code);
                
                attempt++;
                if (attempt <= options.retryAttempts) {
                    this.log(`Retrying ${source.code} (attempt ${attempt}): ${error.message}`);
                    await this.delay(options.retryDelayMs * attempt);
                    continue;
                }
                
                return {
                    source: source.name,
                    code: source.code,
                    success: false,
                    error: error.message,
                    attempt: attempt
                };
            }
        }
    }

    validateResult(result) {
        // Перевіряємо чи результат має мінімально необхідну структуру
        return result && 
               result.data && 
               (Array.isArray(result.data.events) || 
                result.data.status || 
                result.data.trackingNumber);
    }

    normalizeResult(result) {
        // Нормалізуємо структуру даних з різних провайдерів
        const normalized = { ...result };
        
        if (normalized.data) {
            // Забезпечуємо що events завжди є масивом
            if (!normalized.data.events) {
                normalized.data.events = [];
            } else if (!Array.isArray(normalized.data.events)) {
                normalized.data.events = [];
            }

            // ВИПРАВЛЕНО: Нормалізуємо формат дати в events з правильною обробкою
            normalized.data.events = normalized.data.events
                .map(event => {
                    const normalizedDate = this.normalizeDate(
                        event.date || event.datetime || event.timestamp
                    );
                    
                    // ВИПРАВЛЕННЯ: Пропускаємо події з некоректними датами
                    if (!normalizedDate) {
                        console.warn('Skipping event with invalid date:', event);
                        return null;
                    }
                    
                    return {
                        ...event,
                        date: normalizedDate,
                        status: event.status || event.description || 'Unknown',
                        location: event.location || event.place || ''
                    };
                })
                .filter(event => event !== null); // Видаляємо події з некоректними датами

            // Додаємо метадані якщо відсутні
            if (!normalized.data.lastUpdate) {
                const latestEvent = normalized.data.events[normalized.data.events.length - 1];
                normalized.data.lastUpdate = latestEvent?.date || new Date().toISOString();
            }
        }

        return normalized;
    }

    // ВИПРАВЛЕНА ФУНКЦІЯ - ключове виправлення
    normalizeDate(dateInput) {
        if (!dateInput) return null; // ВИПРАВЛЕННЯ: повертаємо null замість поточної дати
        
        try {
            const date = new Date(dateInput);
            // ВИПРАВЛЕННЯ: якщо дата некоректна, повертаємо null замість поточної дати
            return isNaN(date.getTime()) ? null : date.toISOString();
        } catch {
            return null; // ВИПРАВЛЕННЯ: повертаємо null при помилці
        }
    }

    hasGoodResult(results) {
        return results.some(r => {
            if (!r.success || !r.result?.data) return false;
            
            // Перевіряємо різні критерії "хорошого" результату
            const data = r.result.data;
            
            // Має події
            if (Array.isArray(data.events) && data.events.length > 0) return true;
            
            // Має статус (навіть без подій)
            if (data.status && data.status !== 'unknown') return true;
            
            // Має базову інформацію про посилку
            if (data.trackingNumber || data.carrier) return true;
            
            return false;
        });
    }

    createSuccessResponse(results, trackingNumber, phase) {
        const successfulResults = results.filter(r => r.success);
        
        if (successfulResults.length === 1) {
            const result = successfulResults[0];
            return {
                success: true,
                data: result.result.data,
                sources: [result.source],
                primarySource: result.source,
                phase: phase,
                multiSource: false,
                metadata: {
                    cost: result.cost,
                    attempts: result.attempt,
                    cached: false
                },
                timestamp: new Date().toISOString()
            };
        }

        // Агрегація кількох результатів
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
            metadata: {
                totalCost: successfulResults.reduce((sum, r) => sum + (r.cost || 0), 0),
                totalAttempts: successfulResults.reduce((sum, r) => sum + (r.attempt || 1), 0),
                cached: false
            },
            timestamp: new Date().toISOString()
        };
    }

    createPartialResponse(results, trackingNumber) {
        // Створюємо відповідь навіть з неповними даними
        const bestResult = results.find(r => r.success) || results[0];
        
        return {
            success: true,
            partial: true,
            data: bestResult?.result?.data || { 
                events: [], 
                status: 'unknown',
                trackingNumber 
            },
            sources: results.map(r => r.source),
            primarySource: bestResult?.source || 'unknown',
            warnings: ['Incomplete tracking data from available sources'],
            timestamp: new Date().toISOString()
        };
    }

    aggregateResults(results, trackingNumber) {
        // Вибираємо найкращий результат як primary
        const primary = results.reduce((best, current) => {
            const currentScore = this.calculateResultScore(current);
            const bestScore = this.calculateResultScore(best);
            return currentScore > bestScore ? current : best;
        });

        // Об'єднуємо всі події
        const allEvents = this.mergeEvents(results);
        
        // Виявляємо конфлікти
        const conflicts = this.options.enableConflictResolution ? 
            this.detectConflicts(results) : [];

        return {
            data: {
                ...primary.result.data,
                events: allEvents,
                coverage: this.calculateCoverage(results),
                confidence: this.calculateConfidence(results)
            },
            primarySource: primary.source,
            alternativeSources: results
                .filter(r => r !== primary)
                .map(r => r.source),
            conflicts: conflicts
        };
    }

    calculateResultScore(result) {
        let score = 0;
        const data = result.result?.data;
        
        if (!data) return 0;
        
        // Бали за кількість подій
        score += (data.events?.length || 0) * 10;
        
        // Бали за наявність статусу
        if (data.status && data.status !== 'unknown') score += 5;
        
        // Бали за native API (безкоштовні)
        if (result.cost === 0) score += 3;
        
        // Бали за свіжість даних
        if (data.lastUpdate) {
            const age = Date.now() - new Date(data.lastUpdate).getTime();
            if (age < 24 * 60 * 60 * 1000) score += 2; // Менше доби
        }
        
        return score;
    }

    mergeEvents(results) {
        const allEvents = results
            .flatMap(r => 
                (r.result?.data?.events || []).map(event => ({
                    ...event,
                    source: r.source,
                    confidence: this.calculateEventConfidence(event, r)
                }))
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Видаляємо дублікати — подія унікальна за датою + статусом + statusCode.
        // НЕ схлопуємо події з однаковою датою але різним статусом (буває у міжнародних)
        return allEvents.filter((event, index, arr) => {
            return index === arr.findIndex(e => 
                new Date(e.date).getTime() === new Date(event.date).getTime() &&
                this.normalizeStatus(e.status) === this.normalizeStatus(event.status) &&
                (e.statusCode || '') === (event.statusCode || '')
            );
        });
    }

    calculateEventConfidence(event, result) {
        let confidence = 0.5;
        
        // Більша довіра до native API
        if (result.cost === 0) confidence += 0.3;
        
        // Більша довіра до детальних подій
        if (event.location) confidence += 0.1;
        if (event.description && event.description.length > 10) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    normalizeStatus(status) {
        if (!status) return '';
        return status.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    calculateCoverage(results) {
        const stages = new Set(results.map(r => r.stage));
        return {
            export: stages.has('export'),
            transit: stages.has('transit'),
            import: stages.has('import'),
            domestic: stages.has('domestic'),
            completeness: stages.size / 4
        };
    }

    calculateConfidence(results) {
        if (results.length === 0) return 0;
        
        const avgConfidence = results.reduce((sum, r) => {
            const events = r.result?.data?.events || [];
            const eventConfidence = events.reduce((eSum, e) => eSum + (e.confidence || 0.5), 0) / events.length || 0.5;
            return sum + eventConfidence;
        }, 0) / results.length;
        
        return Math.round(avgConfidence * 100) / 100;
    }

    detectConflicts(results) {
        const conflicts = [];
        
        // Конфлікти в статусах
        const statuses = results
            .map(r => ({ source: r.source, status: r.result?.data?.status }))
            .filter(s => s.status);
            
        const uniqueStatuses = [...new Set(statuses.map(s => s.status))];
        
        if (uniqueStatuses.length > 1) {
            conflicts.push({
                type: 'status_mismatch',
                details: statuses,
                resolution: 'Used highest confidence source',
                severity: 'medium'
            });
        }

        // Конфлікти в часових мітках
        this.detectTimeConflicts(results, conflicts);
        
        return conflicts;
    }

    detectTimeConflicts(results, conflicts) {
        const lastUpdates = results
            .map(r => ({ 
                source: r.source, 
                lastUpdate: r.result?.data?.lastUpdate 
            }))
            .filter(u => u.lastUpdate);
            
        if (lastUpdates.length > 1) {
            const dates = lastUpdates.map(u => new Date(u.lastUpdate));
            const timeDiff = Math.max(...dates) - Math.min(...dates);
            
            // Якщо різниця більше 24 годин
            if (timeDiff > 24 * 60 * 60 * 1000) {
                conflicts.push({
                    type: 'time_divergence',
                    details: lastUpdates,
                    resolution: 'Used most recent data',
                    severity: 'low'
                });
            }
        }
    }

    createFailureResponse(trackingNumber, sources, nativeResults, paidResults, startTime) {
        return {
            success: false,
            error: 'No tracking data found from any source',
            trackingNumber: trackingNumber,
            sourcesAttempted: sources.map(s => s.name),
            results: {
                native: nativeResults.length,
                paid: paidResults.length,
                total: nativeResults.length + paidResults.length
            },
            processingTime: startTime ? Date.now() - startTime : undefined,
            suggestions: this.generateSuggestions(trackingNumber, sources),
            timestamp: new Date().toISOString()
        };
    }

    createErrorResponse(error, trackingNumber, startTime) {
        return {
            success: false,
            error: error,
            trackingNumber: trackingNumber,
            processingTime: startTime ? Date.now() - startTime : undefined,
            timestamp: new Date().toISOString()
        };
    }

    generateSuggestions(trackingNumber, sources) {
        const suggestions = [];
        
        if (trackingNumber.length < 8) {
            suggestions.push('Tracking number seems too short - please verify');
        }
        
        if (sources.length === 0) {
            suggestions.push('No carriers detected - try manual carrier selection');
        }
        
        suggestions.push('Try again later - tracking data may not be available yet');
        
        return suggestions;
    }

    // Utility methods
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, level = 'info') {
        if (this.options.logVerbose || level === 'error') {
            console[level](`[MultiSourceResolver] ${message}`);
        }
    }
}

module.exports = MultiSourceResolver;