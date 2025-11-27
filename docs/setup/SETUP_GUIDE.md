# Copy Reviewer Setup Guide

## MVP Setup (30 minutes)

### Step 1: Add Your API Key

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
AI_PROVIDER=claude
PORT=3000
```

Get your API key: [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

### Step 2: Add Your Best Performing Copies

Edit `data/bestPerformingCopies.js` and add your actual high-performing emails:

```javascript
{
    id: 4,
    category: 'Your Industry',
    responseRate: 45, // Actual response rate
    characteristics: {
        subjectLength: 38,
        emailLength: 89,
        personalizationPoints: 3,
        hasDataPoint: true,
        hasSocialProof: true,
        ctaType: 'low-commitment',
        tone: 'conversational'
    },
    patterns: [
        'Specific pattern you used',
        'Another pattern from this email',
        // Add 3-5 key patterns
    ]
}
```

### Step 3: Add Your Best Practices & Documents

Edit `data/bestPractices.js` and add your playbook content:

#### Add Principles
```javascript
{
    category: 'Your Custom Category',
    rules: [
        'Rule 1 from your playbook',
        'Rule 2 from your playbook',
    ]
}
```

#### Add Document Excerpts
```javascript
{
    title: 'Section from Your Playbook',
    content: `
        Paste relevant sections from your documents here.
        Can be multiple paragraphs.
        Include examples, data, insights.
    `
}
```

#### Add Techniques
```javascript
{
    name: 'Your Technique Name',
    description: 'What it is',
    example: 'Real example of it in action'
}
```

### Step 4: Disable Demo Mode

Edit `script.js` line 202:

```javascript
function useDemoMode() {
    return false; // Changed from true
}
```

### Step 5: Restart the Server

```bash
# Stop the current server (Ctrl+C in terminal)
npm start
```

### Step 6: Test It!

1. Go to `http://localhost:3000`
2. Paste a cold email
3. Click "Review Copy"
4. Get AI-powered feedback!

## Adding More Content Over Time

### Quick Updates
Just edit the data files and restart the server:
- `data/bestPerformingCopies.js` - Add successful emails
- `data/bestPractices.js` - Add new insights, rules, examples

### No Code Changes Needed
The AI automatically includes all content from these files in its context.

## Cost Estimation

### Per Request Cost (Claude 3.5 Sonnet):
- Input tokens: ~3,000-4,000 (your context + user's email)
- Output tokens: ~1,500-2,000 (detailed review)
- **Cost per review: ~$0.02-0.03**

### Monthly Estimates:
- 100 reviews: ~$2.50
- 500 reviews: ~$12.50
- 1,000 reviews: ~$25

Very affordable for MVP!

## When to Upgrade to RAG

Consider RAG when you have:

1. **50+ example emails** - Too much to send in every prompt
2. **Multiple large documents** - Playbooks, guides, case studies
3. **High volume** - 1,000+ reviews/month and want to reduce costs
4. **Dynamic content** - Frequently adding/updating examples

### RAG Architecture (Future):

```
User Input
    ↓
Embed query
    ↓
Search vector DB for relevant examples
    ↓
Retrieve top 5-10 most relevant items
    ↓
Send to Claude with only relevant context
    ↓
Return review
```

**Benefits:**
- Unlimited knowledge base size
- Lower token costs (only relevant context)
- Faster responses (less context to process)
- Better relevance (finds similar examples)

**Implementation Options:**
- **Pinecone** - Managed vector DB ($0/month to start)
- **Weaviate** - Open source, self-hosted
- **LangChain** - Framework for RAG pipelines

## Monitoring & Improvement

### Track These Metrics:
1. Average score given
2. Most common issues flagged
3. User engagement (do they act on feedback?)
4. API costs per month

### Iterate:
1. Add more examples to `bestPerformingCopies.js`
2. Refine rules in `bestPractices.js`
3. Adjust the system prompt in `aiService.js`
4. Test with real emails and tune

## Troubleshooting

### "Failed to get review from Claude API"
- Check your API key in `.env`
- Verify you have credits in your Anthropic account
- Check console for detailed error message

### Reviews are too generic
- Add more specific examples to `bestPerformingCopies.js`
- Add more rules to `bestPractices.js`
- Make your documents more detailed

### Reviews are too harsh/soft
- Adjust the system prompt tone in `aiService.js`
- Add examples of good feedback style

### Cost is too high
- Reduce `max_tokens` in `aiService.js` (currently 2000)
- Remove less important context from data files
- Consider caching (Claude supports prompt caching)

## Advanced: Prompt Caching (Save 90% on costs)

Claude supports caching frequently used prompts. Your best practices and examples rarely change, so cache them:

```javascript
const message = await this.anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: [
        {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }
        }
    ],
    messages: [/* ... */]
});
```

This caches your best practices/examples for 5 minutes. Repeated requests use cached context at 90% discount.

**Savings Example:**
- Without caching: $0.03/request
- With caching: $0.003/request (90% off)
- At 1,000 requests/month: Save $27/month

## Next Steps

1. ✅ Set up `.env` with API key
2. ✅ Add 3-5 best performing emails
3. ✅ Add your top playbook sections
4. ✅ Disable demo mode
5. ✅ Test with real emails
6. 📈 Monitor usage and iterate
7. 🚀 Scale when ready

Questions? Check the code comments or Claude API docs!
