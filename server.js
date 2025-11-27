const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const reviewRouter = require('./routes/review');
const { RATE_LIMIT, REVIEW_RATE_LIMIT, MAX_REQUEST_SIZE } = require('./config/constants');

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
    console.error('See .env.example for reference.\n');
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

// ==============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ==============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://openrouter.ai", "https://api.anthropic.com"],
        },
    },
}));

// CORS configuration - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // In production, check against allowed origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Request size limits to prevent DoS attacks
app.use(express.json({
    limit: MAX_REQUEST_SIZE,
    strict: true
}));

// Compression middleware for better performance
app.use(compression());

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health'
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Stricter rate limiting for review endpoints (more resource intensive)
const reviewLimiter = rateLimit({
    windowMs: REVIEW_RATE_LIMIT.WINDOW_MS,
    max: REVIEW_RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many review requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/review', reviewLimiter);
app.use('/api/improve', reviewLimiter);
app.use('/api/analyze-and-improve', reviewLimiter);

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
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading application');
        }
    });
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
    console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'anthropic'}`);
    console.log(`🔒 Security: Rate limiting enabled`);
    console.log(`📦 Compression: Enabled`);
    console.log(`🗄️  Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured (optional)'}`);
    console.log(`📝 File Logging: ${process.env.ENABLE_FILE_LOGGING !== 'false' ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 Admin Panel: ${process.env.SHOW_ADMIN_PANEL !== 'false' ? 'Visible' : 'Hidden'}`);
    console.log('');
    console.log('==============================================\n');
});
