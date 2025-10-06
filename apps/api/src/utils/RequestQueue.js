// apps/api/src/utils/RequestQueue.js

class RequestQueue {
    constructor(options = {}) {
        this.queue = [];
        this.processing = false;
        this.meanDelay = options.meanDelay || 3000; // 3s default
        this.stdDeviation = options.stdDeviation || 1000; // 1s variance
        this.minDelay = options.minDelay || 1000; // minimum 1s
    }

    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        const { requestFn, resolve, reject } = this.queue.shift();

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        }

        // Gaussian delay using Box-Muller transform
        const delay = this.calculateGaussianDelay();
        await this.sleep(delay);

        this.processing = false;
        this.processQueue();
    }

    calculateGaussianDelay() {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const delay = this.meanDelay + z * this.stdDeviation;
        return Math.max(this.minDelay, Math.round(delay));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getQueueLength() {
        return this.queue.length;
    }
}

module.exports = RequestQueue;