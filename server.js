const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const reviewRouter = require('./routes/review');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api', reviewRouter);

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Copy Reviewer server running on http://localhost:${PORT}`);
    console.log(`AI Provider: ${process.env.AI_PROVIDER || 'claude'}`);
    console.log(`OpenRouter API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
});
