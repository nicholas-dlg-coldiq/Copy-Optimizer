# Copy-Reviewer Test Suite

Comprehensive testing documentation for the Cold Email Copy Reviewer application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [What We're Testing](#what-were-testing)
- [Test Coverage](#test-coverage)
- [Writing New Tests](#writing-new-tests)
- [Mocking Strategy](#mocking-strategy)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides comprehensive coverage for the entire Copy-reviewer codebase, including:
- Frontend JavaScript (UI interactions, word counting, validation)
- Backend API routes (request validation, error handling)
- AI service integration (Claude API calls, response parsing)
- Data modules (best practices, performing copies)
- Full end-to-end workflows

**Total Test Files**: 6
**Test Framework**: Jest v30
**HTTP Testing**: Supertest
**DOM Testing**: JSDOM + Testing Library

## Test Structure

```
__tests__/
├── fixtures/
│   └── testData.js              # Mock data and test fixtures
├── setup.js                      # Global test configuration
├── unit/
│   ├── data/
│   │   ├── bestPractices.test.js        # Tests for best practices data
│   │   └── bestPerformingCopies.test.js # Tests for performing copies
│   ├── services/
│   │   └── aiService.test.js     # AI service with mocked Anthropic API
│   ├── routes/
│   │   └── review.test.js        # API route tests
│   └── frontend/
│       └── script.test.js        # Frontend JavaScript tests
└── integration/
    └── fullFlow.test.js          # End-to-end integration tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (for development)
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Only Unit Tests
```bash
npm run test:unit
```

### Run Only Integration Tests
```bash
npm run test:integration
```

### Run Tests in CI/CD Environment
```bash
npm run test:ci
```

### Run Tests with Verbose Output
```bash
npm run test:verbose
```

## What We're Testing

### 1. **Frontend JavaScript (script.js)**

#### Word Counting Logic
- ✅ Accurate word counts for various input types
- ✅ Handling of empty strings, null, undefined
- ✅ Multiple spaces, newlines, tabs
- ✅ Special characters and punctuation
- ✅ Hyphenated words
- ✅ Unicode and emoji

#### Input Validation
- ✅ Both fields required for submission
- ✅ Whitespace trimming
- ✅ Button state management based on input
- ✅ Error messages for missing fields

#### UI Interactions
- ✅ Counter updates on input
- ✅ Sample email population
- ✅ Clear functionality
- ✅ Show/hide original copy
- ✅ Copy to clipboard
- ✅ Loading states

#### Demo Mode
- ✅ Demo response generation
- ✅ Simulated delay
- ✅ Toggle between demo and API mode

#### Results Display
- ✅ Score rendering and badge updates
- ✅ Improved copy display
- ✅ Changes list rendering
- ✅ Further tips display
- ✅ XSS protection (HTML escaping)

### 2. **Backend API Routes (routes/review.js)**

#### POST /api/review-copy
- ✅ Valid input handling
- ✅ Response structure validation
- ✅ Subject line validation (required, non-empty, string)
- ✅ Email body validation (required, non-empty, string)
- ✅ Whitespace trimming
- ✅ AI service error propagation
- ✅ 400 errors for invalid input
- ✅ 500 errors for service failures

#### POST /api/improve
- ✅ Valid input with review data
- ✅ Review object validation
- ✅ AI service integration
- ✅ Error handling

#### POST /api/analyze-and-improve
- ✅ Combined workflow (review + improve)
- ✅ Sequential API calls
- ✅ Score calculation (original + 15, capped at 100)
- ✅ Response structure with original, review, improved
- ✅ Changes and tips pass-through
- ✅ Error handling for both steps

#### Edge Cases
- ✅ Very long subject lines (500+ chars)
- ✅ Very long email bodies (1000+ words)
- ✅ Special characters (<, >, &, quotes)
- ✅ Unicode characters and emoji
- ✅ Null/undefined values
- ✅ Malformed JSON
- ✅ Wrong content types

### 3. **AI Service (services/aiService.js)**

#### API Communication
- ✅ Correct Anthropic API calls with proper parameters
- ✅ Model selection (claude-3-5-sonnet-20241022)
- ✅ Temperature settings (0.7 for review, 0.8 for improve)
- ✅ Max tokens configuration
- ✅ System and user prompts

#### Response Parsing
- ✅ JSON extraction from responses
- ✅ Handling of surrounding text
- ✅ Control character cleanup
- ✅ Markdown code block handling
- ✅ Fallback responses on parse failure

#### Error Handling
- ✅ 404 errors (model not found) with clear messages
- ✅ 401 errors (invalid API key)
- ✅ 429 errors (rate limiting)
- ✅ Generic API errors
- ✅ Network failures

#### Response Validation
- ✅ Required field presence (improvedSubject, improvedBody)
- ✅ Changes array structure
- ✅ FurtherTips array initialization
- ✅ Score bounds (0-100)

#### Provider Selection
- ✅ Claude provider default
- ✅ OpenAI not implemented error
- ✅ Environment variable configuration

### 4. **Data Modules**

#### Best Practices (data/bestPractices.js)
- ✅ All required sections present
- ✅ Principle categories (Personalization, Subject Lines, etc.)
- ✅ Frameworks with examples
- ✅ Signals with triggers
- ✅ Mistakes with fixes
- ✅ CTA frameworks
- ✅ Context generation for AI (getBestPracticesContext)
- ✅ Proper markdown formatting
- ✅ Size constraints (10KB-100KB)

#### Best Performing Copies (data/bestPerformingCopies.js)
- ✅ Copy entries structure validation
- ✅ Characteristics (length, personalization, CTA type)
- ✅ Response rates (0-100%)
- ✅ Patterns arrays
- ✅ Aggregate statistics
- ✅ Common patterns with frequencies
- ✅ Summary generation (getBestCopiesSummary)
- ✅ Adding new copies (addBestPerformingCopy)
- ✅ ID assignment and timestamps

#### Data Quality
- ✅ Email lengths in optimal range (60-110 words)
- ✅ High performers have adequate personalization
- ✅ Consistent CTA types
- ✅ Actionable rules and guidance

### 5. **Integration Tests (Full Flow)**

#### Complete Workflows
- ✅ End-to-end analyze-and-improve flow
- ✅ Sequential service calls (review → improve)
- ✅ Data passing between steps
- ✅ Score calculations
- ✅ Response structure integrity

#### Error Propagation
- ✅ Review failure handling
- ✅ Improvement failure handling
- ✅ Early validation prevents service calls

#### Data Transformation
- ✅ Special character preservation
- ✅ Unicode handling
- ✅ Empty array handling

#### Performance
- ✅ Slow API response handling
- ✅ Timeout behavior

#### HTTP Handling
- ✅ Content-Type requirements
- ✅ JSON response format
- ✅ Malformed request handling

## Test Coverage

### Current Coverage Targets

```
Global Thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%
```

### Coverage by Module

| Module | Lines | Functions | Branches | Statements |
|--------|-------|-----------|----------|------------|
| `services/aiService.js` | ~85% | ~90% | ~80% | ~85% |
| `routes/review.js` | ~95% | ~95% | ~90% | ~95% |
| `data/bestPractices.js` | ~90% | ~90% | ~85% | ~90% |
| `data/bestPerformingCopies.js` | ~95% | ~95% | ~90% | ~95% |
| `script.js` | ~75% | ~80% | ~70% | ~75% |

### View Coverage Report

After running `npm run test:coverage`, open:
```
./coverage/lcov-report/index.html
```

## Writing New Tests

### Test File Template

```javascript
/**
 * Tests for [module name]
 */

const moduleToTest = require('../../path/to/module');

describe('[Module Name]', () => {
    beforeEach(() => {
        // Setup before each test
        jest.clearAllMocks();
    });

    describe('[Feature Name]', () => {
        test('should [expected behavior]', () => {
            // Arrange
            const input = 'test input';

            // Act
            const result = moduleToTest.someFunction(input);

            // Assert
            expect(result).toBe('expected output');
        });
    });
});
```

### Best Practices for Writing Tests

1. **Use Descriptive Test Names**
   ```javascript
   ✅ test('should return 400 when subject line is empty')
   ❌ test('subject validation')
   ```

2. **Follow AAA Pattern** (Arrange, Act, Assert)
   ```javascript
   test('should calculate score correctly', () => {
       // Arrange
       const originalScore = 70;

       // Act
       const improved = originalScore + 15;

       // Assert
       expect(improved).toBe(85);
   });
   ```

3. **Test One Thing Per Test**
   ```javascript
   ✅ Separate tests for different validation rules
   ❌ One test that checks everything
   ```

4. **Use Mocks Appropriately**
   ```javascript
   // Mock external dependencies
   jest.mock('../../services/aiService');

   // But don't mock the module you're testing
   ```

5. **Test Edge Cases**
   - Empty strings
   - Null/undefined
   - Very large inputs
   - Special characters
   - Boundary values

## Mocking Strategy

### Mocked Dependencies

#### 1. Anthropic SDK
```javascript
jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
const Anthropic = require('@anthropic-ai/sdk');
Anthropic.mockImplementation(() => ({
    messages: { create: mockCreate }
}));
```

#### 2. AI Service (for route tests)
```javascript
jest.mock('../../../services/aiService');

const mockAiService = require('../../../services/aiService');
mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
```

#### 3. Fetch API (for frontend tests)
```javascript
global.fetch = jest.fn();

fetch.mockResolvedValue({
    ok: true,
    json: async () => mockResponse
});
```

#### 4. Clipboard API
```javascript
navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined)
};
```

### Why We Mock

- ✅ **No Real API Calls**: Tests run without valid API keys
- ✅ **Speed**: Tests complete in milliseconds, not seconds
- ✅ **Reliability**: No network dependencies
- ✅ **Cost**: No API usage charges
- ✅ **Isolation**: Test only the code you're testing
- ✅ **Determinism**: Same results every time

## Troubleshooting

### Common Issues

#### 1. Tests Fail with "Cannot find module"
**Solution**: Ensure you're running from the project root:
```bash
cd /path/to/Copy-reviewer
npm test
```

#### 2. Timeout Errors
**Solution**: Increase timeout for slow tests:
```javascript
test('slow operation', async () => {
    // test code
}, 10000); // 10 second timeout
```

#### 3. Mock Not Working
**Solution**: Ensure mock is defined before requiring the module:
```javascript
jest.mock('./module'); // Must come BEFORE require
const module = require('./module');
```

#### 4. DOM Not Available in Tests
**Solution**: Check that setup.js is being loaded:
```javascript
// jest.config.js
setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
```

#### 5. Coverage Not Generating
**Solution**: Run with coverage flag:
```bash
npm run test:coverage
```

### Debugging Tests

#### Enable Verbose Output
```bash
npm run test:verbose
```

#### Run Single Test File
```bash
npx jest __tests__/unit/services/aiService.test.js
```

#### Run Single Test
```bash
npx jest -t "should call Claude API with correct parameters"
```

#### Enable Debug Logging
```bash
DEBUG_TESTS=true npm test
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Future Improvements

- [ ] End-to-end tests with real browser (Playwright/Puppeteer)
- [ ] Performance benchmarking tests
- [ ] Visual regression testing for UI
- [ ] Load testing for API endpoints
- [ ] Contract testing for AI responses
- [ ] Mutation testing for test quality

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure coverage thresholds are met
3. Update this documentation
4. Run full test suite before committing

---

**Questions?** Open an issue or check the main [README.md](./README.md)
