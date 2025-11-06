// Debug script to test AI service directly
require('dotenv').config();
const aiService = require('./services/aiService');

async function testAIService() {
    const subjectLine = "Quick question about your sales process";
    const emailCopy = `Hey John,

Noticed you recently expanded to the midwest region. Congrats!

We helped a similar SaaS company reduce their sales cycle by 40%. They went from 90 to 54 days average close time.

Worth a quick chat to see if this applies to your team?

Best,
Alex`;

    console.log('Testing AI Service...');
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 20));
    console.log('\nCalling reviewCopy...\n');

    try {
        const review = await aiService.reviewCopy(subjectLine, emailCopy);
        console.log('Review successful!');
        console.log(JSON.stringify(review, null, 2));
    } catch (error) {
        console.error('\n=== ERROR DETAILS ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.error) {
            console.error('API Error details:', JSON.stringify(error.error, null, 2));
        }

        if (error.response) {
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
        }
    }
}

testAIService();
