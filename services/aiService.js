const Anthropic = require('@anthropic-ai/sdk');
const bestPerformingCopies = require('../data/bestPerformingCopies');
const { getBestPracticesContext } = require('../data/bestPractices');
const fs = require('fs');
const path = require('path');

class AIService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'claude';

        // Initialize Claude if using it
        if (this.provider === 'claude') {
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
                timeout: 60000 // 60 seconds timeout
            });
        }

        // Always initialize OpenRouter if key is available (for auto-detection)
        if (process.env.OPENROUTER_API_KEY) {
            this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
            this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
        }

        // Create logs directory if it doesn't exist
        this.logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        // Session tracking for linking review + improve
        this.currentSessionId = null;
        this.sessionData = {};
    }

    createSession() {
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        this.currentSessionId = `session_${timestamp}`;
        this.sessionData = {
            sessionId: this.currentSessionId,
            startTime: Date.now(),
            review: null,
            improve: null
        };

        // Create session directory
        const sessionDir = path.join(this.logsDir, this.currentSessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        return this.currentSessionId;
    }

    logPromptAndResponse(type, data) {
        try {
            if (!this.currentSessionId) {
                this.createSession();
            }

            const sessionDir = path.join(this.logsDir, this.currentSessionId);

            // Store data for session summary
            if (type === 'review') {
                this.sessionData.review = {
                    ...data,
                    timestamp: new Date().toISOString()
                };
            } else if (type === 'improve') {
                this.sessionData.improve = {
                    ...data,
                    timestamp: new Date().toISOString()
                };
            }

            // Write detailed log file
            const filename = `${type}_detailed.log`;
            const filepath = path.join(sessionDir, filename);

            const logContent = `
================================================================================
${type.toUpperCase()} LOG
Generated: ${new Date().toISOString()}
================================================================================

SYSTEM PROMPT:
${'-'.repeat(80)}
${data.systemPrompt}
${'-'.repeat(80)}

USER PROMPT:
${'-'.repeat(80)}
${data.userPrompt}
${'-'.repeat(80)}

${data.reviewData ? `REVIEW DATA (for improve step):
${'-'.repeat(80)}
${JSON.stringify(data.reviewData, null, 2)}
${'-'.repeat(80)}

` : ''}AI RESPONSE:
${'-'.repeat(80)}
${data.response}
${'-'.repeat(80)}

${data.parsedResponse ? `PARSED RESPONSE:
${'-'.repeat(80)}
${JSON.stringify(data.parsedResponse, null, 2)}
${'-'.repeat(80)}
` : ''}
METADATA:
${'-'.repeat(80)}
Model: ${data.model}
Response Time: ${data.responseTime}ms
Stop Reason: ${data.stopReason}
Content Length: ${data.contentLength} characters
${'-'.repeat(80)}
`;

            fs.writeFileSync(filepath, logContent, 'utf8');
            console.log(`✓ ${type} logged to: logs/${this.currentSessionId}/${filename}`);

            // Generate session summary if both review and improve are complete
            if (this.sessionData.review && this.sessionData.improve) {
                this.generateSessionSummary();
            }
        } catch (error) {
            console.error('Failed to log prompt/response:', error.message);
        }
    }

    generateSessionSummary() {
        try {
            const sessionDir = path.join(this.logsDir, this.currentSessionId);
            const summaryPath = path.join(sessionDir, 'SUMMARY.md');

            const totalTime = Date.now() - this.sessionData.startTime;
            const reviewData = this.sessionData.review;
            const improveData = this.sessionData.improve;

            // Extract input/output data
            const inputSubject = this.extractSubjectFromPrompt(reviewData.userPrompt);
            const inputBody = this.extractBodyFromPrompt(reviewData.userPrompt);
            const outputSubject = improveData.parsedResponse?.improvedSubject || 'N/A';
            const outputBody = improveData.parsedResponse?.improvedBody || 'N/A';

            // Extract key feedback
            const score = reviewData.parsedResponse?.overallScore || 0;
            const keyIssues = this.extractKeyIssues(reviewData.parsedResponse);
            const keyChanges = this.extractKeyChanges(improveData.parsedResponse);

            const summary = `# Session Summary

**Session ID:** ${this.currentSessionId}
**Generated:** ${new Date().toISOString()}
**Total Time:** ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)

---

## Input

### Original Subject Line
\`\`\`
${inputSubject}
\`\`\`

### Original Email Body
\`\`\`
${inputBody}
\`\`\`

---

## Review Results

**Overall Score:** ${score}/100
**Model:** ${reviewData.model}
**Time:** ${reviewData.responseTime}ms
**Stop Reason:** ${reviewData.stopReason}
**Cache Used:** ${reviewData.systemPrompt.includes('cache_control') ? 'Yes' : 'No'}

### Key Issues Identified
${keyIssues}

---

## Improved Version

### Improved Subject Line
\`\`\`
${outputSubject}
\`\`\`

### Improved Email Body
\`\`\`
${outputBody.replace(/\\n\\n/g, '\n\n')}
\`\`\`

**Model:** ${improveData.model}
**Time:** ${improveData.responseTime}ms
**Stop Reason:** ${improveData.stopReason}

### Key Changes Made
${keyChanges}

### Further Tips
${this.extractFurtherTips(improveData.parsedResponse)}

---

## Performance Metrics

| Metric | Review | Improve | Total |
|--------|--------|---------|-------|
| **Time** | ${reviewData.responseTime}ms | ${improveData.responseTime}ms | ${totalTime}ms |
| **Model** | ${reviewData.model} | ${improveData.model} | - |
| **Response Length** | ${reviewData.contentLength} chars | ${improveData.contentLength} chars | ${reviewData.contentLength + improveData.contentLength} chars |
| **Stop Reason** | ${reviewData.stopReason} | ${improveData.stopReason} | - |
| **Prompt Cache** | Yes (ephemeral) | Yes (ephemeral) | - |

---

## Files in This Session

- \`SUMMARY.md\` - This human-readable summary (you are here)
- \`review_detailed.log\` - Full review prompt, response, and metadata
- \`improve_detailed.log\` - Full improve prompt, response, and metadata

---

*Generated by Copy Reviewer AI*
`;

            fs.writeFileSync(summaryPath, summary, 'utf8');
            console.log(`✓ Session summary generated: logs/${this.currentSessionId}/SUMMARY.md`);
        } catch (error) {
            console.error('Failed to generate session summary:', error.message);
        }
    }

    extractSubjectFromPrompt(userPrompt) {
        const match = userPrompt.match(/---SUBJECT LINE---\n([\s\S]*?)\n---END SUBJECT LINE---/);
        return match ? match[1].trim() : 'N/A';
    }

    extractBodyFromPrompt(userPrompt) {
        const match = userPrompt.match(/---EMAIL BODY---\n([\s\S]*?)\n---END EMAIL BODY---/);
        return match ? match[1].trim() : 'N/A';
    }

    extractKeyIssues(reviewResponse) {
        if (!reviewResponse || !reviewResponse.sections) return '- No issues identified';

        const issues = [];
        for (const section of reviewResponse.sections.slice(0, 5)) { // Top 5 sections
            if (section.items && section.items.length > 0) {
                issues.push(`- **${section.title}:** ${section.items[0]}`);
            }
        }
        return issues.length > 0 ? issues.join('\n') : '- No specific issues identified';
    }

    extractKeyChanges(improveResponse) {
        if (!improveResponse || !improveResponse.changes) return '- No changes documented';

        const changes = improveResponse.changes.slice(0, 5).map((change, i) =>
            `${i + 1}. **${change.category}:** ${change.summary || change.reason}`
        );
        return changes.length > 0 ? changes.join('\n') : '- No changes documented';
    }

    extractFurtherTips(improveResponse) {
        if (!improveResponse || !improveResponse.furtherTips || improveResponse.furtherTips.length === 0) {
            return '- No additional tips provided';
        }
        return improveResponse.furtherTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n');
    }

    async reviewCopy(subjectLine, emailCopy, model) {
        // Auto-detect provider based on model name format
        // If model has "/" it's an OpenRouter model (e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4o")
        const useOpenRouter = model && model.includes('/');

        if (useOpenRouter || this.provider === 'openrouter') {
            return await this.reviewWithOpenRouter(subjectLine, emailCopy, model);
        } else if (this.provider === 'claude') {
            return await this.reviewWithClaude(subjectLine, emailCopy, model);
        } else if (this.provider === 'openai') {
            return await this.reviewWithOpenAI(subjectLine, emailCopy);
        } else {
            throw new Error('Invalid AI provider specified');
        }
    }

    async reviewWithClaude(subjectLine, emailCopy, model = 'claude-sonnet-4-5-20250929') {
        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(subjectLine, emailCopy);

        console.log('=== Starting Claude API Request (Review) ===');
        console.log('Model:', model);
        console.log('Subject Line Length:', subjectLine.length);
        console.log('Email Copy Length:', emailCopy.length);
        console.log('System Prompt Length:', systemPrompt.length);
        console.log('User Prompt Length:', userPrompt.length);
        console.log('Timeout: 60000ms');
        console.log('Request started at:', new Date().toISOString());

        try {
            const startTime = Date.now();
            const message = await this.anthropic.messages.create({
                model: model,
                max_tokens: 3000, // Optimized for concise responses
                temperature: 0.7,
                system: [
                    {
                        type: "text",
                        text: systemPrompt,
                        cache_control: { type: "ephemeral" } // Cache system prompt for 5 minutes
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    },
                    {
                        role: 'assistant',
                        content: '{\n    "overallScore":' // Prefill to enforce JSON structure (no trailing space)
                    }
                ]
            });
            const duration = Date.now() - startTime;

            console.log('=== Claude API Response Received ===');
            console.log('Response time:', duration + 'ms');
            console.log('Response completed at:', new Date().toISOString());
            console.log('Response content length:', message.content[0].text.length);
            console.log('Stop reason:', message.stop_reason);

            // Check if response was cut off
            if (message.stop_reason === 'max_tokens') {
                console.warn('WARNING: Response was truncated due to max_tokens limit');
                throw new Error('Response was incomplete. The AI model hit the token limit. Please try with a shorter email or contact support.');
            }

            const responseText = message.content[0].text;
            const parsedResponse = this.parseAIResponse(responseText);

            // Log the prompt and response
            this.logPromptAndResponse('review', {
                systemPrompt,
                userPrompt,
                response: responseText,
                parsedResponse,
                model,
                responseTime: duration,
                stopReason: message.stop_reason,
                contentLength: responseText.length
            });

            return parsedResponse;
        } catch (error) {
            console.error('=== Claude API Error ===');
            console.error('Error occurred at:', new Date().toISOString());
            console.error('Error type:', error.constructor.name);
            console.error('Error status:', error.status);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error:', JSON.stringify(error, null, 2));

            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new Error(`Request timed out after 60 seconds. The API may be slow or unavailable. Please try again.`);
            } else if (error.status === 404) {
                throw new Error(`Claude API model not found. Please check your API key has access to ${model}. Error: ${error.message}`);
            } else if (error.status === 401) {
                throw new Error('Invalid or expired Anthropic API key. Please update ANTHROPIC_API_KEY in your .env file.');
            } else if (error.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else if (error.status === 529) {
                throw new Error('Claude API is temporarily overloaded. Please wait a moment and try again.');
            }
            throw new Error(`Failed to get review from Claude API: ${error.message} (Status: ${error.status}, Code: ${error.code})`);
        }
    }

    async reviewWithOpenRouter(subjectLine, emailCopy, model = 'anthropic/claude-sonnet-4-5:beta') {
        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(subjectLine, emailCopy);

        console.log('=== Starting OpenRouter API Request (Review) ===');
        console.log('Model:', model);
        console.log('Subject Line Length:', subjectLine.length);
        console.log('Email Copy Length:', emailCopy.length);
        console.log('System Prompt Length:', systemPrompt.length);
        console.log('User Prompt Length:', userPrompt.length);
        console.log('Request started at:', new Date().toISOString());

        try {
            const startTime = Date.now();
            const response = await fetch(this.openRouterUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'HTTP-Referer': 'https://coldiq.com',
                    'X-Title': 'ColdIQ Email Optimizer',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        },
                        {
                            role: 'assistant',
                            content: '{\n    "overallScore":' // Prefill to enforce JSON structure
                        }
                    ],
                    max_tokens: 3000,
                    temperature: 0.7
                })
            });
            const duration = Date.now() - startTime;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            console.log('=== OpenRouter API Response Received ===');
            console.log('Response time:', duration + 'ms');
            console.log('Response completed at:', new Date().toISOString());

            const responseText = data.choices[0].message.content;
            console.log('Response content length:', responseText.length);

            const parsedResponse = this.parseAIResponse(responseText);

            // Log the prompt and response
            this.logPromptAndResponse('review', {
                systemPrompt,
                userPrompt,
                response: responseText,
                parsedResponse,
                model,
                responseTime: duration,
                stopReason: data.choices[0].finish_reason || 'stop',
                contentLength: responseText.length
            });

            return parsedResponse;
        } catch (error) {
            console.error('=== OpenRouter API Error ===');
            console.error('Error occurred at:', new Date().toISOString());
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);

            if (error.message && error.message.includes('timeout')) {
                throw new Error(`Request timed out. The API may be slow or unavailable. Please try again.`);
            } else if (error.message && error.message.includes('401')) {
                throw new Error('Invalid or expired OpenRouter API key. Please update OPENROUTER_API_KEY in your .env file.');
            } else if (error.message && error.message.includes('429')) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            throw new Error(`Failed to get review from OpenRouter API: ${error.message}`);
        }
    }

    async reviewWithOpenAI(subjectLine, emailCopy) {
        // Placeholder for OpenAI implementation
        // You can implement this similarly to Claude when needed
        throw new Error('OpenAI integration not yet implemented. Please use Claude.');
    }

    async improveCopy(subjectLine, emailCopy, review, model) {
        // Auto-detect provider based on model name format
        // If model has "/" it's an OpenRouter model (e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4o")
        const useOpenRouter = model && model.includes('/');

        if (useOpenRouter || this.provider === 'openrouter') {
            return await this.improveWithOpenRouter(subjectLine, emailCopy, review, model);
        } else if (this.provider === 'claude') {
            return await this.improveWithClaude(subjectLine, emailCopy, review, model);
        } else if (this.provider === 'openai') {
            return await this.improveWithOpenAI(subjectLine, emailCopy, review);
        } else {
            throw new Error('Invalid AI provider specified');
        }
    }

    async improveWithClaude(subjectLine, emailCopy, review, model = 'claude-sonnet-4-5-20250929') {
        const systemPrompt = this.buildImproveSystemPrompt();
        const userPrompt = this.buildImproveUserPrompt(subjectLine, emailCopy, review);

        console.log('=== Starting Claude API Request (Improve) ===');
        console.log('Model:', model);
        console.log('Subject Line Length:', subjectLine.length);
        console.log('Email Copy Length:', emailCopy.length);
        console.log('System Prompt Length:', systemPrompt.length);
        console.log('User Prompt Length:', userPrompt.length);
        console.log('Timeout: 60000ms');
        console.log('Request started at:', new Date().toISOString());

        try {
            const startTime = Date.now();
            const message = await this.anthropic.messages.create({
                model: model,
                max_tokens: 3000, // Optimized for concise responses
                temperature: 0.8,
                system: [
                    {
                        type: "text",
                        text: systemPrompt,
                        cache_control: { type: "ephemeral" } // Cache system prompt for 5 minutes
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    },
                    {
                        role: 'assistant',
                        content: '{\n    "improvedSubject":"' // Prefill to enforce JSON structure (no trailing space)
                    }
                ]
            });
            const duration = Date.now() - startTime;

            console.log('=== Claude API Response Received ===');
            console.log('Response time:', duration + 'ms');
            console.log('Response completed at:', new Date().toISOString());
            console.log('Response content length:', message.content[0].text.length);
            console.log('Stop reason:', message.stop_reason);

            // Check if response was cut off
            if (message.stop_reason === 'max_tokens') {
                console.warn('WARNING: Response was truncated due to max_tokens limit');
                throw new Error('Response was incomplete. The AI model hit the token limit. Please try with a shorter email or contact support.');
            }

            const responseText = message.content[0].text;
            const parsedResponse = this.parseImproveResponse(responseText);

            // Log the prompt and response
            this.logPromptAndResponse('improve', {
                systemPrompt,
                userPrompt,
                reviewData: review,
                response: responseText,
                parsedResponse,
                model,
                responseTime: duration,
                stopReason: message.stop_reason,
                contentLength: responseText.length
            });

            return parsedResponse;
        } catch (error) {
            console.error('=== Claude API Error ===');
            console.error('Error occurred at:', new Date().toISOString());
            console.error('Error type:', error.constructor.name);
            console.error('Error status:', error.status);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error:', JSON.stringify(error, null, 2));

            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new Error(`Request timed out after 60 seconds. The API may be slow or unavailable. Please try again.`);
            } else if (error.status === 404) {
                throw new Error(`Claude API model not found. Please check your API key has access to ${model}. Error: ${error.message}`);
            } else if (error.status === 401) {
                throw new Error('Invalid or expired Anthropic API key. Please update ANTHROPIC_API_KEY in your .env file.');
            } else if (error.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else if (error.status === 529) {
                throw new Error('Claude API is temporarily overloaded. Please wait a moment and try again.');
            }
            throw new Error(`Failed to generate improved copy from Claude API: ${error.message} (Status: ${error.status}, Code: ${error.code})`);
        }
    }

    async improveWithOpenRouter(subjectLine, emailCopy, review, model = 'anthropic/claude-sonnet-4-5:beta') {
        const systemPrompt = this.buildImproveSystemPrompt();
        const userPrompt = this.buildImproveUserPrompt(subjectLine, emailCopy, review);

        console.log('=== Starting OpenRouter API Request (Improve) ===');
        console.log('Model:', model);
        console.log('Subject Line Length:', subjectLine.length);
        console.log('Email Copy Length:', emailCopy.length);
        console.log('System Prompt Length:', systemPrompt.length);
        console.log('User Prompt Length:', userPrompt.length);
        console.log('Request started at:', new Date().toISOString());

        try {
            const startTime = Date.now();
            const response = await fetch(this.openRouterUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'HTTP-Referer': 'https://coldiq.com',
                    'X-Title': 'ColdIQ Email Optimizer',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        },
                        {
                            role: 'assistant',
                            content: '{\n    "improvedSubject":"' // Prefill to enforce JSON structure
                        }
                    ],
                    max_tokens: 3000,
                    temperature: 0.8
                })
            });
            const duration = Date.now() - startTime;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            console.log('=== OpenRouter API Response Received ===');
            console.log('Response time:', duration + 'ms');
            console.log('Response completed at:', new Date().toISOString());

            const responseText = data.choices[0].message.content;
            console.log('Response content length:', responseText.length);

            const parsedResponse = this.parseImproveResponse(responseText);

            // Log the prompt and response
            this.logPromptAndResponse('improve', {
                systemPrompt,
                userPrompt,
                reviewData: review,
                response: responseText,
                parsedResponse,
                model,
                responseTime: duration,
                stopReason: data.choices[0].finish_reason || 'stop',
                contentLength: responseText.length
            });

            return parsedResponse;
        } catch (error) {
            console.error('=== OpenRouter API Error ===');
            console.error('Error occurred at:', new Date().toISOString());
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);

            if (error.message && error.message.includes('timeout')) {
                throw new Error(`Request timed out. The API may be slow or unavailable. Please try again.`);
            } else if (error.message && error.message.includes('401')) {
                throw new Error('Invalid or expired OpenRouter API key. Please update OPENROUTER_API_KEY in your .env file.');
            } else if (error.message && error.message.includes('429')) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            throw new Error(`Failed to generate improved copy from OpenRouter API: ${error.message}`);
        }
    }

    async improveWithOpenAI(subjectLine, emailCopy, review) {
        throw new Error('OpenAI integration not yet implemented. Please use Claude.');
    }

    buildImproveSystemPrompt() {
        const bestCopiesContext = bestPerformingCopies.getBestCopiesSummary();
        const bestPracticesContext = getBestPracticesContext();

        return `You are an expert cold email copywriter. Rewrite cold emails to maximize response rates.

${bestPracticesContext}

BEST PERFORMING PATTERNS:
${bestCopiesContext}

REWRITE GUIDELINES:
- Apply review feedback
- Follow best performing patterns
- Keep body 70-95 words
- Conversational tone
- Use \\n\\n between paragraphs
- Make changes concise but specific

JSON RULES:
- Valid JSON only (no markdown)
- NO trailing commas
- Escape quotes: \"
- Keep explanations brief

Structure:
{
    "improvedSubject": "<improved subject>",
    "improvedBody": "<improved body with \\n\\n breaks>",
    "changes": [
        {
            "category": "<Subject/Opening/Value Prop/etc>",
            "issue": "<problem, under 10 words>",
            "reason": "<fix applied, under 10 words>",
            "why": "<why it works + data, 1-2 sentences>",
            "summary": "<key change, under 12 words>",
            "detail": "<2-3 sentences explaining change and reasoning>",
            "signal": "<signal used if any: Growth/Hiring/Funding/etc, or empty>"
        }
    ],
    "furtherTips": [
        "<specific personalization tip>",
        "<research/data tip>",
        "<best practice tip>"
    ],
    "expectedImpact": "<1 sentence performance prediction>"
}

Keep changes array focused (3-5 items max). Keep all text concise.`;
    }

    buildImproveUserPrompt(subjectLine, emailCopy, review) {
        return `Based on the review feedback below, please rewrite this cold email to maximize response rate.

---ORIGINAL SUBJECT LINE---
${subjectLine}
---END SUBJECT LINE---

---ORIGINAL EMAIL BODY---
${emailCopy}
---END EMAIL BODY---

---REVIEW FEEDBACK---
Score: ${review.overallScore}/100
${JSON.stringify(review.sections, null, 2)}
---END REVIEW FEEDBACK---

Generate an improved version that addresses the feedback and follows best performing patterns. Provide your response in the JSON format specified.`;
    }

    parseImproveResponse(responseText) {
        try {
            // Remove ALL markdown code blocks (not just at line starts/ends)
            let cleanedText = responseText
                .replace(/```json/g, '')  // Remove ALL ```json occurrences
                .replace(/```/g, '')       // Remove ALL ``` occurrences
                .trim();

            // Log diagnostic info
            console.log('=== JSON Parsing (Improve) ===');
            console.log('Original length:', responseText.length);
            console.log('Cleaned length:', cleanedText.length);
            console.log('First 100 chars:', cleanedText.substring(0, 100));
            console.log('Last 100 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 100)));

            // Prepend the prefill content that was stripped
            cleanedText = '{\n    "improvedSubject":"' + cleanedText;

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let jsonString = jsonMatch[0];
                console.log('JSON extracted, length:', jsonString.length);

                // First try to parse directly
                try {
                    const parsed = JSON.parse(jsonString);
                    return this.validateImproveResponse(parsed);
                } catch (parseError) {
                    console.log('Initial parse failed, attempting to clean JSON...');
                    console.log('Parse error:', parseError.message);

                    // Apply multiple cleanup strategies
                    // 1. Remove trailing commas in arrays and objects
                    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

                    // 2. Fix common quote issues in strings
                    // Replace unescaped quotes within string values
                    // This is a simple approach - may need refinement

                    try {
                        const parsed = JSON.parse(jsonString);
                        return this.validateImproveResponse(parsed);
                    } catch (secondError) {
                        console.log('Second parse attempt failed:', secondError.message);
                        console.log('JSON excerpt around error:', jsonString.substring(Math.max(0, secondError.message.match(/\d+/)?.[0] - 100), Math.min(jsonString.length, parseInt(secondError.message.match(/\d+/)?.[0] || 0) + 100)));

                        // Last resort: try to fix the specific position
                        const errorPos = parseInt(secondError.message.match(/position (\d+)/)?.[1] || 0);
                        if (errorPos > 0) {
                            console.log('Character at error position:', jsonString[errorPos], 'Code:', jsonString.charCodeAt(errorPos));
                        }

                        throw secondError;
                    }
                }
            }
            throw new Error('No valid JSON found in response');
        } catch (error) {
            console.error('Failed to parse improve response:', error);
            console.error('Response text excerpt:', responseText.substring(0, 500));
            throw new Error('Failed to parse improved copy response');
        }
    }

    validateImproveResponse(response) {
        if (!response.improvedSubject || !response.improvedBody) {
            throw new Error('Invalid improve response structure');
        }

        // Ensure furtherTips exists
        if (!response.furtherTips || !Array.isArray(response.furtherTips)) {
            response.furtherTips = [];
        }

        return response;
    }

    buildSystemPrompt() {
        const bestCopiesContext = bestPerformingCopies.getBestCopiesSummary();
        const bestPracticesContext = getBestPracticesContext();

        return `You are an expert cold email copywriter. Review cold emails and provide concise, actionable feedback.

${bestPracticesContext}

BEST PERFORMING PATTERNS:
${bestCopiesContext}

RESPONSE RULES:
- Be specific and concise (2-3 sentences per section)
- Keep items short (under 15 words each)
- Maximum 3-4 items per section
- Focus on highest-impact improvements
- Respond ONLY with valid JSON (no markdown, no explanations)
- NO trailing commas
- Escape quotes with backslash: \"

JSON Structure:
{
    "overallScore": <number 0-100>,
    "sections": [
        {
            "title": "<section name>",
            "content": "<2-3 sentence feedback>",
            "items": ["<short point 1>", "<short point 2>", "<short point 3>"],
            "highlight": {
                "title": "<1-3 word title>",
                "content": "<1 sentence key takeaway>"
            }
        }
    ]
}

Include these sections: Subject Line Analysis, Opening Hook, Value Proposition, Personalization, Call to Action, Length & Structure, vs Best Performers`;
    }

    buildUserPrompt(subjectLine, emailCopy) {
        return `Please review this cold email and provide detailed feedback:

---SUBJECT LINE---
${subjectLine}
---END SUBJECT LINE---

---EMAIL BODY---
${emailCopy}
---END EMAIL BODY---

Provide your analysis in the JSON format specified.`;
    }

    parseAIResponse(responseText) {
        try {
            // Remove ALL markdown code blocks (not just at line starts/ends)
            let cleanedText = responseText
                .replace(/```json/g, '')  // Remove ALL ```json occurrences
                .replace(/```/g, '')       // Remove ALL ``` occurrences
                .trim();

            // Log diagnostic info
            console.log('=== JSON Parsing (Review) ===');
            console.log('Original length:', responseText.length);
            console.log('Cleaned length:', cleanedText.length);
            console.log('First 100 chars:', cleanedText.substring(0, 100));
            console.log('Last 100 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 100)));

            // Prepend the prefill content that was stripped
            cleanedText = '{\n    "overallScore":' + cleanedText;

            // Try to extract JSON from the response
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let jsonString = jsonMatch[0];
                console.log('JSON extracted, length:', jsonString.length);

                // Try to parse directly first
                try {
                    const parsed = JSON.parse(jsonString);
                    return this.validateResponse(parsed);
                } catch (parseError) {
                    console.log('Initial parse failed, attempting to clean JSON...');
                    console.log('Parse error:', parseError.message);

                    // Fix common JSON issues
                    // 1. Remove trailing commas in arrays and objects
                    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

                    // 2. Try parsing again
                    const parsed = JSON.parse(jsonString);
                    return this.validateResponse(parsed);
                }
            }
            throw new Error('No valid JSON found in response');
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            console.error('Response text excerpt:', responseText.substring(0, 500));
            // Return a fallback response
            return this.getFallbackResponse(responseText);
        }
    }

    validateResponse(response) {
        // Ensure the response has the required structure
        if (!response.overallScore || !Array.isArray(response.sections)) {
            throw new Error('Invalid response structure');
        }

        // Ensure score is between 0 and 100
        response.overallScore = Math.max(0, Math.min(100, response.overallScore));

        return response;
    }

    getFallbackResponse(rawText) {
        // If parsing fails, return a structured fallback
        return {
            overallScore: 50,
            sections: [
                {
                    title: 'Analysis',
                    content: rawText || 'Unable to generate detailed analysis. Please try again.',
                    items: []
                }
            ]
        };
    }
}

module.exports = new AIService();
