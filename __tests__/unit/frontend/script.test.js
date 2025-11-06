/**
 * Tests for frontend script.js
 * Tests word counting, validation, UI interactions, and API calls
 */

require('../../setup');
const fs = require('fs');
const path = require('path');
const { sampleEmailData, mockCombinedResponse } = require('../../fixtures/testData');

// Load the script content
const scriptPath = path.join(__dirname, '../../../script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

describe('Frontend Script', () => {
    let scriptModule;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="subjectLine"></div>
            <textarea id="emailCopy"></textarea>
            <span id="subjectCounter"></span>
            <span id="bodyCounter"></span>
            <button id="analyzeBtn"></button>
            <button id="clearBtn"></button>
            <button id="trySampleBtn"></button>
            <input type="checkbox" id="demoModeToggle" checked />
            <button id="showOriginalBtn"></button>
            <div id="originalCopySection" style="display: none;"></div>
            <div id="resultsSection" style="display: none;"></div>
            <div id="errorSection" style="display: none;"></div>
            <div id="errorMessage"></div>
            <span id="originalScore"></span>
            <div id="improvedSubject"></div>
            <div id="improvedBody"></div>
            <div id="changesList"></div>
            <div id="nextLevelTip"></div>
            <div id="originalSubjectDisplay"></div>
            <div id="originalBodyDisplay"></div>
            <div id="scoreStatus"></div>
        `;

        // Clear fetch mock
        fetch.mockClear();

        // Execute the script in the context
        eval(scriptContent);
    });

    describe('countWords()', () => {
        test('should count words correctly in simple text', () => {
            expect(countWords('Hello world')).toBe(2);
            expect(countWords('This is a test')).toBe(4);
        });

        test('should handle empty string', () => {
            expect(countWords('')).toBe(0);
            expect(countWords('   ')).toBe(0);
        });

        test('should handle null and undefined', () => {
            expect(countWords(null)).toBe(0);
            expect(countWords(undefined)).toBe(0);
        });

        test('should handle multiple spaces', () => {
            expect(countWords('Hello    world')).toBe(2);
            expect(countWords('  word1   word2  word3  ')).toBe(3);
        });

        test('should handle newlines and tabs', () => {
            expect(countWords('Line1\nLine2\tWord3')).toBe(3);
        });

        test('should count hyphenated words as one word', () => {
            expect(countWords('state-of-the-art solution')).toBe(2);
        });

        test('should handle punctuation', () => {
            expect(countWords('Hello, world!')).toBe(2);
            expect(countWords('Test. Another test.')).toBe(3);
        });
    });

    describe('updateSubjectCounter()', () => {
        test('should update counter with word count', () => {
            const input = document.getElementById('subjectLine');
            const counter = document.getElementById('subjectCounter');

            input.value = 'Quick question about sales';
            updateSubjectCounter();

            expect(counter.textContent).toContain('4/7 words');
        });

        test('should show 0 for empty input', () => {
            const input = document.getElementById('subjectLine');
            const counter = document.getElementById('subjectCounter');

            input.value = '';
            updateSubjectCounter();

            expect(counter.textContent).toContain('0/7 words');
        });
    });

    describe('updateBodyCounter()', () => {
        test('should update counter with word count', () => {
            const textarea = document.getElementById('emailCopy');
            const counter = document.getElementById('bodyCounter');

            textarea.value = 'This is a test email with several words in it.';
            updateBodyCounter();

            expect(counter.textContent).toContain('10/85 words');
        });

        test('should show optimal range', () => {
            const counter = document.getElementById('bodyCounter');
            updateBodyCounter();

            expect(counter.textContent).toContain('optimal: 70-95');
        });
    });

    describe('updateButtonState()', () => {
        test('should enable button when both fields have content', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const analyzeBtn = document.getElementById('analyzeBtn');

            subjectInput.value = 'Test subject';
            bodyTextarea.value = 'Test body';
            updateButtonState();

            expect(analyzeBtn.disabled).toBe(false);
        });

        test('should disable button when subject is empty', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const analyzeBtn = document.getElementById('analyzeBtn');

            subjectInput.value = '';
            bodyTextarea.value = 'Test body';
            updateButtonState();

            expect(analyzeBtn.disabled).toBe(true);
        });

        test('should disable button when body is empty', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const analyzeBtn = document.getElementById('analyzeBtn');

            subjectInput.value = 'Test subject';
            bodyTextarea.value = '';
            updateButtonState();

            expect(analyzeBtn.disabled).toBe(true);
        });

        test('should disable button when both fields are empty', () => {
            const analyzeBtn = document.getElementById('analyzeBtn');
            updateButtonState();

            expect(analyzeBtn.disabled).toBe(true);
        });

        test('should handle whitespace-only input', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const analyzeBtn = document.getElementById('analyzeBtn');

            subjectInput.value = '   ';
            bodyTextarea.value = '   ';
            updateButtonState();

            expect(analyzeBtn.disabled).toBe(true);
        });
    });

    describe('handleTrySample()', () => {
        test('should populate fields with sample data', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');

            handleTrySample();

            expect(subjectInput.value).toBeTruthy();
            expect(bodyTextarea.value).toBeTruthy();
            expect(subjectInput.value.length).toBeGreaterThan(0);
            expect(bodyTextarea.value.length).toBeGreaterThan(50);
        });

        test('should update counters after populating', () => {
            const subjectCounter = document.getElementById('subjectCounter');
            const bodyCounter = document.getElementById('bodyCounter');

            handleTrySample();

            expect(subjectCounter.textContent).not.toContain('0/7');
            expect(bodyCounter.textContent).not.toContain('0/85');
        });

        test('should enable analyze button', () => {
            const analyzeBtn = document.getElementById('analyzeBtn');

            handleTrySample();

            expect(analyzeBtn.disabled).toBe(false);
        });
    });

    describe('toggleOriginalCopy()', () => {
        test('should toggle visibility of original copy section', () => {
            const section = document.getElementById('originalCopySection');
            const button = document.getElementById('showOriginalBtn');

            expect(section.style.display).toBe('none');

            toggleOriginalCopy();
            expect(section.style.display).toBe('block');
            expect(button.textContent).toBe('Hide Original');

            toggleOriginalCopy();
            expect(section.style.display).toBe('none');
            expect(button.textContent).toBe('Show Original');
        });
    });

    describe('handleClearClick()', () => {
        test('should clear all input fields', () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');

            subjectInput.value = 'Test';
            bodyTextarea.value = 'Test body';

            handleClearClick();

            expect(subjectInput.value).toBe('');
            expect(bodyTextarea.value).toBe('');
        });

        test('should hide results and errors', () => {
            const resultsSection = document.getElementById('resultsSection');
            const errorSection = document.getElementById('errorSection');

            resultsSection.style.display = 'block';
            errorSection.style.display = 'block';

            handleClearClick();

            expect(resultsSection.style.display).toBe('none');
            expect(errorSection.style.display).toBe('none');
        });

        test('should reset counters', () => {
            const subjectCounter = document.getElementById('subjectCounter');
            const bodyCounter = document.getElementById('bodyCounter');

            handleClearClick();

            expect(subjectCounter.textContent).toContain('0/7');
            expect(bodyCounter.textContent).toContain('0/85');
        });
    });

    describe('escapeHtml()', () => {
        test('should escape HTML special characters', () => {
            expect(escapeHtml('<script>alert("XSS")</script>'))
                .toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');

            expect(escapeHtml('Test & Test')).toContain('&amp;');
            expect(escapeHtml('Test < Test')).toContain('&lt;');
            expect(escapeHtml('Test > Test')).toContain('&gt;');
        });

        test('should handle normal text', () => {
            expect(escapeHtml('Normal text')).toBe('Normal text');
        });

        test('should handle quotes', () => {
            const result = escapeHtml('"quoted" text');
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });
    });

    describe('getScoreClass()', () => {
        test('should return correct class for excellent score', () => {
            expect(getScoreClass(90)).toBe('excellent');
            expect(getScoreClass(80)).toBe('excellent');
        });

        test('should return correct class for good score', () => {
            expect(getScoreClass(70)).toBe('good');
            expect(getScoreClass(60)).toBe('good');
        });

        test('should return correct class for fair score', () => {
            expect(getScoreClass(50)).toBe('fair');
            expect(getScoreClass(40)).toBe('fair');
        });

        test('should return correct class for poor score', () => {
            expect(getScoreClass(30)).toBe('poor');
            expect(getScoreClass(10)).toBe('poor');
            expect(getScoreClass(0)).toBe('poor');
        });

        test('should handle boundary values', () => {
            expect(getScoreClass(79)).toBe('good');
            expect(getScoreClass(59)).toBe('fair');
            expect(getScoreClass(39)).toBe('poor');
        });
    });

    describe('getScoreStatusText()', () => {
        test('should return correct status text', () => {
            expect(getScoreStatusText(85)).toBe('Excellent');
            expect(getScoreStatusText(65)).toBe('Good');
            expect(getScoreStatusText(45)).toBe('Needs Work');
            expect(getScoreStatusText(25)).toBe('High Risk');
        });
    });

    describe('showError()', () => {
        test('should display error message', () => {
            const errorSection = document.getElementById('errorSection');
            const errorMessage = document.getElementById('errorMessage');

            showError('Test error message');

            expect(errorSection.style.display).toBe('block');
            expect(errorMessage.textContent).toBe('Test error message');
        });
    });

    describe('hideError()', () => {
        test('should hide error section', () => {
            const errorSection = document.getElementById('errorSection');
            errorSection.style.display = 'block';

            hideError();

            expect(errorSection.style.display).toBe('none');
        });
    });

    describe('hideResults()', () => {
        test('should hide results section', () => {
            const resultsSection = document.getElementById('resultsSection');
            resultsSection.style.display = 'block';

            hideResults();

            expect(resultsSection.style.display).toBe('none');
        });
    });

    describe('getDemoResponse()', () => {
        test('should return demo data with correct structure', async () => {
            const result = await getDemoResponse(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result).toHaveProperty('original');
            expect(result).toHaveProperty('review');
            expect(result).toHaveProperty('improved');
            expect(result).toHaveProperty('changes');
            expect(result).toHaveProperty('furtherTips');
        });

        test('should simulate delay', async () => {
            const startTime = Date.now();
            await getDemoResponse('Test', 'Test body');
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(2900); // ~3 seconds
        });

        test('should include original subject and body', async () => {
            const result = await getDemoResponse(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result.original.subjectLine).toBe(sampleEmailData.validSubject);
            expect(result.original.copy).toBe(sampleEmailData.validBody);
        });

        test('should return reasonable score', async () => {
            const result = await getDemoResponse('Test', 'Test body');

            expect(result.review.score).toBeGreaterThan(0);
            expect(result.review.score).toBeLessThanOrEqual(100);
        });

        test('should include changes array', async () => {
            const result = await getDemoResponse('Test', 'Test body');

            expect(Array.isArray(result.changes)).toBe(true);
            expect(result.changes.length).toBeGreaterThan(0);

            result.changes.forEach(change => {
                expect(change).toHaveProperty('category');
                expect(change).toHaveProperty('issue');
                expect(change).toHaveProperty('reason');
                expect(change).toHaveProperty('why');
            });
        });

        test('should include further tips', async () => {
            const result = await getDemoResponse('Test', 'Test body');

            expect(Array.isArray(result.furtherTips)).toBe(true);
            expect(result.furtherTips.length).toBeGreaterThan(0);
        });
    });

    describe('analyzeAndImprove() in demo mode', () => {
        test('should use demo response when demo mode is enabled', async () => {
            const demoToggle = document.getElementById('demoModeToggle');
            demoToggle.checked = true;

            const result = await analyzeAndImprove(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(result).toHaveProperty('original');
            expect(result).toHaveProperty('review');
            expect(result).toHaveProperty('improved');
            expect(fetch).not.toHaveBeenCalled();
        });

        test('should call API when demo mode is disabled', async () => {
            const demoToggle = document.getElementById('demoModeToggle');
            demoToggle.checked = false;

            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockCombinedResponse
            });

            const result = await analyzeAndImprove(
                sampleEmailData.validSubject,
                sampleEmailData.validBody
            );

            expect(fetch).toHaveBeenCalledWith(
                '/api/analyze-and-improve',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });
    });

    describe('displayResults()', () => {
        test('should display score correctly', () => {
            const originalScore = document.getElementById('originalScore');

            displayResults(mockCombinedResponse);

            expect(originalScore.textContent).toBe('73');
        });

        test('should update score status badge', () => {
            const scoreStatus = document.getElementById('scoreStatus');

            displayResults(mockCombinedResponse);

            expect(scoreStatus.textContent).toBeTruthy();
            expect(scoreStatus.className).toContain('score-status-badge');
        });

        test('should display improved copy', () => {
            const improvedSubject = document.getElementById('improvedSubject');
            const improvedBody = document.getElementById('improvedBody');

            displayResults(mockCombinedResponse);

            expect(improvedSubject.textContent).toBe(mockCombinedResponse.improved.subjectLine);
            expect(improvedBody.textContent).toBe(mockCombinedResponse.improved.copy);
        });

        test('should display original copy for comparison', () => {
            const originalSubject = document.getElementById('originalSubjectDisplay');
            const originalBody = document.getElementById('originalBodyDisplay');

            displayResults(mockCombinedResponse);

            expect(originalSubject.textContent).toBe(mockCombinedResponse.original.subjectLine);
            expect(originalBody.textContent).toBe(mockCombinedResponse.original.copy);
        });

        test('should render changes list', () => {
            const changesList = document.getElementById('changesList');

            displayResults(mockCombinedResponse);

            expect(changesList.children.length).toBe(mockCombinedResponse.changes.length);
        });

        test('should show results section', () => {
            const resultsSection = document.getElementById('resultsSection');

            displayResults(mockCombinedResponse);

            expect(resultsSection.style.display).toBe('block');
        });

        test('should display further tips when available', () => {
            const nextLevelTip = document.getElementById('nextLevelTip');

            displayResults(mockCombinedResponse);

            if (mockCombinedResponse.furtherTips && mockCombinedResponse.furtherTips.length > 0) {
                expect(nextLevelTip.style.display).toBe('block');
                expect(nextLevelTip.innerHTML).toContain(mockCombinedResponse.furtherTips[0]);
            }
        });

        test('should escape HTML in changes to prevent XSS', () => {
            const maliciousResponse = {
                ...mockCombinedResponse,
                changes: [{
                    category: '<script>alert("XSS")</script>',
                    issue: 'test',
                    reason: 'test',
                    why: 'test',
                    summary: 'test',
                    detail: 'test',
                    signal: ''
                }]
            };

            displayResults(maliciousResponse);

            const changesList = document.getElementById('changesList');
            expect(changesList.innerHTML).not.toContain('<script>');
            expect(changesList.innerHTML).toContain('&lt;script&gt;');
        });
    });

    describe('handleCopyClick()', () => {
        test('should copy subject to clipboard', async () => {
            const improvedSubject = document.getElementById('improvedSubject');
            improvedSubject.textContent = 'Test Subject';

            const button = document.createElement('button');
            button.dataset.copy = 'subject';
            button.innerHTML = '<span class="copy-btn-text">Copy</span>';

            await handleCopyClick(button);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test Subject');
        });

        test('should copy body to clipboard', async () => {
            const improvedBody = document.getElementById('improvedBody');
            improvedBody.textContent = 'Test Body';

            const button = document.createElement('button');
            button.dataset.copy = 'body';
            button.innerHTML = '<span class="copy-btn-text">Copy</span>';

            await handleCopyClick(button);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test Body');
        });

        test('should show "Copied!" feedback', async () => {
            const improvedSubject = document.getElementById('improvedSubject');
            improvedSubject.textContent = 'Test';

            const button = document.createElement('button');
            button.dataset.copy = 'subject';
            button.innerHTML = '<span class="copy-btn-text">Copy</span>';

            await handleCopyClick(button);

            expect(button.querySelector('.copy-btn-text').textContent).toBe('Copied!');
            expect(button.classList.contains('copied')).toBe(true);
        });
    });

    describe('Input validation in handleAnalyzeClick()', () => {
        test('should show error when both fields are empty', async () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const errorMessage = document.getElementById('errorMessage');

            subjectInput.value = '';
            bodyTextarea.value = '';

            await handleAnalyzeClick();

            expect(errorMessage.textContent).toContain('both');
        });

        test('should show error when subject is empty', async () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const errorMessage = document.getElementById('errorMessage');

            subjectInput.value = '';
            bodyTextarea.value = 'Test body';

            await handleAnalyzeClick();

            expect(errorMessage.textContent).toContain('subject line');
        });

        test('should show error when body is empty', async () => {
            const subjectInput = document.getElementById('subjectLine');
            const bodyTextarea = document.getElementById('emailCopy');
            const errorMessage = document.getElementById('errorMessage');

            subjectInput.value = 'Test subject';
            bodyTextarea.value = '';

            await handleAnalyzeClick();

            expect(errorMessage.textContent).toContain('email body');
        });
    });
});
