/**
 * Simple in-memory rate limiter for serverless environments.
 * Note: This resets between cold starts but provides basic protection within a single instance.
 * For distributed rate limiting, consider @upstash/ratelimit.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store.entries()) {
        if (now >= entry.resetTime) {
            store.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number; // ms until reset
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60_000, // 1 minute
};

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
    cleanup();
    const now = Date.now();
    const key = `rl:${identifier}`;

    let entry = store.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
        entry = { count: 1, resetTime: now + config.windowMs };
        store.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    // Increment and check
    entry.count++;

    if (entry.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}
