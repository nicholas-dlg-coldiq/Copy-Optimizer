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
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
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
   # Required: Your Anthropic API key
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Optional: AI provider (default: claude)
   AI_PROVIDER=claude

   # Optional: Server port (default: 3000)
   PORT=3000
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
│   └── aiService.js         # Claude API integration
├── data/
│   ├── bestPractices.js     # Cold email best practices
│   └── bestPerformingCopies.js  # Example high-performing emails
├── public/
│   ├── index.html           # Main UI
│   ├── script.js            # Frontend logic
│   └── styles.css           # Styling
├── .env                     # Environment variables (you create this)
├── .env.example             # Example env file
└── package.json             # Dependencies
```

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
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `AI_PROVIDER` | No | `claude` | AI provider (currently only supports `claude`) |
| `PORT` | No | `3000` | Server port |

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

## Built With

- [Express](https://expressjs.com/) - Web framework
- [Anthropic Claude](https://www.anthropic.com/claude) - AI model
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
