const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// POST /api/review-copy
router.post('/review-copy', async (req, res) => {
    try {
        const { subjectLine, copy } = req.body;

        // Validate subject line
        if (!subjectLine || typeof subjectLine !== 'string' || subjectLine.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Subject line is required and must be a non-empty string'
            });
        }

        // Validate email body
        if (!copy || typeof copy !== 'string' || copy.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Email body is required and must be a non-empty string'
            });
        }

        // Get review from AI service
        const review = await aiService.reviewCopy(subjectLine, copy);

        res.json(review);
    } catch (error) {
        console.error('Error in review-copy endpoint:', error);
        res.status(500).json({
            error: 'Review failed',
            message: error.message || 'Failed to review the copy. Please try again.'
        });
    }
});

// POST /api/improve
router.post('/improve', async (req, res) => {
    try {
        const { subjectLine, copy, review } = req.body;

        // Validate inputs
        if (!subjectLine || typeof subjectLine !== 'string' || subjectLine.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Subject line is required and must be a non-empty string'
            });
        }

        if (!copy || typeof copy !== 'string' || copy.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Email body is required and must be a non-empty string'
            });
        }

        if (!review || typeof review !== 'object') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Review data is required'
            });
        }

        // Get improved copy from AI service
        const improvedCopy = await aiService.improveCopy(subjectLine, copy, review);

        res.json(improvedCopy);
    } catch (error) {
        console.error('Error in improve endpoint:', error);
        res.status(500).json({
            error: 'Improvement failed',
            message: error.message || 'Failed to generate improved copy. Please try again.'
        });
    }
});

// POST /api/analyze-and-improve - Combined endpoint
router.post('/analyze-and-improve', async (req, res) => {
    const requestStartTime = Date.now();
    console.log('\n========================================');
    console.log('COMBINED ANALYZE-AND-IMPROVE REQUEST');
    console.log('Started at:', new Date().toISOString());
    console.log('========================================\n');

    try {
        const { subjectLine, copy, model } = req.body;

        // Validate subject line
        if (!subjectLine || typeof subjectLine !== 'string' || subjectLine.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Subject line is required and must be a non-empty string'
            });
        }

        // Validate email body
        if (!copy || typeof copy !== 'string' || copy.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Email body is required and must be a non-empty string'
            });
        }

        // Log model selection
        const selectedModel = model || 'claude-sonnet-4-5-20250929';
        console.log(`Using model: ${selectedModel}`);

        // Create a new session for this review+improve pair
        const sessionId = aiService.createSession();
        console.log(`Session created: ${sessionId}`);

        // Step 1: Get review from AI service
        console.log('[Step 1/2] Starting REVIEW API call...');
        const reviewStartTime = Date.now();
        const review = await aiService.reviewCopy(subjectLine, copy, selectedModel);
        const reviewDuration = Date.now() - reviewStartTime;
        console.log(`[Step 1/2] REVIEW completed in ${reviewDuration}ms`);
        console.log(`Total elapsed time: ${Date.now() - requestStartTime}ms\n`);

        // Step 2: Get improved copy from AI service
        console.log('[Step 2/2] Starting IMPROVE API call...');
        const improveStartTime = Date.now();
        const improvedCopy = await aiService.improveCopy(subjectLine, copy, review, selectedModel);
        const improveDuration = Date.now() - improveStartTime;
        console.log(`[Step 2/2] IMPROVE completed in ${improveDuration}ms`);

        const totalDuration = Date.now() - requestStartTime;
        console.log('\n========================================');
        console.log('REQUEST COMPLETED SUCCESSFULLY');
        console.log(`Review took: ${reviewDuration}ms`);
        console.log(`Improve took: ${improveDuration}ms`);
        console.log(`Total request time: ${totalDuration}ms`);
        console.log('Completed at:', new Date().toISOString());
        console.log('========================================\n');

        // Return combined response
        res.json({
            original: {
                subjectLine,
                copy
            },
            review: {
                score: review.overallScore,
                originalScore: review.overallScore
            },
            improved: {
                subjectLine: improvedCopy.improvedSubject,
                copy: improvedCopy.improvedBody,
                score: Math.min(100, review.overallScore + 15) // Estimated improvement
            },
            changes: improvedCopy.changes || [],
            furtherTips: improvedCopy.furtherTips || [],
            expectedImpact: improvedCopy.expectedImpact
        });
    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        console.error('\n========================================');
        console.error('REQUEST FAILED');
        console.error(`Total time before error: ${totalDuration}ms`);
        console.error('Error:', error.message);
        console.error('Failed at:', new Date().toISOString());
        console.error('========================================\n');

        res.status(500).json({
            error: 'Analysis failed',
            message: error.message || 'Failed to analyze and improve the copy. Please try again.'
        });
    }
});

module.exports = router;
