# API Key Fix Guide

## Problem Summary

You're encountering a **500 Internal Server Error** when clicking "Improve My Copy" in the application. The error message is:

```
"Failed to get review from Claude API"
```

## Root Cause

The Anthropic API key in your `.env` file (`sk-ant-api03-m6kJ7dm...`) is **expired or invalid**. This key returns a 404 error when trying to access any Claude models:

```
NotFoundError: 404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}
```

This indicates that:
1. The API key doesn't have access to Claude models
2. The key may be from an old account tier
3. The key format (`sk-ant-api03-...`) may be deprecated

## Solution

### Step 1: Get a New API Key

1. Go to **https://console.anthropic.com/**
2. Log in to your Anthropic account (or create one if needed)
3. Navigate to **API Keys** section
4. Click **"Create Key"** or **"Generate New API Key"**
5. Give it a name (e.g., "Copy Reviewer Dev")
6. Copy the new API key (it will start with `sk-ant-api03-` or similar)

**Important**: Copy the key immediately - you won't be able to see it again!

### Step 2: Update Your .env File

1. Open the `.env` file in your project root:
   ```
   C:\Users\delag\Documents\Nick\Nick\Jobs\ColdIQ\Projects\Mini-tools\Copy-reviewer\.env
   ```

2. Replace the old API key with your new one:
   ```env
   # Anthropic API Configuration
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_NEW_KEY_HERE

   # Server Configuration
   PORT=3000

   # AI Provider (claude or chatgpt)
   AI_PROVIDER=claude
   ```

3. Save the file

### Step 3: Restart Your Server

If your server is running, restart it to pick up the new environment variables:

```bash
# Stop the current server (Ctrl+C)

# Start it again
npm start

# Or if using nodemon
npm run dev
```

### Step 4: Test the Fix

1. Open your browser to `http://localhost:3000`
2. Enter a subject line and email body (or click "Try Sample")
3. Click **"Improve My Copy"**
4. You should now see results instead of an error

## Verification

To verify your API key is working, run this test script:

```bash
node debug-ai-service.js
```

If the API key is valid, you should see:
```
Testing AI Service...
API Key present: true
Calling reviewCopy...
Review successful!
```

If you still see errors, double-check:
- ✅ API key copied correctly (no extra spaces)
- ✅ `.env` file saved
- ✅ Server restarted
- ✅ API key has sufficient credits/quota

## What We Fixed in the Code

While investigating your issue, we also made these improvements:

### 1. Updated Anthropic SDK
```bash
# Updated from v0.32.1 to latest
npm install --save @anthropic-ai/sdk@latest
```

### 2. Improved Error Messages

**Before**:
```
"Failed to get review from Claude API"
```

**After**:
```javascript
// 404 Error
"Claude API model not found. Please check your API key has access to claude-3-5-sonnet-20241022"

// 401 Error
"Invalid or expired Anthropic API key. Please update ANTHROPIC_API_KEY in your .env file."

// 429 Error
"Rate limit exceeded. Please try again later."
```

These messages now tell you exactly what's wrong and how to fix it.

### 3. Updated Model Names

Changed to the latest Claude model:
```javascript
// In services/aiService.js
model: 'claude-3-5-sonnet-20241022'  // Latest Sonnet model
```

## Cost Considerations

### Anthropic Pricing (as of 2025)

**Claude 3.5 Sonnet (20241022)**:
- Input: $3 per million tokens (~$0.003 per 1K tokens)
- Output: $15 per million tokens (~$0.015 per 1K tokens)

**Estimated Cost Per Email Review**:
- Review step: ~5,000 tokens → $0.015 - $0.075
- Improve step: ~5,000 tokens → $0.015 - $0.075
- **Total per email: ~$0.03 - $0.15**

With a typical API free tier of $5-10, you can analyze:
- **~50-300 emails** before needing to add credits

### Tips to Reduce Costs

1. **Use Demo Mode for Testing**
   - Toggle "Demo Mode" ON when developing
   - This uses mock data instead of real API calls

2. **Reduce Token Usage**
   - Shorter system prompts (already optimized)
   - Lower max_tokens if responses are too long

3. **Cache Responses**
   - Consider caching common patterns
   - Save API responses to avoid re-analyzing same emails

4. **Rate Limiting**
   - Add delays between requests
   - Prevents accidental rapid-fire API calls

## Alternative: Use Demo Mode

If you don't want to use a real API key yet, you can use **Demo Mode**:

1. Open the application in your browser
2. Make sure **"Demo Mode"** toggle is **ON** (checked)
3. Click **"Improve My Copy"**
4. Results will be generated instantly using mock data (no API calls)

Demo mode is perfect for:
- Testing the UI
- Development
- Demonstrations
- When you don't have API credits

## Troubleshooting

### Still Getting 404 Errors?

**Check Model Access:**
- Some API tiers don't have access to Claude 3.5 Sonnet
- Try Claude 3 Opus: Change model to `claude-3-opus-20240229` in `services/aiService.js`
- Or Claude 3 Haiku (cheaper): `claude-3-haiku-20240307`

### Still Getting 401 Errors?

**Verify API Key:**
1. Log into https://console.anthropic.com/
2. Go to API Keys
3. Check if your key shows as "Active"
4. Verify it hasn't been revoked
5. Check your account has available credits

### Getting 429 Rate Limit Errors?

**You're making too many requests:**
- Wait 60 seconds and try again
- Check if you have multiple instances running
- Reduce request frequency

## Testing Without API Key

Run the test suite to verify everything works:

```bash
# Run all tests (uses mocked API)
npm test

# Run specific tests
npm run test:unit

# Check coverage
npm run test:coverage
```

All tests use **mocked APIs**, so they don't require a real API key.

## Need Help?

1. **Check Anthropic Status**: https://status.anthropic.com/
2. **Anthropic Documentation**: https://docs.anthropic.com/
3. **API Key Issues**: https://console.anthropic.com/settings/keys

## Summary Checklist

- [ ] Generated new API key from Anthropic Console
- [ ] Updated `.env` file with new key
- [ ] Saved `.env` file
- [ ] Restarted server
- [ ] Tested with "Improve My Copy" button
- [ ] Verified no 500 errors
- [ ] Confirmed results are displaying

Once you complete these steps, your application should work perfectly!
