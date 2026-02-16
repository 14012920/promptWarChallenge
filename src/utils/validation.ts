/**
 * Input validation and sanitization utilities
 * Provides security measures for user inputs
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Validate and clamp numeric input
 */
export function validateNumber(
    value: number,
    min: number,
    max: number
): number {
    if (typeof value !== 'number' || isNaN(value)) {
        return min;
    }
    return Math.max(min, Math.min(max, value));
}

/**
 * Validate score submission
 */
export function validateScore(score: number): boolean {
    return (
        typeof score === 'number' &&
        !isNaN(score) &&
        isFinite(score) &&
        score >= 0 &&
        score <= 1000000
    );
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
    private calls: number[] = [];
    private readonly maxCalls: number;
    private readonly timeWindow: number;

    constructor(maxCalls: number = 10, timeWindowMs: number = 60000) {
        this.maxCalls = maxCalls;
        this.timeWindow = timeWindowMs;
    }

    /**
     * Check if action is allowed
     */
    public isAllowed(): boolean {
        const now = Date.now();
        this.calls = this.calls.filter(time => now - time < this.timeWindow);

        if (this.calls.length >= this.maxCalls) {
            return false;
        }

        this.calls.push(now);
        return true;
    }

    /**
     * Get remaining calls
     */
    public getRemainingCalls(): number {
        const now = Date.now();
        this.calls = this.calls.filter(time => now - time < this.timeWindow);
        return Math.max(0, this.maxCalls - this.calls.length);
    }
}

/**
 * Validate Firebase configuration
 */
export function validateFirebaseConfig(config: any): boolean {
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];

    return requiredFields.every(field =>
        typeof config[field] === 'string' && config[field].length > 0
    );
}
