# Cold Email Copy Reviewer

An AI-powered tool that analyzes and optimizes cold email copy using proven best practices from ColdIQ's messaging frameworks and cold email playbooks.

## Features

- **Instant Copy Analysis**: Get a score for your original cold email copy
- **AI-Powered Optimization**: Receive an improved version of your email with proper structure and personalization
- **Key Improvements**: See exactly what changed and why
- **Actionable Tips**: Get personalized recommendations for further improvement based on best practices
- **Demo Mode**: Test the tool without API calls using sample data
- **Single-Action Flow**: One click to analyze and improve your copy
- **Clean UI**: Modern, responsive design that works on all devices

## Tech Stack

- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API & OpenRouter (multi-model support)
- **Database**: Supabase (PostgreSQL) - optional usage tracking
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Data**: Curated best practices from ColdIQ playbooks

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/copy-reviewer.git
   cd copy-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Or create it manually with the following content:
   ```env
   # Environment Configuration
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0

   # AI Provider: 'anthropic' or 'openrouter'
   AI_PROVIDER=openrouter

   # API Keys
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here

   # Database (Optional)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_key

   # Logging
   ENABLE_FILE_LOGGING=false
   ENABLE_CONSOLE_LOGS=true
   LOG_DETAILED_PROMPTS=false

   # UI
   SHOW_ADMIN_PANEL=true

   # Security (Production)
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

4. **Add your Anthropic API Key**

   Open `.env` and replace `your_anthropic_api_key_here` with your actual API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   ```

   > **Where to get your API key:**
   > 1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
   > 2. Sign up or log in
   > 3. Navigate to API Keys section
   > 4. Create a new API key
   > 5. Copy and paste it into your `.env` file

5. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Demo Mode
1. Make sure "Demo Mode" toggle is ON (enabled by default)
2. Paste any cold email copy into the subject and body fields
3. Click "Improve My Copy"
4. See instant results without using API credits

### API Mode (Real AI Analysis)
1. Toggle OFF "Demo Mode"
2. Make sure your `ANTHROPIC_API_KEY` is set in `.env`
3. Paste your cold email copy
4. Click "Improve My Copy"
5. Claude will analyze and optimize your copy in real-time

### What You'll Get

1. **Your Copy Score**: A rating of your original email (0-100)
2. **Optimized Copy**: Improved version with:
   - Better subject line
   - Restructured email body with proper paragraphs
   - Enhanced personalization and value proposition
3. **Key Improvements**: Detailed breakdown of what changed and why
4. **How to Improve Further**: Actionable tips for even better personalization

## Project Structure

```
copy-reviewer/
├── server.js                 # Express server setup
├── routes/
│   └── review.js            # API endpoints
├── services/
│   ├── aiService.js         # Claude API integration
│   ├── databaseService.js   # Supabase integration
│   └── validationService.js # Input validation & security
├── middleware/
│   └── validateEmailRequest.js  # Request validation middleware
├── config/
│   └── constants.js         # Application constants
├── data/
│   ├── bestPractices.js     # Cold email best practices
│   └── bestPerformingCopies.js  # Example high-performing emails
├── docs/                    # Documentation
│   ├── setup/              # Setup guides
│   ├── development/        # Development docs
│   └── updates/            # Changelogs & updates
├── index.html              # Main UI
├── script.js               # Frontend logic
├── styles.css              # Styling
├── .env                    # Environment variables (you create this)
├── .env.example            # Example env file
└── package.json            # Dependencies
```

## Documentation

All documentation has been organized into the `docs/` directory:

### Setup Guides
- [Quick Start Guide](docs/setup/QUICK_START.md) - Get up and running in 5 minutes
- [Setup Guide](docs/setup/SETUP_GUIDE.md) - Detailed installation and configuration
- [API & Demo Mode Setup](docs/setup/API_AND_DEMO_MODE_SETUP.md) - Configure API keys and demo mode

### Development Docs
- [Testing Guide](docs/development/TESTING.md) - How to run tests and add new ones
- [Future RAG Guide](docs/development/FUTURE_RAG_GUIDE.md) - Plans for RAG integration

### Updates & Changelogs
Recent updates and fixes:
- [Performance Optimizations](docs/updates/PERFORMANCE_OPTIMIZATIONS.md) - Speed improvements
- [JSON Parsing Fix](docs/updates/JSON_PARSING_FIX.md) - Improved response parsing
- [Settings Modal Update](docs/updates/SETTINGS_MODAL_UPDATE.md) - UI improvements
- [Model Selector Update](docs/updates/MODEL_SELECTOR_UPDATE.md) - Multi-model support

See [docs/updates/](docs/updates/) for all changelogs.

## API Endpoints

### `POST /api/analyze-and-improve`

Analyzes and improves cold email copy in a single call.

**Request:**
```json
{
  "subjectLine": "Your subject line",
  "copy": "Your email body"
}
```

**Response:**
```json
{
  "original": {
    "subjectLine": "...",
    "copy": "..."
  },
  "review": {
    "score": 73,
    "originalScore": 73
  },
  "improved": {
    "subjectLine": "...",
    "copy": "..."
  },
  "changes": [
    {
      "category": "Subject Line",
      "reason": "Shortened and added personalization"
    }
  ],
  "furtherTips": [
    "Replace placeholders with actual research",
    "Add specific metrics for credibility"
  ]
}
```

### `POST /api/review-copy` (Legacy)

Just reviews the copy without generating improvements.

### `POST /api/improve` (Legacy)

Generates improved copy based on review feedback.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Conditional | - | Required if using Anthropic provider |
| `OPENROUTER_API_KEY` | Conditional | - | Required if using OpenRouter provider |
| `AI_PROVIDER` | No | `anthropic` | AI provider: `anthropic` or `openrouter` |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `NODE_ENV` | No | `development` | Environment: `development` or `production` |
| `SUPABASE_URL` | No | - | Supabase database URL (optional) |
| `SUPABASE_SERVICE_KEY` | No | - | Supabase service key (optional) |
| `ENABLE_FILE_LOGGING` | No | `true` | Enable file-based logging |
| `ENABLE_CONSOLE_LOGS` | No | `true` | Enable console logging |
| `LOG_DETAILED_PROMPTS` | No | `true` | Log full prompts and responses |
| `SHOW_ADMIN_PANEL` | No | `true` | Show settings panel in UI |
| `ALLOWED_ORIGINS` | No | - | Comma-separated CORS origins (production) |
| `RECAPTCHA_SITE_KEY` | No | - | reCAPTCHA v3 site key (bot protection) |
| `RECAPTCHA_SECRET_KEY` | No | - | reCAPTCHA v3 secret key (bot protection) |

### Customizing Best Practices

You can customize the AI's knowledge by editing:

- `data/bestPractices.js` - Add your own cold email frameworks and tactics
- `data/bestPerformingCopies.js` - Add examples of your best-performing emails

The AI will use these as context when analyzing and improving copy.

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Testing Without API Calls

Keep "Demo Mode" enabled to test the UI and flow without consuming API credits.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### "API Error: 401 Unauthorized"
- Check that your `ANTHROPIC_API_KEY` is correctly set in `.env`
- Verify the API key is valid and has available credits

### "Port 3000 already in use"
- Change the `PORT` in `.env` to a different port (e.g., `3001`)
- Or kill the process using port 3000

### "Failed to parse improved copy response"
- This is usually a temporary API issue
- Try again or check your API key limits

### Changes not reflecting
- Make sure you restart the server after changing `.env`
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

## Security Features

This application implements multiple security layers:

- **Invisible CAPTCHA (reCAPTCHA v3)**: Bot detection that scores requests silently - only challenges suspicious behavior. Most legitimate users never see a challenge.
- **Enhanced Rate Limiting**: 50 requests per 15 minutes (general), 20 requests per hour (review endpoints). Uses IP + browser fingerprinting to prevent bypass via proxy rotation.
- **CORS Protection**: Configurable allowed origins for production
- **Request Validation**: Input sanitization and malicious pattern detection (prompt injection, SQL injection, XSS, command injection)
- **Security Headers**: Helmet middleware with Content Security Policy
- **Request Size Limits**: 100KB max payload size
- **Compression**: Response compression for better performance
- **Database Race Condition Protection**: Optimistic locking for concurrent request handling

### Setting up reCAPTCHA v3

To enable bot protection:

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v3
3. Add your domain(s) to the allowed list
4. Copy your Site Key and Secret Key
5. Add them to your `.env` file:
   ```env
   RECAPTCHA_SITE_KEY=your-site-key
   RECAPTCHA_SECRET_KEY=your-secret-key
   ```

The system will automatically start verifying requests. Requests with low scores (likely bots) will be blocked.

## Built With

- [Express](https://expressjs.com/) - Web framework
- [Anthropic Claude](https://www.anthropic.com/claude) - AI model
- [OpenRouter](https://openrouter.ai/) - Multi-model AI gateway
- [Supabase](https://supabase.com/) - Database and authentication
- [Helmet](https://helmetjs.github.io/) - Security headers
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit) - Rate limiting
- [dotenv](https://github.com/motdotla/dotenv) - Environment variable management

## License

MIT

## Acknowledgments

- ColdIQ for the cold email frameworks and best practices
- Cold Email Outreach Playbook for proven tactics and templates
- All the sales and copywriting experts whose wisdom is embedded in this tool

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Made with ❤️ by ColdIQ**
