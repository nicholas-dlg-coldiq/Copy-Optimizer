/**
 * Tests for AI Service
 * Uses mocked Anthropic API to test without real API calls
 */

const { sampleEmailData, mockReviewResponse, mockImprovedResponse } = require('../../fixtures/testData');

// Mock the Anthropic SDK before requiring aiService
jest.mock('@anthropic-ai/sdk');

describe('AIService', () => {
    let aiService;
    let mockAnthropicInstance;
    let mockCreate;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        jest.resetModules();

        // Create mock for messages.create
        mockCreate = jest.fn();
        mockAnthropicInstance = {
            messages: {
                create: mockCreate
            }
        };

        // Mock the Anthropic constructor
        const Anthropic = require('@anthropic-ai/sdk');
        Anthropic.mockImplementation(() => mockAnthropicInstance);

        // Set environment variable
        process.env.AI_PROVIDER = 'claude';
        process.env.ANTHROPIC_API_KEY = 'test-key';

        // Require aiService after mocking
        aiService = require('../../../services/aiService');
    });

    describe('reviewCopy()', () => {
        test('should call Claude API with correct parameters', async () => {
            // Mock successful API response
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockReviewResponse)
                }]
            });

            await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(mockCreate).toHaveBeenCalledTimes(1);
            const callArgs = mockCreate.mock.calls[0][0];

            expect(callArgs).toHaveProperty('model');
            expect(callArgs).toHaveProperty('max_tokens', 2000);
            expect(callArgs).toHaveProperty('temperature', 0.7);
            expect(callArgs).toHaveProperty('system');
            expect(callArgs).toHaveProperty('messages');
            expect(callArgs.messages[0].role).toBe('user');
        });

        test('should parse valid JSON response correctly', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockReviewResponse)
                }]
            });

            const result = await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result).toHaveProperty('overallScore');
            expect(result).toHaveProperty('sections');
            expect(result.overallScore).toBe(mockReviewResponse.overallScore);
            expect(Array.isArray(result.sections)).toBe(true);
        });

        test('should handle API error with 404 status', async () => {
            const error = new Error('Model not found');
            error.status = 404;
            error.message = 'model not found';
            mockCreate.mockRejectedValue(error);

            await expect(aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            )).rejects.toThrow('Claude API model not found');
        });

        test('should handle API error with 401 status', async () => {
            const error = new Error('Unauthorized');
            error.status = 401;
            mockCreate.mockRejectedValue(error);

            await expect(aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            )).rejects.toThrow('Invalid or expired Anthropic API key');
        });

        test('should handle API error with 429 status', async () => {
            const error = new Error('Rate limit');
            error.status = 429;
            mockCreate.mockRejectedValue(error);

            await expect(aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            )).rejects.toThrow('Rate limit exceeded');
        });

        test('should handle generic API errors', async () => {
            const error = new Error('Network error');
            error.status = 500;
            mockCreate.mockRejectedValue(error);

            await expect(aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            )).rejects.toThrow('Failed to get review from Claude API');
        });

        test('should parse JSON even with surrounding text', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: `Here is the analysis:\n${JSON.stringify(mockReviewResponse)}\nThat's my feedback.`
                }]
            });

            const result = await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result.overallScore).toBe(mockReviewResponse.overallScore);
        });

        test('should return fallback response if JSON parsing fails', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: 'This is not valid JSON at all'
                }]
            });

            const result = await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            // Should return fallback
            expect(result).toHaveProperty('overallScore');
            expect(result).toHaveProperty('sections');
            expect(result.overallScore).toBe(50); // Fallback score
        });

        test('should include subject and body in user prompt', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockReviewResponse)
                }]
            });

            await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            const userMessage = mockCreate.mock.calls[0][0].messages[0].content;
            expect(userMessage).toContain(sampleEmailData.validSubject);
            expect(userMessage).toContain(sampleEmailData.validBody);
        });

        test('should include best practices in system prompt', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockReviewResponse)
                }]
            });

            await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            const systemPrompt = mockCreate.mock.calls[0][0].system;
            expect(systemPrompt).toContain('COLD EMAIL BEST PRACTICES');
            expect(systemPrompt).toContain('Personalization');
            expect(systemPrompt).toContain('70-95 words');
        });
    });

    describe('improveCopy()', () => {
        const mockReview = mockReviewResponse;

        test('should call Claude API with review feedback', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockImprovedResponse)
                }]
            });

            await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );

            expect(mockCreate).toHaveBeenCalledTimes(1);
            const callArgs = mockCreate.mock.calls[0][0];

            expect(callArgs.model).toBeDefined();
            expect(callArgs.temperature).toBe(0.8); // Higher temp for improvement

            const userMessage = callArgs.messages[0].content;
            expect(userMessage).toContain(sampleEmailData.validSubject);
            expect(userMessage).toContain(sampleEmailData.validBody);
            expect(userMessage).toContain(mockReview.overallScore.toString());
        });

        test('should return improved subject and body', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockImprovedResponse)
                }]
            });

            const result = await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );

            expect(result).toHaveProperty('improvedSubject');
            expect(result).toHaveProperty('improvedBody');
            expect(result).toHaveProperty('changes');
            expect(result).toHaveProperty('furtherTips');
            expect(Array.isArray(result.changes)).toBe(true);
            expect(Array.isArray(result.furtherTips)).toBe(true);
        });

        test('should handle improvement API errors', async () => {
            const error = new Error('API Error');
            error.status = 500;
            mockCreate.mockRejectedValue(error);

            await expect(aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            )).rejects.toThrow('Failed to generate improved copy');
        });

        test('should validate improved response structure', async () => {
            const incompleteResponse = {
                improvedSubject: 'Test',
                // Missing improvedBody
            };

            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(incompleteResponse)
                }]
            });

            await expect(aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            )).rejects.toThrow();
        });

        test('should ensure furtherTips is an array', async () => {
            const responseWithoutTips = {
                improvedSubject: 'Test Subject',
                improvedBody: 'Test Body',
                changes: [],
                // furtherTips missing
            };

            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(responseWithoutTips)
                }]
            });

            const result = await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );

            expect(Array.isArray(result.furtherTips)).toBe(true);
            expect(result.furtherTips.length).toBe(0);
        });

        test('should include changes array with proper structure', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockImprovedResponse)
                }]
            });

            const result = await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );

            expect(result.changes.length).toBeGreaterThan(0);
            result.changes.forEach(change => {
                expect(change).toHaveProperty('category');
                expect(change).toHaveProperty('issue');
                expect(change).toHaveProperty('reason');
                expect(change).toHaveProperty('why');
                expect(change).toHaveProperty('summary');
            });
        });

        test('should include best practices in improvement system prompt', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockImprovedResponse)
                }]
            });

            await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );

            const systemPrompt = mockCreate.mock.calls[0][0].system;
            expect(systemPrompt).toContain('expert cold email copywriter');
            expect(systemPrompt).toContain('BEST PERFORMING PATTERNS');
            expect(systemPrompt).toContain('70-95 words');
        });
    });

    describe('provider selection', () => {
        test('should throw error for OpenAI provider (not implemented)', async () => {
            process.env.AI_PROVIDER = 'openai';

            // Re-require to pick up new env
            jest.resetModules();
            const Anthropic = require('@anthropic-ai/sdk');
            Anthropic.mockImplementation(() => mockAnthropicInstance);
            aiService = require('../../../services/aiService');

            await expect(aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            )).rejects.toThrow('OpenAI integration not yet implemented');
        });

        test('should default to claude provider', async () => {
            delete process.env.AI_PROVIDER;

            jest.resetModules();
            const Anthropic = require('@anthropic-ai/sdk');
            Anthropic.mockImplementation(() => mockAnthropicInstance);
            aiService = require('../../../services/aiService');

            mockCreate.mockResolvedValue({
                content: [{
                    text: JSON.stringify(mockReviewResponse)
                }]
            });

            await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(mockCreate).toHaveBeenCalled();
        });
    });

    describe('response parsing edge cases', () => {
        test('should handle control characters in JSON', async () => {
            const responseWithControlChars = JSON.stringify(mockImprovedResponse)
                .replace('Test', 'Test\n\t');

            mockCreate.mockResolvedValue({
                content: [{
                    text: responseWithControlChars
                }]
            });

            const result = await aiService.improveCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReviewResponse
            );

            expect(result).toHaveProperty('improvedSubject');
            expect(result).toHaveProperty('improvedBody');
        });

        test('should extract JSON from markdown code blocks', async () => {
            mockCreate.mockResolvedValue({
                content: [{
                    text: `\`\`\`json\n${JSON.stringify(mockReviewResponse)}\n\`\`\``
                }]
            });

            const result = await aiService.reviewCopy(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result.overallScore).toBe(mockReviewResponse.overallScore);
        });
    });
});
