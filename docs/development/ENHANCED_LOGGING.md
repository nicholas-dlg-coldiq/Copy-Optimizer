# Enhanced Performance & Quality Logging

This application now includes comprehensive logging to help you analyze and optimize both response quality and speed.

## Overview

Every API request is logged with detailed timing breakdowns, allowing you to:
- Identify performance bottlenecks
- Analyze LLM response quality
- Track token usage
- Debug parsing issues
- Compare different models and prompts

## Configuration

Enable detailed logging in your `.env` file:

```env
ENABLE_FILE_LOGGING=true
LOG_DETAILED_PROMPTS=true
ENABLE_CONSOLE_LOGS=true
```

## Log File Structure

Logs are saved to: `logs/session_<timestamp>/combined_detailed.log`

Each log file contains **9 sections**:

### Section 1: Input Fields
- Original subject line
- Original email copy
- Model name
- Temperature setting
- Max tokens

### Section 2: System Prompt
- Complete system prompt sent to the LLM
- Includes best practices, examples, and context

### Section 3: User Prompt
- The formatted user request
- Includes the email to analyze/improve

### Section 4: Review Data (if applicable)
- Previous review scores
- Feedback from earlier steps

### Section 5: LLM Raw Response
- Unprocessed response from the AI model
- Shows exactly what the API returned

### Section 6: Parsed & Validated Response
- JSON structure after parsing
- Validated and cleaned data

### Section 7: Parsing Steps & Transformations
- Step-by-step record of parsing operations
- Useful for debugging JSON parsing issues

### Section 8: Performance Metrics
- **Total Response Time** (in ms and seconds)
- **Timing Breakdown**:
  - Build Prompts
  - API Call (the actual LLM request)
  - Parse JSON Response
  - Extract Response Text
  - Parse & Validate Response
  - TOTAL REQUEST TIME
- **Token Estimates**:
  - Input tokens (approximate)
  - Output tokens (approximate)
- Stop reason (normal completion vs truncation)
- Content length

### Section 9: Quality Indicators
- Response truncation warning
- JSON parse success
- Validation status
- Quality score
- Completeness percentage

## Example Timing Breakdown

```
TIMING BREAKDOWN:
--------------------------------------------------------------------------------
1. Build Prompts                        12ms (0.012s) @ 2025-11-27T23:20:15.596Z
2. Claude API Call                    3245ms (3.245s) @ 2025-11-27T23:20:18.841Z
3. Extract Response Text                  2ms (0.002s) @ 2025-11-27T23:20:18.843Z
4. Parse & Validate Response             45ms (0.045s) @ 2025-11-27T23:20:18.888Z
5. TOTAL REQUEST TIME                  3304ms (3.304s) @ 2025-11-27T23:20:18.900Z
--------------------------------------------------------------------------------
```

## Analyzing Performance

### Speed Optimization

To reduce response time, look for:

1. **API Call duration** - The LLM request itself
   - Try smaller models (e.g., Claude Haiku vs Sonnet)
   - Reduce max_tokens if responses are hitting the limit
   - Shorten system prompts

2. **Prompt Building** - Should be <50ms
   - If high, optimize template generation

3. **Parsing** - Should be <100ms
   - If high, check for complex JSON structures

### Quality Analysis

Compare logs across different runs to identify:

1. **Quality Score** - Track improvements
2. **Completeness** - Ensure all required fields present
3. **Stop Reason** - "max_tokens" means response was cut off
4. **Response Length** - Correlate with quality scores

## Finding Logs

All logs are organized by session:

```
logs/
├── session_2025-11-27T23-20-15-596Z/
│   └── combined_detailed.log
├── session_2025-11-27T23-25-30-123Z/
│   └── combined_detailed.log
└── ...
```

## Best Practices

### For Speed Testing
1. Run the same email 5-10 times
2. Compare "Claude API Call" duration
3. Calculate average, min, max
4. Test different models side-by-side

### For Quality Testing
1. Keep input fields consistent
2. Test different system prompts
3. Compare quality scores
4. Review parsed responses for completeness

### For Debugging
1. Check Section 5 (Raw Response) for API issues
2. Check Section 7 (Parse Steps) for parsing failures
3. Review Section 9 for validation errors

## Disabling Logs

To reduce disk usage or improve performance:

```env
# Disable file logging entirely
ENABLE_FILE_LOGGING=false

# Or keep logs but without full prompts/responses
LOG_DETAILED_PROMPTS=false
```

When `LOG_DETAILED_PROMPTS=false`, only metadata and performance metrics are saved (Sections 6, 8, 9).

## Token Cost Estimation

Token estimates help calculate API costs:

```
Input Token Count (est): 1247
Output Token Count (est): 856
```

**Claude Pricing** (as of 2025):
- Sonnet 4.5: $3/1M input, $15/1M output
- Haiku: $0.25/1M input, $1.25/1M output

Example cost for 1,247 input + 856 output tokens on Sonnet 4.5:
- Input: 1,247 × $3 / 1,000,000 = $0.003741
- Output: 856 × $15 / 1,000,000 = $0.01284
- **Total: ~$0.016 per request**

## Troubleshooting

### Logs not being created
1. Check `ENABLE_FILE_LOGGING=true` in `.env`
2. Ensure `logs/` directory is writable
3. Check console for errors

### Incomplete logs
1. Set `LOG_DETAILED_PROMPTS=true`
2. Restart server after changing `.env`

### Large log files
1. Set `LOG_DETAILED_PROMPTS=false` to reduce size
2. Periodically archive old session folders
3. Add `.gitignore` entry: `logs/`

## Summary

The enhanced logging system provides everything you need to:
- ✅ Measure exact response times
- ✅ Identify bottlenecks
- ✅ Analyze quality trends
- ✅ Debug parsing issues
- ✅ Estimate costs
- ✅ Compare models and prompts

All data is timestamped and structured for easy analysis.
