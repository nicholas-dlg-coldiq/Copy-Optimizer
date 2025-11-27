const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const databaseService = require('../services/databaseService');
const { validateEmailRequest, validateEmailAddress, validateReviewData } = require('../middleware/validateEmailRequest');

// Helper function to format time in both ms and seconds
function formatTime(ms) {
    return `${ms}ms (${(ms / 1000).toFixed(2)}s)`;
}

// POST /api/review-copy
router.post('/review-copy', validateEmailRequest, async (req, res) => {
    try {
        // Get review from AI service (middleware already validated and sanitized)
        const review = await aiService.reviewCopy(req.sanitizedSubject, req.sanitizedCopy);

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
router.post('/improve', validateEmailRequest, validateReviewData, async (req, res) => {
    try {
        const { review } = req.body;

        // Get improved copy from AI service (middleware already validated and sanitized)
        const improvedCopy = await aiService.improveCopy(req.sanitizedSubject, req.sanitizedCopy, review);

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
router.post('/analyze-and-improve', validateEmailRequest, validateEmailAddress, async (req, res) => {
    const requestStartTime = Date.now();
    console.log('\n========================================');
    console.log('COMBINED ANALYZE-AND-IMPROVE REQUEST');
    console.log('Started at:', new Date().toISOString());
    console.log('========================================\n');

    try {
        const { model } = req.body;

        // Log model selection
        const selectedModel = model || 'claude-sonnet-4-5-20250929';
        console.log(`Using model: ${selectedModel}`);

        // Create a new session for this combined analyze+improve
        const sessionId = aiService.createSession();
        console.log(`Session created: ${sessionId}`);

        // Single combined API call (use sanitized inputs from middleware)
        console.log('Starting COMBINED analyze-and-improve API call...');
        const result = await aiService.analyzeAndImprove(req.sanitizedSubject, req.sanitizedCopy, selectedModel);

        const totalDuration = Date.now() - requestStartTime;
        console.log('\n========================================');
        console.log('REQUEST COMPLETED SUCCESSFULLY');
        console.log(`Total request time: ${formatTime(totalDuration)}`);
        console.log('Completed at:', new Date().toISOString());
        console.log('========================================\n');

        // Track usage in database (non-blocking, won't affect response)
        try {
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

            await databaseService.trackCopyGraderUsage({
                email: req.sanitizedEmail,
                sessionId: sessionId,
                userAgent: userAgent,
                ipAddress: ipAddress
            });
        } catch (dbError) {
            // Log error but don't fail the request
            console.error('⚠️  Database tracking failed (non-critical):', dbError.message);
        }

        // Return combined response
        res.json({
            original: {
                subjectLine: req.sanitizedSubject,
                copy: req.sanitizedCopy
            },
            review: {
                score: result.overallScore,
                originalScore: result.overallScore
            },
            improved: {
                subjectLine: result.improvedSubject,
                copy: result.improvedBody,
                score: Math.min(100, result.overallScore + 15) // Estimated improvement
            },
            changes: result.changes || [],
            furtherTips: result.furtherTips || [],
            expectedImpact: result.expectedImpact
        });
    } catch (error) {
        const totalDuration = Date.now() - requestStartTime;
        console.error('\n========================================');
        console.error('REQUEST FAILED');
        console.error(`Total time before error: ${formatTime(totalDuration)}`);
        console.error('Error:', error.message);
        console.error('Failed at:', new Date().toISOString());
        console.error('========================================\n');

        // Determine appropriate error message based on error type
        let statusCode = 500;
        let userMessage = 'We encountered an issue analyzing your email. Please try again.';

        if (error.message && error.message.includes('parse')) {
            userMessage = 'We had trouble processing your email. Please make sure it\'s a legitimate cold email and try again.';
        } else if (error.message && error.message.includes('timeout')) {
            userMessage = 'The request took too long to process. Please try again with a shorter email.';
            statusCode = 504;
        } else if (error.message && error.message.includes('API')) {
            userMessage = 'Our AI service is temporarily unavailable. Please try again in a moment.';
            statusCode = 503;
        } else if (error.message && error.message.includes('rate limit')) {
            userMessage = 'Too many requests. Please wait a moment and try again.';
            statusCode = 429;
        }

        res.status(statusCode).json({
            error: 'Analysis failed',
            message: userMessage,
            technical: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
