// Quick test script to reproduce the API error
const fetch = require('node-fetch');

async function testAPI() {
    const testData = {
        subjectLine: "Quick question about your sales process",
        copy: "Hey John,\n\nNoticed you recently expanded to the midwest region. Congrats!\n\nWe helped a similar SaaS company reduce their sales cycle by 40%. They went from 90 to 54 days average close time.\n\nWorth a quick chat to see if this applies to your team?\n\nBest,\nAlex"
    };

    console.log('Testing API endpoint...');
    console.log('Payload:', JSON.stringify(testData, null, 2));

    try {
        const response = await fetch('http://localhost:3000/api/analyze-and-improve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        console.log('\nResponse status:', response.status);
        console.log('Response headers:', response.headers.raw());

        const responseText = await response.text();
        console.log('\nResponse body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('\nParsed response:', JSON.stringify(data, null, 2));
        } else {
            console.error('\nERROR: Request failed with status', response.status);
        }
    } catch (error) {
        console.error('\nException occurred:', error.message);
        console.error(error.stack);
    }
}

testAPI();
