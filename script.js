// API Configuration
const API_CONFIG = {
    endpoint: '/api/analyze-and-improve',
    timeout: 90000 // 90 seconds for single combined API call (faster than two sequential calls)
};

// DOM Elements
const subjectLineInput = document.getElementById('subjectLine');
const emailAddressInput = document.getElementById('emailAddress');
const emailErrorText = document.getElementById('emailError');
const emailCopyTextarea = document.getElementById('emailCopy');
const subjectCounter = document.getElementById('subjectCounter');
const bodyCounter = document.getElementById('bodyCounter');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const trySampleBtn = document.getElementById('trySampleBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const showOriginalBtn = document.getElementById('showOriginalBtn');
const originalCopySection = document.getElementById('originalCopySection');

// Settings Modal Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const demoModeToggleModal = document.getElementById('demoModeToggleModal');
const modelSelectModal = document.getElementById('modelSelectModal');

// Result section elements
const originalScore = document.getElementById('originalScore');
const improvedSubject = document.getElementById('improvedSubject');
const improvedBody = document.getElementById('improvedBody');
const changesList = document.getElementById('changesList');
const nextLevelTip = document.getElementById('nextLevelTip');
const originalSubjectDisplay = document.getElementById('originalSubjectDisplay');
const originalBodyDisplay = document.getElementById('originalBodyDisplay');

// State
let originalCopyVisible = false;

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyzeClick);
clearBtn.addEventListener('click', handleClearClick);
trySampleBtn.addEventListener('click', handleTrySample);
showOriginalBtn.addEventListener('click', toggleOriginalCopy);
subjectLineInput.addEventListener('input', () => {
    updateSubjectCounter();
    updateButtonState();
});
emailAddressInput.addEventListener('input', () => {
    validateEmailAddress();
    updateButtonState();
});
emailCopyTextarea.addEventListener('input', () => {
    updateBodyCounter();
    updateButtonState();
});

// Settings Modal Event Listeners
settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

// Sync settings between modal and main state
demoModeToggleModal.addEventListener('change', () => {
    // Settings are read from modal when making API calls
});
modelSelectModal.addEventListener('change', () => {
    // Settings are read from modal when making API calls
});

// Copy buttons (delegated)
document.addEventListener('click', (e) => {
    if (e.target.closest('.copy-btn')) {
        handleCopyClick(e.target.closest('.copy-btn'));
    }
});

// Initialize counters on page load
updateSubjectCounter();
updateBodyCounter();

// Load configuration and apply admin panel visibility
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        // Show or hide admin panel (settings button) based on config
        if (!config.showAdminPanel) {
            settingsBtn.style.display = 'none';

            // Set production defaults when admin panel is hidden
            // Use Claude 3.5 Sonnet via OpenRouter
            modelSelectModal.value = 'anthropic/claude-3.5-sonnet';

            // Disable demo mode (use real API calls)
            demoModeToggleModal.checked = false;
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
        // On error, keep admin panel visible (fail-open for development)
    }
}

// Load config on page load
loadConfig();

// Settings Modal Functions
function openSettings() {
    settingsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    settingsModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
        closeSettings();
    }
});

// Word Counter Functions
function countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}

function updateSubjectCounter() {
    const wordCount = countWords(subjectLineInput.value);
    subjectCounter.textContent = `${wordCount}/10 words`;
}

function updateBodyCounter() {
    const wordCount = countWords(emailCopyTextarea.value);
    bodyCounter.textContent = `${wordCount}/200 words`;
}

// Email Validation Function
function validateEmailAddress() {
    const email = emailAddressInput.value.trim();

    // Clear previous error state
    emailAddressInput.classList.remove('error');
    emailErrorText.style.display = 'none';
    emailErrorText.textContent = '';

    // If empty, no validation needed yet
    if (email.length === 0) {
        return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailAddressInput.classList.add('error');
        emailErrorText.textContent = 'Please enter a valid email address';
        emailErrorText.style.display = 'block';
        return false;
    }

    // Check for @gmail.com
    if (email.toLowerCase().includes('@gmail.com')) {
        emailAddressInput.classList.add('error');
        emailErrorText.textContent = 'Please use a professional email address (not @gmail.com)';
        emailErrorText.style.display = 'block';
        return false;
    }

    // Email is valid
    return true;
}

// Button State Management
function updateButtonState() {
    const hasSubject = subjectLineInput.value.trim().length > 0;
    const hasValidEmail = emailAddressInput.value.trim().length > 0 && validateEmailAddress();
    const hasBody = emailCopyTextarea.value.trim().length > 0;
    analyzeBtn.disabled = !(hasSubject && hasValidEmail && hasBody);
}

// Sample Email Handler
function handleTrySample() {
    subjectLineInput.value = "I saw your post about growing your outbound team";
    emailAddressInput.value = "alex@company.com";
    emailCopyTextarea.value = `Hey Sarah,

I noticed you're hiring 3 new SDRs based on your LinkedIn post last week. Congrats on the growth!

When we work with teams scaling outbound, the biggest challenge is usually ramping reps to productivity quickly. We helped TechCorp reduce ramp time from 90 to 30 days using our playbook framework.

Worth exploring how this could help your new hires hit quota faster?

Best,
Alex`;

    updateSubjectCounter();
    updateBodyCounter();
    validateEmailAddress();
    updateButtonState();

    subjectLineInput.focus();
}

// Toggle Original Copy Visibility
function toggleOriginalCopy() {
    originalCopyVisible = !originalCopyVisible;

    if (originalCopyVisible) {
        originalCopySection.style.display = 'block';
        showOriginalBtn.textContent = 'Hide Original';
    } else {
        originalCopySection.style.display = 'none';
        showOriginalBtn.textContent = 'Show Original';
    }
}

// Copy to Clipboard Handler
async function handleCopyClick(button) {
    const copyType = button.dataset.copy;
    let textToCopy = '';

    if (copyType === 'subject') {
        textToCopy = cleanText(improvedSubject.textContent);
    } else if (copyType === 'body') {
        textToCopy = cleanText(improvedBody.textContent);
    }

    try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = button.querySelector('.copy-btn-text').textContent;
        button.classList.add('copied');
        button.querySelector('.copy-btn-text').textContent = 'Copied!';

        setTimeout(() => {
            button.classList.remove('copied');
            button.querySelector('.copy-btn-text').textContent = originalText;
        }, 500);
    } catch (err) {
        console.error('Failed to copy:', err);
        showError('Failed to copy to clipboard');
    }
}

// Handle Analyze Button Click
async function handleAnalyzeClick() {
    const subjectLine = subjectLineInput.value.trim();
    const emailAddress = emailAddressInput.value.trim();
    const copyText = emailCopyTextarea.value.trim();

    // Validation - all fields required
    if (!subjectLine && !emailAddress && !copyText) {
        showError('Please enter all required fields: subject line, email address, and email body.');
        return;
    }
    if (!subjectLine) {
        showError('Please enter a subject line.');
        return;
    }
    if (!emailAddress) {
        showError('Please enter your email address.');
        return;
    }

    // Validate email format and professional domain
    if (!validateEmailAddress()) {
        showError('Please enter a valid professional email address (not @gmail.com).');
        return;
    }

    if (!copyText) {
        showError('Please enter your email body.');
        return;
    }

    // Hide previous results/errors
    hideError();
    hideResults();

    // Show loading state
    setLoadingState(true);

    try {
        const result = await analyzeAndImprove(subjectLine, copyText);
        displayResults(result);
    } catch (error) {
        showError(error.message || 'An error occurred while analyzing your copy. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// Handle Clear Button Click
function handleClearClick() {
    subjectLineInput.value = '';
    emailAddressInput.value = '';
    emailCopyTextarea.value = '';

    // Clear email validation errors
    emailAddressInput.classList.remove('error');
    emailErrorText.style.display = 'none';
    emailErrorText.textContent = '';

    updateSubjectCounter();
    updateBodyCounter();
    updateButtonState();
    hideResults();
    hideError();
    subjectLineInput.focus();
}

// Analyze and Improve - Combined API Call
async function analyzeAndImprove(subjectLine, copyText) {
    // Check if demo mode is enabled (from modal)
    if (demoModeToggleModal.checked) {
        return getDemoResponse(subjectLine, copyText);
    }

    // Get selected model (from modal)
    const selectedModel = modelSelectModal.value;

    // Call backend API
    const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subjectLine: subjectLine,
            copy: copyText,
            model: selectedModel,
            email: emailAddressInput.value.trim()
        }),
        signal: AbortSignal.timeout(API_CONFIG.timeout)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

// Display Results
function displayResults(result) {
    // Display original copy score
    const score = result.review.originalScore || 0;
    originalScore.textContent = score;

    // Update status badge
    const scoreStatus = document.getElementById('scoreStatus');
    const scoreClass = getScoreClass(score);
    const statusText = getScoreStatusText(score);

    scoreStatus.textContent = statusText;
    scoreStatus.className = 'score-status-badge ' + scoreClass;

    // Display original copy (for comparison)
    originalSubjectDisplay.textContent = cleanText(result.original.subjectLine);
    originalBodyDisplay.textContent = cleanText(result.original.copy);

    // Reset original copy visibility
    originalCopyVisible = false;
    originalCopySection.style.display = 'none';
    showOriginalBtn.textContent = 'Show Original';

    // Display improved copy (clean em dashes)
    improvedSubject.textContent = cleanText(result.improved.subjectLine);

    // Display improved body with proper line breaks (clean em dashes)
    // The body already has \n characters, we just need to display them correctly
    improvedBody.textContent = cleanText(result.improved.copy);

    // Display changes in collapsible format
    changesList.innerHTML = '';
    if (result.changes && Array.isArray(result.changes)) {
        result.changes.forEach((change, index) => {
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item';

            const summary = change.summary || `${change.category} improvements`;
            const detail = change.detail || '';
            const signal = change.signal || '';

            changeItem.innerHTML = `
                <div class="change-header" onclick="toggleChangeDetail(this)">
                    <div class="change-header-content">
                        <div class="change-category">${escapeHtml(change.category)}${signal ? ` <span class="signal-badge">${escapeHtml(signal)}</span>` : ''}</div>
                        <div class="change-summary">${escapeHtml(summary)}</div>
                    </div>
                    <svg class="expand-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 8 10 12 14 8"></polyline>
                    </svg>
                </div>
                <div class="change-detail" style="display: none;">
                    <div class="before-after">
                        <div class="before-after-row">
                            <div class="change-label before">Before:</div>
                            <div class="change-text strikethrough">${escapeHtml(change.issue || change.before || 'Original version')}</div>
                        </div>
                        <div class="before-after-row">
                            <div class="change-label after">After:</div>
                            <div class="change-text">${escapeHtml(change.reason || change.after || change.fix)}</div>
                        </div>
                    </div>
                    ${change.why ? `
                        <div class="change-why">
                            <span class="change-why-icon">💡</span>
                            <span class="change-why-text">${escapeHtml(change.why)}</span>
                        </div>
                    ` : ''}
                    ${detail ? `
                        <div class="change-detail-text">
                            ${escapeHtml(detail)}
                        </div>
                    ` : ''}
                </div>
            `;

            changesList.appendChild(changeItem);
        });
    }

    // Display next level tip (just the first one as a single tip)
    if (result.furtherTips && Array.isArray(result.furtherTips) && result.furtherTips.length > 0) {
        nextLevelTip.innerHTML = `
            <p><strong>💡 Next Level:</strong> ${escapeHtml(result.furtherTips[0])}</p>
        `;
        nextLevelTip.style.display = 'block';
    } else {
        nextLevelTip.style.display = 'none';
    }

    // Show results
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Escape HTML to prevent XSS and replace em dashes
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    // Replace em dashes (—) with regular hyphens ( - )
    return div.innerHTML.replace(/—/g, ' - ');
}

// Remove em dashes from plain text (for textContent)
function cleanText(text) {
    if (!text) return text;
    return text.replace(/—/g, ' - ');
}

// Get Score Class for Styling
function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
}

// Get Score Status Text
function getScoreStatusText(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'High Risk';
}

// Toggle Change Detail
function toggleChangeDetail(headerElement) {
    const changeItem = headerElement.closest('.change-item');
    const detailElement = changeItem.querySelector('.change-detail');
    const expandIcon = headerElement.querySelector('.expand-icon');

    const isExpanded = detailElement.style.display === 'block';

    if (isExpanded) {
        detailElement.style.display = 'none';
        changeItem.classList.remove('expanded');
        expandIcon.style.transform = 'rotate(0deg)';
    } else {
        detailElement.style.display = 'block';
        changeItem.classList.add('expanded');
        expandIcon.style.transform = 'rotate(180deg)';
    }
}

// Get text excerpt for a specific change category
function getTextExcerptForChange(category, emailData) {
    if (!emailData) return '';

    const categoryLower = category.toLowerCase();

    // Subject Line changes
    if (categoryLower.includes('subject')) {
        return emailData.subjectLine || '';
    }

    // For body changes, try to extract relevant portion
    const body = emailData.copy || '';

    // Opening Hook - first sentence/paragraph
    if (categoryLower.includes('opening') || categoryLower.includes('hook')) {
        const firstParagraph = body.split('\n\n')[0];
        return firstParagraph || '';
    }

    // Call to Action - usually last paragraph or sentence with question
    if (categoryLower.includes('cta') || categoryLower.includes('call to action')) {
        const paragraphs = body.split('\n\n');
        // Get last paragraph (excluding signature)
        for (let i = paragraphs.length - 1; i >= 0; i--) {
            if (paragraphs[i].trim() && !paragraphs[i].includes('Best,') && !paragraphs[i].includes('[Your Name]')) {
                return paragraphs[i];
            }
        }
    }

    // Value Proposition - middle content
    if (categoryLower.includes('value') || categoryLower.includes('proposition')) {
        const paragraphs = body.split('\n\n');
        // Return middle paragraph(s)
        if (paragraphs.length >= 2) {
            return paragraphs.slice(1, -1).join('\n\n');
        }
    }

    // Length - return full body
    if (categoryLower.includes('length')) {
        return body;
    }

    // Default - return first meaningful paragraph
    const paragraphs = body.split('\n\n');
    return paragraphs[0] || '';
}

// Set Loading State
function setLoadingState(isLoading) {
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');

    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        analyzeBtn.disabled = true;
        clearBtn.disabled = true;
        subjectLineInput.disabled = true;
        emailCopyTextarea.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
        clearBtn.disabled = false;
        subjectLineInput.disabled = false;
        emailCopyTextarea.disabled = false;
    }
}

// Show Error
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide Error
function hideError() {
    errorSection.style.display = 'none';
}

// Hide Results
function hideResults() {
    resultsSection.style.display = 'none';
}

// Demo Mode Response - For testing without backend
async function getDemoResponse(subjectLine, copyText) {
    // No artificial delay - return instantly
    const bodyWordCount = countWords(copyText);

    return {
        original: {
            subjectLine: subjectLine,
            copy: copyText
        },
        review: {
            score: 73,
            originalScore: 73
        },
        improved: {
            subjectLine: "Quick question about [Company]'s sales process",
            copy: "Hey [Name],\n\nNoticed you recently expanded to the midwest region. Congrats!\n\nWe helped a similar SaaS company reduce their sales cycle by 40% using personalized video outreach. They went from 90 to 54 days average close time.\n\nWorth a quick chat to see if this applies to your team?\n\nBest,\n[Your Name]",
            score: 89
        },
        changes: [
            {
                category: "Subject Line",
                issue: "12 words, no personalization",
                reason: "7 words with [Company] placeholder",
                why: "4-7 word subjects get 2x higher opens. Personalization adds +26% open rate.",
                summary: "Shortened subject and added personalization placeholder",
                detail: "The original subject was too long at 12 words, making it likely to get cut off on mobile. Research shows 4-7 word subjects get 2x higher open rates. We also added a [Company] placeholder to make personalization easy - personalization increases opens by 26%.",
                signal: ""
            },
            {
                category: "Opening Hook",
                issue: "Generic greeting, no research",
                reason: "Specific milestone: midwest expansion",
                why: "Specific observations boost replies by 32% - proves you did homework.",
                summary: "Used company expansion signal for authentic personalization",
                detail: "Generic greetings like 'Hope this finds you well' sound mass-sent and get ignored. We leveraged a real signal - their recent midwest expansion - to show genuine research. Specific observations like this boost reply rates by 32% because they prove you're not blasting the same email to thousands of people. Look for growth signals like office openings, new markets, or headcount increases.",
                signal: "Company Growth & Expansion"
            },
            {
                category: "Value Proposition",
                issue: "Vague claims, no proof",
                reason: "Concrete metric: 40% faster, 90→54 days",
                why: "Numbers are 3x more credible. Specific results = tangible ROI.",
                summary: "Added specific numbers to make value tangible",
                detail: "Vague claims like 'We help you save time' don't resonate - everyone says that. We added concrete numbers: 40% reduction and exact day counts (90→54 days). Specific metrics are 3x more credible than generic claims because prospects can visualize the exact improvement and calculate ROI for their situation.",
                signal: ""
            },
            {
                category: "Call to Action",
                issue: "High-friction 'Schedule a call'",
                reason: "'Worth a quick chat?' - question format",
                why: "Low-friction CTAs get 40% more yes replies. Questions > commands.",
                summary: "Softened CTA to reduce commitment fear",
                detail: "'Schedule a call' feels like a big commitment and triggers resistance. We changed it to 'Worth a quick chat?' which is a low-friction question format. Questions feel collaborative rather than demanding, and this phrasing gets 40% more positive responses. The word 'quick' further reduces perceived time investment.",
                signal: ""
            },
            {
                category: "Length",
                issue: `${bodyWordCount} words`,
                reason: "73 words total",
                why: "70-95 words = sweet spot for cold emails. Respects their time.",
                summary: "Optimized to ideal cold email length",
                detail: "Cold emails over 100 words see sharp drop-offs in response rates. Prospects spend less than 10 seconds scanning cold emails. The 70-95 word range is the proven sweet spot - long enough to convey value, short enough to respect their time. Every word must earn its place.",
                signal: ""
            }
        ],
        furtherTips: [
            "Replace [Name] and [Company] with actual research about the prospect - reference their LinkedIn posts, company news, or recent achievements for authentic personalization",
            "Make the opening line ultra-specific - use exact details like 'opened Chicago office last month' instead of generic 'midwest region' to show real research",
            "Add a specific case study name or company for stronger social proof - 'similar SaaS company' sounds vague, name-drop when possible to build credibility"
        ]
    };
}
