/**
 * Security validation service for email copy input
 */

const { MAX_SUBJECT_LENGTH, MAX_BODY_LENGTH, MIN_SUBJECT_WORDS } = require('../config/constants');

/**
 * Validate email input for security threats and format
 * @param {string} subjectLine - Email subject line
 * @param {string} copy - Email body copy
 * @returns {Array<string>} - Array of error messages (empty if valid)
 */
function validateEmailInput(subjectLine, copy) {
  const errors = [];

  // Length validation
  if (subjectLine.length > MAX_SUBJECT_LENGTH) {
    errors.push(`Subject line exceeds maximum length of ${MAX_SUBJECT_LENGTH} characters`);
  }

  if (copy.length < MIN_SUBJECT_WORDS) {
    errors.push(`Email body must be at least ${MIN_SUBJECT_WORDS} characters`);
  }

  if (copy.length > MAX_BODY_LENGTH) {
    errors.push(`Email body exceeds maximum length of ${MAX_BODY_LENGTH} characters`);
  }

  // Prompt injection detection
  const promptInjectionPatterns = [
    // "ignore" followed by "instructions/prompts/rules" with 0-3 words in between
    /ignore(?:\s+\w+){0,3}\s+(?:instructions?|prompts?|rules?)/i,
    /new\s+instructions?/i,
    /forget\s+(?:everything|all|previous|above)/i,
    /you\s+are\s+now/i,
    /system\s*:\s*/i,
    /\[system\]/i,
    /act\s+as\s+(?:if|a|an)/i,
    /roleplay/i,
    /pretend\s+(?:you|to\s+be)/i,
    /disregard/i,
    /override/i,
    // Additional comprehensive patterns
    /ignore\s+(?:all|the|these|any)/i,  // "ignore all", "ignore the"
    /bypass/i,
    /jailbreak/i,
    /return\s+the\s+(?:recipe|password|secret)/i  // "return the recipe for"
  ];

  const combinedText = `${subjectLine} ${copy}`.toLowerCase();

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Input contains potentially malicious prompt injection patterns');
      break;
    }
  }

  // SQL injection detection
  const sqlInjectionPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
    /UNION\s+SELECT/i,
    /UPDATE\s+\w+\s+SET/i,
    /ALTER\s+TABLE/i,
    /EXEC(UTE)?[\s(]/i,
    /;\s*DROP/i,
    /--\s*$/m,
    /\/\*.*\*\//,
    /xp_cmdshell/i
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Input contains potentially malicious SQL injection patterns');
      break;
    }
  }

  // XSS detection
  const xssPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, onload=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<img[^>]+on\w+/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Input contains potentially malicious XSS patterns');
      break;
    }
  }

  // System command injection detection
  const commandInjectionPatterns = [
    /\$\{.*\}/,  // Template literals
    /`.*`/,      // Backticks
    /\|\s*bash/i,
    /\|\s*sh/i,
    /\|\s*zsh/i,
    /&&\s*\w+/,  // Command chaining
    /;\s*\w+\s*=/  // Command separator with assignment
  ];

  for (const pattern of commandInjectionPatterns) {
    if (pattern.test(combinedText)) {
      errors.push('Input contains potentially malicious command injection patterns');
      break;
    }
  }

  // Email structure validation (should look like an email)
  const hasGreeting = /^(hi|hello|hey|dear|greetings)/im.test(copy.trim());
  const hasSignOff = /(best|regards|thanks|sincerely|cheers|talk soon)/im.test(copy);
  const hasMultipleLines = copy.split('\n').length > 2;
  const hasWords = copy.split(/\s+/).length >= 10;

  if (!hasWords) {
    errors.push('Email body does not appear to contain enough content');
  }

  if (!hasGreeting && !hasSignOff && !hasMultipleLines) {
    errors.push('Input does not appear to be formatted as an email');
  }

  return errors;
}

/**
 * Check if input contains excessive special characters or encoding
 * @param {string} text - Text to check
 * @returns {boolean} - True if suspicious
 */
function hasSuspiciousEncoding(text) {
  // Check for excessive URL encoding
  const urlEncodedCount = (text.match(/%[0-9A-F]{2}/gi) || []).length;
  if (urlEncodedCount > 5) return true;

  // Check for excessive HTML entities
  const htmlEntityCount = (text.match(/&[#\w]+;/g) || []).length;
  if (htmlEntityCount > 5) return true;

  // Check for unicode escape sequences
  const unicodeEscapeCount = (text.match(/\\u[0-9A-F]{4}/gi) || []).length;
  if (unicodeEscapeCount > 3) return true;

  return false;
}

/**
 * Sanitize input by removing potentially dangerous characters
 * (Use as last resort - prefer rejection)
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeInput(text) {
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}

module.exports = {
  validateEmailInput,
  hasSuspiciousEncoding,
  sanitizeInput
};
