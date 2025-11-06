/**
 * Jest configuration for Copy-reviewer tests
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        'data/**/*.js',
        'script.js',
        '!**/node_modules/**',
        '!**/__tests__/**'
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Coverage directory
    coverageDirectory: 'coverage',

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Reset mocks between tests
    resetMocks: true,

    // Restore mocks between tests
    restoreMocks: true,

    // Test timeout
    testTimeout: 10000,

    // Module paths
    moduleDirectories: ['node_modules', '<rootDir>'],

    // Transform ignore patterns (don't transform node_modules except specific packages if needed)
    transformIgnorePatterns: [
        'node_modules/(?!(@anthropic-ai)/)'
    ]
};
