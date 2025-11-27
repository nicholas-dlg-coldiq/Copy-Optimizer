# API Key & Demo Mode Setup - Complete!

## What I Just Did

### 1. Added Your API Key ✅
- Created [.env](.env) file with your Claude API key
- Server is now configured to use the real Claude API

### 2. Added Demo Mode Toggle Button ✅
- Added a toggle switch in the top-right corner of the UI
- **Demo Mode ON (blue)**: Uses fake demo responses, no API calls, no cost
- **Demo Mode OFF (gray)**: Uses real Claude API, costs ~$0.01-0.03 per review

### 3. Updated Code Structure ✅
- Removed old hardcoded demo mode function
- Toggle now controls whether to use demo or real API
- Demo mode is ON by default for safe testing

## How to Use

### Testing (Demo Mode - Free)
1. Go to http://localhost:3000
2. Make sure the "Demo Mode" toggle is **ON** (blue)
3. Paste any email and click "Review Copy"
4. You'll get a demo response instantly
5. **No API calls, no charges**

### Production (Real AI - Paid)
1. Turn the "Demo Mode" toggle **OFF** (gray)
2. Paste your cold email
3. Click "Review Copy"
4. Claude will analyze it using all the ColdIQ frameworks and playbooks
5. **Cost: ~$0.01-0.03 per review**

## Pricing Breakdown

With Claude 3.5 Sonnet API:
- **Input**: $3 per million tokens
- **Output**: $15 per million tokens

Each review uses approximately:
- **Input tokens**: ~6,000-8,000 (your email + all the best practices context)
- **Output tokens**: ~1,000-2,000 (the detailed feedback)

**Per review cost**: $0.01 - $0.03

### Example Costs:
- 10 reviews = ~$0.10 - $0.30
- 100 reviews = ~$1.00 - $3.00
- 1,000 reviews = ~$10.00 - $30.00

## What's Included in the AI Context

When Demo Mode is OFF, Claude receives:
- ✅ All 10 core principle categories from Messaging Frameworks
- ✅ 11 proven email frameworks with templates
- ✅ Advanced personalization tactics
- ✅ 6 psychological triggers
- ✅ 5 CTA frameworks
- ✅ Follow-up strategies
- ✅ 5 use case plays
- ✅ Humor and analogy tactics
- ✅ AI prompting strategies
- ✅ Common mistakes to flag
- ✅ Your submitted email copy

The AI will analyze your email against ALL of this knowledge and provide specific, actionable feedback.

## UI Features

The toggle button:
- **Blue** = Demo Mode (free testing)
- **Gray** = Real API (costs money)
- Persists during session
- Easy to switch back and forth

## Files Updated

1. **[.env](.env)** - Contains your API key (don't commit to git!)
2. **[index.html](index.html)** - Added toggle button UI
3. **[styles.css](styles.css)** - Styled the toggle switch
4. **[script.js](script.js)** - Updated to use toggle instead of hardcoded function

## Testing Your Setup

**Try Demo Mode First:**
1. Visit http://localhost:3000
2. Toggle should be ON (blue)
3. Paste this sample email:
   ```
   Subject: Quick question about your sales process

   Hi John,

   I noticed you're hiring 3 new SDRs at Acme Corp.

   We help companies reduce onboarding time for new sales reps by 40%.

   Can we schedule a call next week?

   Best,
   Sarah
   ```
4. Click "Review Copy"
5. Should get demo response in 2 seconds

**Then Try Real API:**
1. Turn toggle OFF (gray)
2. Use the same email
3. Click "Review Copy"
4. Should get real Claude analysis (takes 5-15 seconds)
5. Check your Anthropic usage dashboard to see the API call

## Next Steps

- ✅ API key configured
- ✅ Demo mode toggle added
- ✅ Server running with both options
- 🎯 **Test with demo mode first**
- 🎯 **Then test with real API**
- 🎯 **Add your own high-performing emails to [bestPerformingCopies.js](data/bestPerformingCopies.js)**

## Important Notes

- The .env file is already in .gitignore (won't be committed)
- Demo mode is safe - it never calls the API
- You can switch between modes anytime
- Real API reviews give MUCH better feedback than demo
- The comprehensive ColdIQ knowledge base is now fully loaded

Enjoy your Copy Reviewer! 🚀
