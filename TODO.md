# TODO

## Pending Investigation

### OpenRouter Performance (Sonnet 4.5 vs 3.5)
- Sonnet 4.5 showing ~17s total response time (almost 2x slower than expected)
- "Stream & Parse Response" taking 16s (model generation time)
- No actual streaming implemented - using `response.json()` which waits for complete response
- Consider implementing streaming for perceived performance improvement
- Compare token throughput between models

## Completed

### Environment-Based Model Configuration
- [x] When admin mode is off (`SHOW_ADMIN_PANEL=false`), model is controlled by `OPENROUTER_MODEL` env var
- [x] Default: `anthropic/claude-3-5-sonnet`
- [x] Allows changing model on-the-fly without code changes in production
