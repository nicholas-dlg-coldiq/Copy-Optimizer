const { validateEmailInput, sanitizeInput } = require('../services/validationService');

/**
 * Middleware to validate and sanitize email request data
 * Checks for required fields, validates types, runs security checks, and sanitizes inputs
 */
function validateEmailRequest(req, res, next) {
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

    // Security validation - check for malicious input
    const validationErrors = validateEmailInput(subjectLine, copy);
    if (validationErrors.length > 0) {
        console.warn('⚠️  Security validation failed:', validationErrors);
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Your input contains invalid content. Please ensure you are submitting a legitimate email for review.',
            details: validationErrors
        });
    }

    // Sanitize inputs and attach to request for use in route handlers
    req.sanitizedSubject = sanitizeInput(subjectLine);
    req.sanitizedCopy = sanitizeInput(copy);

    next();
}

/**
 * Middleware to validate email address field
 */
function validateEmailAddress(req, res, next) {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'Email address is required and must be a non-empty string'
        });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'Please provide a valid email address'
        });
    }

    req.sanitizedEmail = email.trim();
    next();
}

/**
 * Middleware to validate review object for improve endpoint
 */
function validateReviewData(req, res, next) {
    const { review } = req.body;

    if (!review || typeof review !== 'object') {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'Review data is required'
        });
    }

    next();
}

module.exports = {
    validateEmailRequest,
    validateEmailAddress,
    validateReviewData
};
