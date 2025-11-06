/**
 * Tests for API routes
 * Uses supertest to test Express routes
 */

const request = require('supertest');
const express = require('express');
const reviewRouter = require('../../../routes/review');
const { sampleEmailData, mockReviewResponse, mockImprovedResponse } = require('../../fixtures/testData');

// Mock the AI service
jest.mock('../../../services/aiService');

describe('Review API Routes', () => {
    let app;
    let mockAiService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create Express app for testing
        app = express();
        app.use(express.json());
        app.use('/api', reviewRouter);

        // Get mocked AI service
        mockAiService = require('../../../services/aiService');
    });

    describe('POST /api/review-copy', () => {
        test('should return 200 with valid input', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('overallScore');
            expect(response.body).toHaveProperty('sections');
        });

        test('should call aiService.reviewCopy with correct parameters', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(mockAiService.reviewCopy).toHaveBeenCalledWith(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );
        });

        test('should return 400 if subject line is missing', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('Subject line is required');
        });

        test('should return 400 if subject line is empty string', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: '   ',
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('Subject line is required');
        });

        test('should return 400 if subject line is not a string', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: 123,
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('must be a non-empty string');
        });

        test('should return 400 if email body is missing', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject
                })
                .expect(400);

            expect(response.body.message).toContain('Email body is required');
        });

        test('should return 400 if email body is empty', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: ''
                })
                .expect(400);

            expect(response.body.message).toContain('Email body is required');
        });

        test('should return 500 if AI service fails', async () => {
            mockAiService.reviewCopy.mockRejectedValue(new Error('AI service error'));

            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Review failed');
        });

        test('should pass inputs as-is to AI service', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const subjectWithSpaces = '  ' + sampleEmailData.validSubject + '  ';
            const bodyWithSpaces = '  ' + sampleEmailData.validBody + '  ';

            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: subjectWithSpaces,
                    copy: bodyWithSpaces
                });

            // Inputs are passed as-is (not trimmed)
            expect(mockAiService.reviewCopy).toHaveBeenCalledWith(
                subjectWithSpaces,
                bodyWithSpaces
            );
        });
    });

    describe('POST /api/improve', () => {
        const mockReview = mockReviewResponse;

        test('should return 200 with valid input', async () => {
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            const response = await request(app)
                .post('/api/improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody,
                    review: mockReview
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('improvedSubject');
            expect(response.body).toHaveProperty('improvedBody');
            expect(response.body).toHaveProperty('changes');
        });

        test('should call aiService.improveCopy with correct parameters', async () => {
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            await request(app)
                .post('/api/improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody,
                    review: mockReview
                });

            expect(mockAiService.improveCopy).toHaveBeenCalledWith(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReview
            );
        });

        test('should return 400 if review is missing', async () => {
            const response = await request(app)
                .post('/api/improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('Review data is required');
        });

        test('should return 400 if review is not an object', async () => {
            const response = await request(app)
                .post('/api/improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody,
                    review: 'not an object'
                })
                .expect(400);

            expect(response.body.message).toContain('Review data is required');
        });

        test('should return 500 if AI service fails', async () => {
            mockAiService.improveCopy.mockRejectedValue(new Error('Improvement failed'));

            const response = await request(app)
                .post('/api/improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody,
                    review: mockReview
                })
                .expect(500);

            expect(response.body.error).toBe('Improvement failed');
        });
    });

    describe('POST /api/analyze-and-improve', () => {
        test('should return combined response with valid input', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(200);

            expect(response.body).toHaveProperty('original');
            expect(response.body).toHaveProperty('review');
            expect(response.body).toHaveProperty('improved');
            expect(response.body).toHaveProperty('changes');
            expect(response.body).toHaveProperty('furtherTips');

            expect(response.body.original.subjectLine).toBe(sampleEmailData.validSubject);
            expect(response.body.original.copy).toBe(sampleEmailData.validBody);
        });

        test('should call both reviewCopy and improveCopy', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(mockAiService.reviewCopy).toHaveBeenCalledWith(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(mockAiService.improveCopy).toHaveBeenCalledWith(
                sampleEmailData.validSubject,
                sampleEmailData.validBody,
                mockReviewResponse
            );
        });

        test('should include score in review object', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(response.body.review.score).toBe(mockReviewResponse.overallScore);
            expect(response.body.review.originalScore).toBe(mockReviewResponse.overallScore);
        });

        test('should calculate improved score estimate', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(response.body.improved.score).toBeGreaterThan(response.body.review.score);
            expect(response.body.improved.score).toBeLessThanOrEqual(100);
        });

        test('should return 400 with missing subject line', async () => {
            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('Subject line is required');
        });

        test('should return 400 with missing email body', async () => {
            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject
                })
                .expect(400);

            expect(response.body.message).toContain('Email body is required');
        });

        test('should return 500 if reviewCopy fails', async () => {
            mockAiService.reviewCopy.mockRejectedValue(new Error('Review failed'));

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(500);

            expect(response.body.error).toBe('Analysis failed');
        });

        test('should return 500 if improveCopy fails', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockRejectedValue(new Error('Improvement failed'));

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(500);

            expect(response.body.error).toBe('Analysis failed');
        });

        test('should include expectedImpact if provided', async () => {
            const improvedResponseWithImpact = {
                ...mockImprovedResponse,
                expectedImpact: 'Should improve open rates by 25%'
            };

            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(improvedResponseWithImpact);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(response.body.expectedImpact).toBe('Should improve open rates by 25%');
        });

        test('should pass through all changes from improvement', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);
            mockAiService.improveCopy.mockResolvedValue(mockImprovedResponse);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                });

            expect(response.body.changes).toEqual(mockImprovedResponse.changes);
            expect(response.body.furtherTips).toEqual(mockImprovedResponse.furtherTips);
        });
    });

    describe('Input validation edge cases', () => {
        test('should reject null subject line', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: null,
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('Subject line is required');
        });

        test('should reject undefined in JSON body', async () => {
            const response = await request(app)
                .post('/api/review-copy')
                .send({
                    copy: sampleEmailData.validBody
                })
                .expect(400);

            expect(response.body.message).toContain('Subject line is required');
        });

        test('should handle very long subject lines', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const longSubject = 'a'.repeat(500);
            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: longSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(200);

            expect(mockAiService.reviewCopy).toHaveBeenCalledWith(
                longSubject,
                sampleEmailData.validBody
            );
        });

        test('should handle very long email bodies', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const longBody = 'word '.repeat(1000);
            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: longBody
                })
                .expect(200);
        });

        test('should handle special characters in input', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const specialChars = 'Test "quotes" & <tags> \n\t special';
            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: specialChars,
                    copy: specialChars
                })
                .expect(200);

            expect(mockAiService.reviewCopy).toHaveBeenCalledWith(
                specialChars,
                specialChars
            );
        });

        test('should handle unicode characters', async () => {
            mockAiService.reviewCopy.mockResolvedValue(mockReviewResponse);

            const unicode = 'Test 测试 🚀 emoji';
            await request(app)
                .post('/api/review-copy')
                .send({
                    subjectLine: unicode,
                    copy: unicode
                })
                .expect(200);
        });
    });
});
