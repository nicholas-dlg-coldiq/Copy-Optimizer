# Model Selector Feature

## Summary
Added a dropdown in the UI to switch between Claude models for A/B testing performance.

## Changes Made

### 1. UI Updates ([index.html](index.html#L19-L25))
- Added model selector dropdown in header next to "Try Sample" button
- Two options:
  - **Sonnet 4.5 (Latest)**: `claude-sonnet-4-5-20250929` - Default
  - **Sonnet 3.5 (Faster)**: `claude-3-5-sonnet-20241022` - The older, faster model

### 2. Styling ([styles.css](styles.css#L150-L184))
- Added `.model-selector`, `.model-label`, and `.model-dropdown` styles
- Matches existing dark theme design
- Hover and focus states for better UX

### 3. Frontend Logic ([script.js](script.js))
- Added `modelSelect` DOM element reference
- Updated `analyzeAndImprove()` to include selected model in API request
- Model selection sent to backend as `model` parameter

### 4. Backend Route ([routes/review.js](routes/review.js#L88-L121))
- Accepts `model` parameter from request body
- Defaults to `claude-sonnet-4-5-20250929` if not provided
- Logs selected model for debugging
- Passes model to both review and improve service calls

### 5. AI Service ([services/aiService.js](services/aiService.js))
- Updated `reviewCopy()` and `improveCopy()` to accept optional `model` parameter
- Updated `reviewWithClaude()` and `improveWithClaude()` to use dynamic model
- Default value: `claude-sonnet-4-5-20250929`
- Logs selected model in API request logs
- Error messages now reference the actual model being used

## Usage

1. **Select Model**: Choose between Sonnet 4.5 (Latest) or Sonnet 3.5 (Faster) from dropdown
2. **Enter Email**: Add subject line and email body
3. **Analyze**: Click "Improve My Copy"
4. **Compare**: The logs will show which model was used and response times

## Performance Testing

You can now compare:
- **Sonnet 4.5**: Latest model, potentially better quality but slower (~40-50s per call)
- **Sonnet 3.5**: Older model, faster performance (~8-15s per call based on previous tests)

Check the server logs to see:
```
Using model: claude-3-5-sonnet-20241022
=== Starting Claude API Request (Review) ===
Model: claude-3-5-sonnet-20241022
...
Response time: XXXXms
```

## Testing
Turn off Demo Mode and try both models to compare:
- Response times
- Quality of suggestions
- JSON parsing stability
