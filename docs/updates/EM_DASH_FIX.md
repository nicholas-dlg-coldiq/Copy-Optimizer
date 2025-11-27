# Em Dash Removal Fix

## Summary
All AI-generated text displayed in the UI now automatically replaces em dashes (—) with regular hyphens ( - ).

## Problem
Claude AI models sometimes generate em dashes (—) in their responses, which can look inconsistent or unprofessional in cold email copy.

## Solution
Added text cleaning functions that automatically replace all em dashes with regular hyphens before displaying content.

## Changes Made

### 1. New Helper Functions ([script.js:360-372](script.js#L360-L372))

**`escapeHtml(text)`** - Enhanced existing function
- Escapes HTML to prevent XSS attacks
- **NEW:** Replaces all em dashes (—) with " - "
- Used for innerHTML assignments

**`cleanText(text)`** - New function
- Replaces all em dashes (—) with " - "
- Used for textContent assignments
- Returns cleaned text

### 2. Display Results Updates ([script.js:280-293](script.js#L280-L293))

Applied `cleanText()` to all AI-generated content:
- Original subject line display
- Original body display
- Improved subject line display
- Improved body display

### 3. Copy to Clipboard Update ([script.js:162-166](script.js#L162-L166))

Applied `cleanText()` when copying:
- Subject line copy
- Body copy
- Ensures clipboard content is clean

## Where Em Dashes Are Removed

### Display (textContent)
✓ Original subject line
✓ Original email body
✓ Improved subject line
✓ Improved email body

### Display (innerHTML via escapeHtml)
✓ Change categories
✓ Change summaries
✓ Change details (issue, reason, why)
✓ Signal badges
✓ Further tips

### Clipboard
✓ Copied subject line
✓ Copied email body

## Examples

### Before:
```
"Worth a chat — happy to share more details"
"Results improved by 40%—up from 30 days to 18 days"
```

### After:
```
"Worth a chat - happy to share more details"
"Results improved by 40% - up from 30 days to 18 days"
```

## Technical Implementation

```javascript
// Replace pattern
text.replace(/—/g, ' - ')

// Em dash (—) → space + hyphen + space ( - )
```

## Coverage

All user-facing AI-generated text is now cleaned:
1. **Main copy** (subject + body)
2. **Change explanations** (all fields)
3. **Tips and recommendations**
4. **Clipboard copies**

The fix is comprehensive and automatic - no user action required.
