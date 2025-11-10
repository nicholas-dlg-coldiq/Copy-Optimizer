const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const databaseService = require('../services/databaseService');

// Helper function to format time in both ms and seconds
function formatTime(ms) {
    return `${ms}ms (${(ms / 1000).toFixed(2)}s)`;
}

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
        const { subjectLine, copy, model, email } = req.body;

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

        // Validate email address
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Email address is required and must be a non-empty string'
            });
        }

        // Log model selection
        const selectedModel = model || 'claude-sonnet-4-5-20250929';
        console.log(`Using model: ${selectedModel}`);

        // Create a new session for this combined analyze+improve
        const sessionId = aiService.createSession();
        console.log(`Session created: ${sessionId}`);

        // Single combined API call
        console.log('Starting COMBINED analyze-and-improve API call...');
        const result = await aiService.analyzeAndImprove(subjectLine, copy, selectedModel);

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
                email: email.trim(),
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
                subjectLine,
                copy
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

        res.status(500).json({
            error: 'Analysis failed',
            message: error.message || 'Failed to analyze and improve the copy. Please try again.'
        });
    }
});

module.exports = router;
