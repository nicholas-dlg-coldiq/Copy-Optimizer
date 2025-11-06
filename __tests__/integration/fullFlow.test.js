/**
 * Integration tests for full application flow
 * Tests the complete workflow from API request to response
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const reviewRouter = require('../../routes/review');
const { sampleEmailData } = require('../fixtures/testData');

// Mock AI service for integration tests
jest.mock('../../services/aiService');

describe('Full Application Flow Integration Tests', () => {
    let app;
    let mockAiService;

    beforeAll(() => {
        // Set up Express app with all middleware
        app = express();
        app.use(express.json());
        app.use(express.static(path.join(__dirname, '../..')));
        app.use('/api', reviewRouter);

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({
                error: 'Something went wrong!',
                message: err.message
            });
        });

        mockAiService = require('../../services/aiService');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Complete analyze-and-improve workflow', () => {
        test('should successfully complete full workflow with valid input', async () => {
            const mockReview = {
                overallScore: 75,
                sections: [
                    {
                        title: 'Subject Line',
                        content: 'Good length',
                        items: ['Item 1']
                    }
                ]
            };

            const mockImprovement = {
                improvedSubject: 'Improved subject',
                improvedBody: 'Improved body',
                changes: [
                    {
                        category: 'Subject',
                        issue: 'Too generic',
                        reason: 'Added personalization',
                        why: 'Increases opens by 26%',
                        summary: 'Made it personal',
                        detail: 'Detailed explanation',
                        signal: ''
                    }
                ],
                furtherTips: ['Tip 1', 'Tip 2', 'Tip 3'],
                expectedImpact: 'Should improve response rate'
            };

            mockAiService.reviewCopy.mockResolvedValue(mockReview);
            mockAiService.improveCopy.mockResolvedValue(mockImprovement);

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                })
                .expect(200);

            // Verify response structure
            expect(response.body).toMatchObject({
                original: {
                    subjectLine: sampleEmailData.validSubject,
                    copy: sampleEmailData.validBody
                },
                review: {
                    score: 75,
                    originalScore: 75
                },
                improved: {
                    subjectLine: 'Improved subject',
                    copy: 'Improved body',
                    score: expect.any(Number)
                },
                changes: expect.arrayContaining([
                    expect.objectContaining({
                        category: 'Subject',
                        issue: 'Too generic'
                    })
                ]),
                furtherTips: ['Tip 1', 'Tip 2', 'Tip 3'],
                expectedImpact: 'Should improve response rate'
            });

            // Verify both service methods were called
            expect(mockAiService.reviewCopy).toHaveBeenCalledTimes(1);
            expect(mockAiService.improveCopy).toHaveBeenCalledTimes(1);
        });

        test('should handle sequential API calls correctly', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 60,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'New subject',
                improvedBody: 'New body',
                changes: [],
                furtherTips: []
            });

            await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect(200);

            // Verify review was called before improve
            const reviewCallOrder = mockAiService.reviewCopy.mock.invocationCallOrder[0];
            const improveCallOrder = mockAiService.improveCopy.mock.invocationCallOrder[0];

            expect(reviewCallOrder).toBeLessThan(improveCallOrder);
        });

        test('should pass review results to improvement step', async () => {
            const reviewResult = {
                overallScore: 55,
                sections: [{ title: 'Test', content: 'Test content', items: [] }]
            };

            mockAiService.reviewCopy.mockResolvedValue(reviewResult);
            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'Subject',
                improvedBody: 'Body',
                changes: [],
                furtherTips: []
            });

            await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect(200);

            // Verify improve was called with review results
            expect(mockAiService.improveCopy).toHaveBeenCalledWith(
                'Test',
                'Test body',
                reviewResult
            );
        });

        test('should calculate improved score correctly', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'Subject',
                improvedBody: 'Body',
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                });

            // Improved score should be original + 15, capped at 100
            expect(response.body.improved.score).toBe(85);
            expect(response.body.improved.score).toBeGreaterThan(response.body.review.score);
        });

        test('should cap improved score at 100', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 95,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'Subject',
                improvedBody: 'Body',
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                });

            expect(response.body.improved.score).toBe(100);
        });
    });

    describe('Error handling across the flow', () => {
        test('should handle review failure gracefully', async () => {
            mockAiService.reviewCopy.mockRejectedValue(new Error('Review API failed'));

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect(500);

            expect(response.body.error).toBe('Analysis failed');
            expect(mockAiService.improveCopy).not.toHaveBeenCalled();
        });

        test('should handle improvement failure gracefully', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockRejectedValue(new Error('Improvement API failed'));

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect(500);

            expect(response.body.error).toBe('Analysis failed');
        });

        test('should validate input before calling services', async () => {
            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: '',
                    copy: 'Test body'
                })
                .expect(400);

            expect(mockAiService.reviewCopy).not.toHaveBeenCalled();
            expect(mockAiService.improveCopy).not.toHaveBeenCalled();
        });

        test('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/analyze-and-improve')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            // Express returns 500 for JSON parse errors
            expect([400, 500]).toContain(response.status);
        });
    });

    describe('Data transformation through the pipeline', () => {
        test('should preserve special characters through the pipeline', async () => {
            const specialText = 'Test "quotes" & <tags> \n\t special';

            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: specialText,
                improvedBody: specialText,
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: specialText,
                    copy: specialText
                });

            expect(response.body.original.subjectLine).toBe(specialText);
            expect(response.body.original.copy).toBe(specialText);
            expect(response.body.improved.subjectLine).toBe(specialText);
            expect(response.body.improved.copy).toBe(specialText);
        });

        test('should handle unicode characters correctly', async () => {
            const unicode = 'Test 测试 🚀 emoji';

            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: unicode,
                improvedBody: unicode,
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: unicode,
                    copy: unicode
                });

            expect(response.body.improved.subjectLine).toBe(unicode);
        });

        test('should handle empty arrays in response', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'Subject',
                improvedBody: 'Body',
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                });

            expect(Array.isArray(response.body.changes)).toBe(true);
            expect(Array.isArray(response.body.furtherTips)).toBe(true);
            expect(response.body.changes.length).toBe(0);
            expect(response.body.furtherTips.length).toBe(0);
        });
    });

    describe('Performance and timeout handling', () => {
        test('should handle slow API responses', async () => {
            mockAiService.reviewCopy.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    overallScore: 70,
                    sections: []
                }), 100))
            );

            mockAiService.improveCopy.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    improvedSubject: 'Subject',
                    improvedBody: 'Body',
                    changes: [],
                    furtherTips: []
                }), 100))
            );

            const startTime = Date.now();

            await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(duration).toBeGreaterThanOrEqual(200); // At least 200ms for both calls
        }, 10000);
    });

    describe('Content-Type and Header handling', () => {
        test('should require application/json content type', async () => {
            const response = await request(app)
                .post('/api/analyze-and-improve')
                .set('Content-Type', 'text/plain')
                .send('plain text')
                .expect(400);
        });

        test('should return JSON response', async () => {
            mockAiService.reviewCopy.mockResolvedValue({
                overallScore: 70,
                sections: []
            });

            mockAiService.improveCopy.mockResolvedValue({
                improvedSubject: 'Subject',
                improvedBody: 'Body',
                changes: [],
                furtherTips: []
            });

            const response = await request(app)
                .post('/api/analyze-and-improve')
                .send({
                    subjectLine: 'Test',
                    copy: 'Test body'
                })
                .expect('Content-Type', /json/);
        });
    });
});
