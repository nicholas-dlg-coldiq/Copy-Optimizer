/**
 * Test setup file
 * Configures global test utilities
 */

// Mock fetch for frontend tests
global.fetch = jest.fn();

// Mock AbortSignal.timeout for older Node versions
if (!AbortSignal.timeout) {
    AbortSignal.timeout = (ms) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}

// Suppress console errors in tests unless debugging
if (!process.env.DEBUG_TESTS) {
    global.console.error = jest.fn();
}

// Note: JSDOM setup removed to avoid ESM import issues
// Frontend tests that need DOM should set up their own DOM environment
