# Quick Start Guide

## TL;DR

You have a working Copy Reviewer! Here's what to do:

## MVP (Ship Today) ✅

### 1. Get Claude API Key
- Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
- Create API key
- Copy to `.env` file

### 2. Add Your Content (30 mins)
- **Best performing emails**: Edit `data/bestPerformingCopies.js`
- **Your playbooks**: Edit `data/bestPractices.js`
- Paste your docs, rules, examples directly into these files

### 3. Turn Off Demo Mode
- Edit `script.js` line 202: `return false`

### 4. Ship It!
```bash
npm start
# Open http://localhost:3000
```

**Cost: ~$0.02-0.03 per review** (very affordable!)

## How It Works (MVP)

```
User pastes email
    ↓
Frontend sends to /api/review-copy
    ↓
Backend loads all your examples + best practices
    ↓
Sends everything to Claude API
    ↓
Claude analyzes and returns JSON
    ↓
Frontend displays beautiful review
```

**No database needed. No complex setup. Just works.**

## Your Content Strategy

### Start With (MVP):
1. **5-10 best performing emails** with their patterns
2. **Key sections from your playbooks** (copy/paste into bestPractices.js)
3. **Common mistakes** you see repeatedly

### Add Over Time:
- More email examples as you find winners
- New insights from your team
- Client-specific patterns
- Industry-specific rules

**Just edit the files and restart the server. That's it.**

## Why NOT Use Claude Projects?

You asked about Claude Projects - here's why the current approach is better:

### Claude Projects Issues:
- ❌ Designed for interactive chats, not API calls
- ❌ Can't programmatically access project context
- ❌ Would need to manually copy/paste each email
- ❌ No way to integrate into your tool
- ❌ Can't control the output format (you need JSON)

### Current Approach Benefits:
- ✅ Full API control
- ✅ Consistent JSON responses
- ✅ Embeddable in your app
- ✅ Automated workflow
- ✅ Scalable to RAG later
- ✅ You control the prompt

## Future (When You Need It)

### Upgrade to RAG When:
- You have 50+ email examples
- Multiple large playbook documents
- Doing 1,000+ reviews/month
- Want to cut costs by 66%

**But don't do this now.** Start with MVP, collect data, prove value, then scale.

See `FUTURE_RAG_GUIDE.md` for details.

## File Structure

```
Copy-reviewer/
├── index.html              # UI (dark theme ✅)
├── styles.css              # Styling
├── script.js               # Frontend (demo mode on)
├── server.js               # Express server
├── .env                    # YOUR API KEYS HERE
├── data/
│   ├── bestPerformingCopies.js  # ADD YOUR EMAILS HERE
│   └── bestPractices.js         # ADD YOUR PLAYBOOKS HERE
└── services/
    └── aiService.js        # Claude integration
```

## What You Need to Do

### Immediate (30 minutes):
1. ✅ Add Claude API key to `.env`
2. ✅ Add 3-5 best emails to `bestPerformingCopies.js`
3. ✅ Add key playbook sections to `bestPractices.js`
4. ✅ Turn off demo mode in `script.js`
5. ✅ Test with real emails

### This Week:
6. Add 10-20 more email examples
7. Add more playbook content
8. Get feedback from team
9. Iterate on the prompt

### This Month:
10. Collect usage data
11. Track which feedback is most useful
12. Refine the scoring system
13. Add more examples continuously

## Questions?

- **Setup**: See `SETUP_GUIDE.md`
- **Future scaling**: See `FUTURE_RAG_GUIDE.md`
- **Code details**: Check comments in the code
- **API costs**: ~$2.50 per 100 reviews

## The Answer to Your Question

> "What do you suggest for MVP and future plans?"

**MVP**: Use the current implementation. Add your content to the data files. It's perfect for getting started and will handle thousands of reviews.

**Future**: Upgrade to RAG when you have 50+ examples and want to scale. But you're months away from needing this.

**Do NOT**: Use Claude Projects - they're not designed for this use case.

Your current architecture is exactly right for MVP → Scale path. 🚀

---

**Ready to ship? Edit 2 files and you're done:**
1. `.env` - Add API key
2. `data/bestPerformingCopies.js` - Add your best emails
3. `data/bestPractices.js` - Add your playbook

Then: `npm start` and test!
