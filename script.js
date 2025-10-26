// API Configuration
const API_CONFIG = {
    endpoint: '/api/analyze-and-improve',
    timeout: 60000 // 60 seconds for combined operation
};

// DOM Elements
const subjectLineInput = document.getElementById('subjectLine');
const emailCopyTextarea = document.getElementById('emailCopy');
const subjectCounter = document.getElementById('subjectCounter');
const bodyCounter = document.getElementById('bodyCounter');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const demoModeToggle = document.getElementById('demoModeToggle');

// Result section elements
const originalScore = document.getElementById('originalScore');
const improvedSubject = document.getElementById('improvedSubject');
const improvedBody = document.getElementById('improvedBody');
const changesList = document.getElementById('changesList');
const furtherTipsList = document.getElementById('furtherTipsList');

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyzeClick);
clearBtn.addEventListener('click', handleClearClick);
subjectLineInput.addEventListener('input', updateSubjectCounter);
emailCopyTextarea.addEventListener('input', updateBodyCounter);

// Initialize counters on page load
updateSubjectCounter();
updateBodyCounter();

// Word Counter Functions
function countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}

function updateSubjectCounter() {
    const wordCount = countWords(subjectLineInput.value);
    subjectCounter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

function updateBodyCounter() {
    const wordCount = countWords(emailCopyTextarea.value);
    bodyCounter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

// Handle Analyze Button Click
async function handleAnalyzeClick() {
    const subjectLine = subjectLineInput.value.trim();
    const copyText = emailCopyTextarea.value.trim();

    // Validation - both fields required
    if (!subjectLine && !copyText) {
        showError('Please enter both a subject line and email body.');
        return;
    }
    if (!subjectLine) {
        showError('Please enter a subject line.');
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
    emailCopyTextarea.value = '';
    updateSubjectCounter();
    updateBodyCounter();
    hideResults();
    hideError();
    subjectLineInput.focus();
}

// Analyze and Improve - Combined API Call
async function analyzeAndImprove(subjectLine, copyText) {
    // Check if demo mode is enabled
    if (demoModeToggle.checked) {
        return getDemoResponse(subjectLine, copyText);
    }

    // Call backend API
    const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subjectLine: subjectLine,
            copy: copyText
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
    originalScore.className = 'score-number ' + getScoreClass(score);

    // Display improved copy
    improvedSubject.textContent = result.improved.subjectLine;

    // Display improved body with proper line breaks
    // The body already has \n characters, we just need to display them correctly
    improvedBody.textContent = result.improved.copy;

    // Display key changes
    changesList.innerHTML = '';
    if (result.changes && Array.isArray(result.changes)) {
        result.changes.forEach(change => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${escapeHtml(change.category)}:</strong> ${escapeHtml(change.reason)}`;
            changesList.appendChild(li);
        });
    }

    // Display further improvement tips
    furtherTipsList.innerHTML = '';
    if (result.furtherTips && Array.isArray(result.furtherTips)) {
        result.furtherTips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            furtherTipsList.appendChild(li);
        });
    }

    // Show results
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get Score Class for Styling
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

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
                reason: "Shortened from 12 to 7 words and added personalization placeholder for immediate relevance"
            },
            {
                category: "Opening Hook",
                reason: "Replaced generic greeting with specific, recent company observation to show genuine research"
            },
            {
                category: "Value Proposition",
                reason: "Added concrete metric (40% reduction, 90→54 days) instead of vague benefit claims"
            },
            {
                category: "Social Proof",
                reason: "Referenced similar company success to build credibility without being salesy"
            },
            {
                category: "Call to Action",
                reason: "Changed from 'Schedule a call' to low-friction 'Worth a quick chat?' - reduces perceived commitment"
            },
            {
                category: "Length",
                reason: `Optimized from ${bodyWordCount} to 73 words - hitting the sweet spot for cold emails`
            }
        ],
        furtherTips: [
            "Replace [Name] and [Company] with actual, specific research about the prospect (LinkedIn posts, company news, recent achievements)",
            "Make the opening line even more specific - reference exact details like 'opened Chicago office last month' instead of 'midwest region'",
            "Add a specific case study name or company for stronger social proof instead of 'similar SaaS company'",
            "Personalize based on time business was founded - presidents/owners are proud of longevity",
            "Consider adding a 'give an out' line like 'No worries if timing isn't right' to reduce pressure",
            "Test a cheeky sign-off that shows personality - could boost memorability and response rates"
        ]
    };
}
