/**
 * Application Constants
 * Centralized configuration for timeouts, limits, and model parameters
 */

// ==============================================
// API TIMEOUTS
// ==============================================

// Frontend API request timeout (90 seconds)
const API_TIMEOUT_MS = 90000;

// Anthropic API timeout (60 seconds)
const ANTHROPIC_TIMEOUT_MS = 60000;

// ==============================================
// VALIDATION LIMITS
// ==============================================

// Maximum characters for subject line
const MAX_SUBJECT_LENGTH = 200;

// Maximum characters for email body
const MAX_BODY_LENGTH = 2000;

// Minimum words for subject line
const MIN_SUBJECT_WORDS = 50;

// Word count limits for validation
const WORD_COUNT_LIMITS = {
    SUBJECT_MAX: 10,
    BODY_MAX: 200
};

// ==============================================
// AI MODEL PARAMETERS
// ==============================================

// Token limits for different request types
const TOKEN_LIMITS = {
    REVIEW: 3000,
    IMPROVE: 3000,
    COMBINED: 4000
};

// Temperature settings for AI models
const AI_TEMPERATURE = {
    STANDARD: 0.7,
    CREATIVE: 0.8
};

// Default model
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

// ==============================================
// RATE LIMITING
// ==============================================

// General API rate limit
const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 50
};

// Review endpoint rate limit (stricter)
const REVIEW_RATE_LIMIT = {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 20
};

// ==============================================
// REQUEST SIZE LIMITS
// ==============================================

// Maximum JSON payload size
const MAX_REQUEST_SIZE = '100kb';

// ==============================================
// SESSION CONFIGURATION
// ==============================================

// Session ID generation base
const SESSION_ID_BASE = 36;

// ==============================================
// HTTP STATUS CODES
// ==============================================

const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

// ==============================================
// OPENROUTER CONFIGURATION
// ==============================================

const OPENROUTER_SITE_URL = 'https://coldiq.com';
const OPENROUTER_SITE_NAME = 'ColdIQ Email Optimizer';

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    // Timeouts
    API_TIMEOUT_MS,
    ANTHROPIC_TIMEOUT_MS,

    // Validation Limits
    MAX_SUBJECT_LENGTH,
    MAX_BODY_LENGTH,
    MIN_SUBJECT_WORDS,
    WORD_COUNT_LIMITS,

    // AI Parameters
    TOKEN_LIMITS,
    AI_TEMPERATURE,
    DEFAULT_MODEL,

    // Rate Limiting
    RATE_LIMIT,
    REVIEW_RATE_LIMIT,

    // Request Limits
    MAX_REQUEST_SIZE,

    // Session
    SESSION_ID_BASE,

    // HTTP Status
    HTTP_STATUS,

    // OpenRouter
    OPENROUTER_SITE_URL,
    OPENROUTER_SITE_NAME
};
