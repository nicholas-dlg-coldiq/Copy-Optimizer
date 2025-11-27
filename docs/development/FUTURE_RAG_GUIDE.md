# RAG Implementation Guide (Future)

This guide shows how to upgrade from the current MVP to a RAG (Retrieval-Augmented Generation) system when you're ready to scale.

## When You Need RAG

✅ Implement RAG when you have:
- 50+ email examples
- Multiple large documents (playbooks, guides)
- 1,000+ reviews per month
- Frequently updating content

❌ Don't implement RAG if:
- Just starting out (MVP is fine!)
- Less than 20 examples
- Low volume (<500 reviews/month)
- Content rarely changes

## Architecture Comparison

### Current MVP:
```
User submits email
    ↓
Send ALL best practices + ALL examples to Claude
    ↓
Claude reviews (processes 3K-4K tokens of context)
    ↓
Return review

Cost: ~$0.03 per review
```

### Future RAG:
```
User submits email
    ↓
Embed email → Search vector DB
    ↓
Retrieve only top 5 most relevant examples
    ↓
Send to Claude with relevant context only (1K tokens)
    ↓
Return review

Cost: ~$0.01 per review (66% cheaper)
```

## Implementation Options

### Option 1: Pinecone (Recommended for MVP → Scale)

**Pros:**
- Managed (no infrastructure)
- Free tier: 100K vectors
- Easy setup
- Great docs

**Cons:**
- Vendor lock-in
- Paid after free tier

**Setup:**

```javascript
// 1. Install
npm install @pinecone-database/pinecone openai

// 2. Create service (services/vectorService.js)
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

class VectorService {
    constructor() {
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.index = this.pinecone.index('email-examples');
    }

    async embedText(text) {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });
        return response.data[0].embedding;
    }

    async findRelevantExamples(emailCopy, topK = 5) {
        const embedding = await this.embedText(emailCopy);

        const results = await this.index.query({
            vector: embedding,
            topK: topK,
            includeMetadata: true
        });

        return results.matches.map(match => match.metadata);
    }
}

// 3. Update aiService.js
const vectorService = new VectorService();

async reviewWithClaude(emailCopy) {
    // Get only relevant examples
    const relevantExamples = await vectorService.findRelevantExamples(emailCopy);

    // Build prompt with only relevant context
    const systemPrompt = this.buildSystemPrompt(relevantExamples);
    // ... rest of the code
}
```

### Option 2: Weaviate (Open Source)

**Pros:**
- Free, open source
- Self-hosted or cloud
- Great for learning
- Full control

**Cons:**
- More setup required
- You manage infrastructure

**Docker Setup:**

```yaml
# docker-compose.yml
version: '3.4'
services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - 8080:8080
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-openai'
      ENABLE_MODULES: 'text2vec-openai'
      OPENAI_APIKEY: ${OPENAI_API_KEY}
```

### Option 3: ChromaDB (Simplest)

**Pros:**
- Easiest to set up
- Runs in-memory or persistent
- Perfect for learning
- No external dependencies

**Cons:**
- Not for production scale
- Limited features vs Pinecone

**Setup:**

```javascript
npm install chromadb

const { ChromaClient } = require('chromadb');

class SimpleVectorService {
    async initialize() {
        this.client = new ChromaClient();
        this.collection = await this.client.getOrCreateCollection({
            name: 'email_examples'
        });
    }

    async addExample(email, metadata) {
        await this.collection.add({
            documents: [email.content],
            metadatas: [metadata],
            ids: [email.id]
        });
    }

    async findRelevant(emailCopy, n = 5) {
        const results = await this.collection.query({
            queryTexts: [emailCopy],
            nResults: n
        });
        return results.metadatas[0];
    }
}
```

## Complete RAG Implementation

Here's a full example using Pinecone:

### 1. Install Dependencies

```bash
npm install @pinecone-database/pinecone openai
```

### 2. Update .env

```env
PINECONE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here  # For embeddings
ANTHROPIC_API_KEY=your_key_here  # For review generation
```

### 3. Create Vector Service

```javascript
// services/vectorService.js
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const { bestPerformingCopies } = require('../data/bestPerformingCopies');

class VectorService {
    constructor() {
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.indexName = 'email-knowledge-base';
    }

    async initialize() {
        // Create index if doesn't exist
        const existingIndexes = await this.pinecone.listIndexes();

        if (!existingIndexes.includes(this.indexName)) {
            await this.pinecone.createIndex({
                name: this.indexName,
                dimension: 1536, // text-embedding-3-small dimension
                metric: 'cosine'
            });
        }

        this.index = this.pinecone.index(this.indexName);
    }

    async embedText(text) {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });
        return response.data[0].embedding;
    }

    async indexAllExamples() {
        console.log('Indexing email examples...');

        for (const copy of bestPerformingCopies) {
            const textToEmbed = `
                Category: ${copy.category}
                Response Rate: ${copy.responseRate}%
                Patterns: ${copy.patterns.join('. ')}
            `;

            const embedding = await this.embedText(textToEmbed);

            await this.index.upsert([{
                id: `example-${copy.id}`,
                values: embedding,
                metadata: {
                    category: copy.category,
                    responseRate: copy.responseRate,
                    patterns: copy.patterns.join('|||'), // Store as string
                    ...copy.characteristics
                }
            }]);
        }

        console.log(`Indexed ${bestPerformingCopies.length} examples`);
    }

    async findRelevantExamples(emailCopy, topK = 5) {
        const embedding = await this.embedText(emailCopy);

        const results = await this.index.query({
            vector: embedding,
            topK: topK,
            includeMetadata: true
        });

        return results.matches.map(match => ({
            category: match.metadata.category,
            responseRate: match.metadata.responseRate,
            patterns: match.metadata.patterns.split('|||'),
            similarity: match.score
        }));
    }

    async findRelevantPractices(emailCopy, topK = 3) {
        // Similar to above but for best practices
        // You'd index your best practices separately
    }
}

module.exports = new VectorService();
```

### 4. Update AI Service

```javascript
// services/aiService.js
const vectorService = require('./vectorService');

class AIService {
    async reviewWithClaude(emailCopy) {
        // Get relevant examples via RAG
        const relevantExamples = await vectorService.findRelevantExamples(emailCopy, 5);

        // Build context with only relevant examples
        const systemPrompt = this.buildSystemPromptWithRAG(relevantExamples);

        const message = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{
                role: 'user',
                content: this.buildUserPrompt(emailCopy)
            }]
        });

        return this.parseAIResponse(message.content[0].text);
    }

    buildSystemPromptWithRAG(relevantExamples) {
        const examplesContext = relevantExamples.map((ex, i) => `
            Example ${i + 1} (${ex.responseRate}% response rate):
            Category: ${ex.category}
            Key Patterns:
            ${ex.patterns.map(p => `- ${p}`).join('\n')}
        `).join('\n');

        return `You are an expert cold email reviewer.

MOST RELEVANT EXAMPLES for this email:
${examplesContext}

[Rest of your prompt...]
`;
    }
}
```

### 5. Setup Script

```javascript
// scripts/setupRAG.js
const vectorService = require('../services/vectorService');

async function setup() {
    await vectorService.initialize();
    await vectorService.indexAllExamples();
    console.log('RAG setup complete!');
}

setup().catch(console.error);
```

Run once to index your examples:
```bash
node scripts/setupRAG.js
```

## Migration Checklist

- [ ] Choose vector DB (Pinecone recommended)
- [ ] Get API keys (Pinecone + OpenAI for embeddings)
- [ ] Install dependencies
- [ ] Create vectorService.js
- [ ] Update aiService.js to use RAG
- [ ] Create setup script
- [ ] Index all existing examples
- [ ] Test with sample emails
- [ ] Monitor costs (should be ~66% lower)
- [ ] Update documentation

## Cost Comparison (1,000 reviews/month)

### Current MVP:
- Claude API: ~$25/month
- **Total: $25/month**

### With RAG:
- Claude API: ~$8/month (less context)
- OpenAI Embeddings: ~$0.50/month
- Pinecone: $0 (free tier)
- **Total: $8.50/month (66% savings)**

## Testing RAG Quality

Compare results:

```javascript
// Test script
const email = "Your test email...";

// Old way
const mvpReview = await aiService.reviewWithoutRAG(email);

// New way
const ragReview = await aiService.reviewWithClaude(email);

console.log('MVP Score:', mvpReview.overallScore);
console.log('RAG Score:', ragReview.overallScore);
console.log('Difference:', Math.abs(mvpReview.overallScore - ragReview.overallScore));
```

If scores are within 5-10 points, RAG is working well!

## Advanced: Hybrid Search

Combine semantic (vector) + keyword search:

```javascript
async findRelevantExamples(emailCopy, topK = 5) {
    // Vector search
    const semanticResults = await this.vectorSearch(emailCopy, topK);

    // Keyword search (if email mentions specific industry/role)
    const keywords = this.extractKeywords(emailCopy);
    const keywordResults = await this.keywordSearch(keywords, topK);

    // Combine and rerank
    return this.mergeResults(semanticResults, keywordResults, topK);
}
```

## Resources

- [Pinecone Docs](https://docs.pinecone.io/)
- [Weaviate Docs](https://weaviate.io/developers/weaviate)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

## When You're Ready

Start with ChromaDB locally to test the concept, then move to Pinecone for production.

You've got time - the MVP will work great for months while you collect more data!
