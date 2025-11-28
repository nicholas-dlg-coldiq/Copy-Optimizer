/**
 * Best Practices and Guidelines for Cold Email Copy
 * Source: ColdIQ Messaging Frameworks (Condensed Version for Performance)
 *
 * This is a streamlined version optimized for speed while maintaining all critical guidance.
 */

const fs = require('fs');
const path = require('path');

// Cache the file contents to avoid repeated disk reads
let cachedBestPractices = null;
let cachedComprehensivePrompt = null;
let cachedLitePrompt = null;

/**
 * Get comprehensive cold email review prompt (800-line version)
 * This is the detailed expert system prompt for cold email analysis
 */
function getComprehensivePrompt() {
    // Return cached version if available
    if (cachedComprehensivePrompt) {
        return cachedComprehensivePrompt;
    }

    try {
        // Read the comprehensive prompt file
        const filePath = path.join(__dirname, 'combined-review-generate-prompt-800.txt');
        cachedComprehensivePrompt = fs.readFileSync(filePath, 'utf8');
        return cachedComprehensivePrompt;
    } catch (error) {
        console.error('Error reading combined-review-generate-prompt-800.txt:', error);
        // Fall back to the reduced best practices if comprehensive prompt not available
        return getBestPracticesContext();
    }
}

/**
 * Get lite cold email review prompt (~50% smaller for faster responses)
 * Optimized for free tier - maintains quality while reducing tokens
 */
function getLitePrompt() {
    // Return cached version if available
    if (cachedLitePrompt) {
        return cachedLitePrompt;
    }

    try {
        // Read the lite prompt file
        const filePath = path.join(__dirname, 'combined-review-generate-prompt-lite.txt');
        cachedLitePrompt = fs.readFileSync(filePath, 'utf8');
        return cachedLitePrompt;
    } catch (error) {
        console.error('Error reading combined-review-generate-prompt-lite.txt:', error);
        // Fall back to the comprehensive prompt if lite not available
        return getComprehensivePrompt();
    }
}

/**
 * Get formatted best practices content for AI prompt
 * Uses the condensed version for faster API calls and lower token usage
 */
function getBestPracticesContext() {
    // Return cached version if available
    if (cachedBestPractices) {
        return cachedBestPractices;
    }

    try {
        // Read the reduced best practices markdown file
        const filePath = path.join(__dirname, 'reduced-best-practices.md');
        cachedBestPractices = fs.readFileSync(filePath, 'utf8');
        return cachedBestPractices;
    } catch (error) {
        console.error('Error reading reduced-best-practices.md:', error);

        // Fallback to inline minimal version if file can't be read
        return `# COLD EMAIL BEST PRACTICES (ColdIQ Framework)

## Core Principles
- Personalization: NO generic AI compliments, reference specific recent info
- Subject Lines: Under 50 chars, no spam triggers
- Opening: First sentence 100% about THEM, not you
- Value Prop: Focus on outcomes, quantify when possible
- CTA: Single low-commitment ask (Worth a chat?)
- Length: 70-95 words optimal, never exceed 125
- Tone: Conversational, show personality

## Critical DON'Ts
- Don't start with "I hope this email finds you well"
- No long paragraphs (3+ sentences)
- Never multiple CTAs
- Don't talk about yourself in first paragraph

## Key Frameworks
**Ask Before Pitch**: Open with question, state trigger/problem, offer solution, PS with relevance
**Not Too Different**: "I work with ICP similar to you who struggle with..."
**Do the Math**: Trigger + Quick pitch + ROI calculation + CTA

## Signals for Personalization
- Company Growth (new offices, hiring, expansion)
- Funding Events (Series rounds, milestones)
- Executive Changes (new hires, promotions)
- Product Launches
- Content & Thought Leadership
`;
    }
}

// Export the functions
module.exports = {
    getBestPracticesContext,
    getComprehensivePrompt,
    getLitePrompt
};
