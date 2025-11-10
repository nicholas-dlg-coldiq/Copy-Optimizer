const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const reviewRouter = require('./routes/review');

// ==============================================
// ENVIRONMENT VALIDATION
// ==============================================

function validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (!['development', 'production'].includes(nodeEnv)) {
        warnings.push(`NODE_ENV is set to '${nodeEnv}'. Expected 'development' or 'production'.`);
    }

    // Validate AI provider
    const aiProvider = process.env.AI_PROVIDER || 'anthropic';
    // Accept 'anthropic', 'claude' (normalized internally), or 'openrouter'
    if (!['anthropic', 'claude', 'openrouter'].includes(aiProvider)) {
        errors.push(`AI_PROVIDER must be 'anthropic', 'claude', or 'openrouter', got: '${aiProvider}'`);
    }

    // Check API keys based on provider
    if (aiProvider === 'anthropic' || aiProvider === 'claude') {
        if (!process.env.ANTHROPIC_API_KEY) {
            errors.push('ANTHROPIC_API_KEY is required when using Anthropic/Claude provider');
        } else if (process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
            errors.push('ANTHROPIC_API_KEY appears to be a placeholder. Please set a real API key.');
        }
    }

    if (aiProvider === 'openrouter') {
        if (!process.env.OPENROUTER_API_KEY) {
            errors.push('OPENROUTER_API_KEY is required when using OpenRouter provider');
        } else if (process.env.OPENROUTER_API_KEY === 'your-openrouter-api-key-here') {
            errors.push('OPENROUTER_API_KEY appears to be a placeholder. Please set a real API key.');
        }
    }

    // Validate boolean environment variables
    const booleanVars = ['ENABLE_FILE_LOGGING', 'ENABLE_CONSOLE_LOGS', 'LOG_DETAILED_PROMPTS', 'SHOW_ADMIN_PANEL'];
    booleanVars.forEach(varName => {
        const value = process.env[varName];
        if (value && !['true', 'false'].includes(value.toLowerCase())) {
            warnings.push(`${varName} should be 'true' or 'false', got: '${value}'`);
        }
    });

    // Check PORT
    const port = process.env.PORT;
    if (port && (isNaN(port) || parseInt(port) < 1 || parseInt(port) > 65535)) {
        errors.push(`PORT must be a valid port number (1-65535), got: '${port}'`);
    }

    return { errors, warnings };
}

// Run validation
const validation = validateEnvironment();

if (validation.errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.');
    console.error('\nCurrent environment variables (sanitized):');
    console.error(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.error(`  - AI_PROVIDER: ${process.env.AI_PROVIDER || 'not set'}`);
    console.error(`  - PORT: ${process.env.PORT || 'not set'}`);
    console.error(`  - ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'not set'}`);
    console.error(`  - OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'set' : 'not set'}`);
    console.error(`  - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'set' : 'not set (optional)'}`);
    console.error(`  - SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'set' : 'not set (optional)'}\n`);
    process.exit(1);
}

if (validation.warnings.length > 0) {
    console.warn('\n⚠️  Environment Validation Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to 0.0.0.0 for cloud platforms like Railway

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Health check endpoint (for Railway and other cloud platforms)
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api', reviewRouter);

// API endpoint to get admin panel configuration
app.get('/api/config', (req, res) => {
    res.json({
        showAdminPanel: process.env.SHOW_ADMIN_PANEL !== 'false' // Default to true
    });
});

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

app.listen(PORT, HOST, () => {
    console.log('\n==============================================');
    console.log('  COLDIQ EMAIL OPTIMIZER - SERVER STARTED');
    console.log('==============================================\n');
    console.log(`🚀 Server listening on: ${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('AI Configuration:');
    console.log(`  - Provider: ${process.env.AI_PROVIDER || 'anthropic'}`);

    const aiProvider = process.env.AI_PROVIDER || 'anthropic';
    if (aiProvider === 'anthropic' || aiProvider === 'claude') {
        console.log(`  - Anthropic API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    }
    if (aiProvider === 'openrouter' || process.env.OPENROUTER_API_KEY) {
        console.log(`  - OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    }

    console.log('');
    console.log('Database Configuration:');
    console.log(`  - Supabase URL: ${process.env.SUPABASE_URL ? '✓ Configured' : '✗ Not set (optional)'}`);
    console.log(`  - Supabase Service Key: ${process.env.SUPABASE_SERVICE_KEY ? '✓ Configured' : '✗ Not set (optional)'}`);

    console.log('');
    console.log('Logging Configuration:');
    console.log(`  - File Logging: ${process.env.ENABLE_FILE_LOGGING !== 'false' ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`  - Console Logs: ${process.env.ENABLE_CONSOLE_LOGS !== 'false' ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`  - Detailed Prompts: ${process.env.LOG_DETAILED_PROMPTS !== 'false' ? '✓ Enabled' : '✗ Disabled'}`);

    console.log('');
    console.log('UI Configuration:');
    console.log(`  - Admin Panel: ${process.env.SHOW_ADMIN_PANEL !== 'false' ? '✓ Visible' : '✗ Hidden'}`);

    console.log('');
    console.log('==============================================\n');
});
