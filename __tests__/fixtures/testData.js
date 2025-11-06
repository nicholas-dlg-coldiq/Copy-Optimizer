/**
 * Test fixtures and mock data for tests
 */

const sampleEmailData = {
    validSubject: "Quick question about your sales process",
    validBody: `Hey John,

Noticed you recently expanded to the midwest region. Congrats!

We helped a similar SaaS company reduce their sales cycle by 40%. They went from 90 to 54 days average close time.

Worth a quick chat to see if this applies to your team?

Best,
Alex`,

    longSubject: "I wanted to reach out to you about an amazing opportunity that could revolutionize your sales process",
    shortSubject: "Hi",

    tooLongBody: `Hey there,

I hope this email finds you well. I wanted to reach out to you today because I think we might have an amazing opportunity to work together on something really special.

Our company has been in business for over 10 years and we've worked with hundreds of clients across dozens of industries. We specialize in helping companies just like yours optimize their processes and improve efficiency.

I'd love to schedule a 30-minute call to discuss this further. Let me know what times work best for you next week. I'm available Monday through Friday between 9am and 5pm EST.

Looking forward to hearing from you soon!

Best regards,
Sales Person
Company Name
Phone: 555-1234
Email: sales@company.com`,

    tooShortBody: `Hey,

Interested?

Let me know.`,

    emptySubject: "",
    emptyBody: ""
};

const mockReviewResponse = {
    overallScore: 73,
    sections: [
        {
            title: "Subject Line Analysis",
            content: "The subject line is moderate in length at 7 words",
            items: [
                "Length is within optimal range (4-7 words)",
                "Could benefit from more personalization",
                "Avoid generic phrases like 'quick question'"
            ],
            highlight: {
                title: "Key Improvement",
                content: "Add company-specific personalization"
            }
        },
        {
            title: "Opening Hook",
            content: "Opens with specific observation about midwest expansion",
            items: [
                "Good use of specific, recent information",
                "Congratulatory tone is appropriate",
                "Shows research was done"
            ]
        },
        {
            title: "Value Proposition",
            content: "Clear value with specific metrics",
            items: [
                "40% improvement is specific and credible",
                "Concrete numbers (90 to 54 days) are powerful",
                "Similar company reference builds credibility"
            ]
        },
        {
            title: "Call to Action",
            content: "Low-pressure CTA with question format",
            items: [
                "'Worth a quick chat?' is non-threatening",
                "Could be even softer with 'worth exploring?'",
                "Single clear ask is good"
            ]
        },
        {
            title: "Length and Structure",
            content: "Email body is within optimal range",
            items: [
                "Approximately 70-80 words total",
                "Scannable structure with short paragraphs",
                "White space usage is good"
            ]
        }
    ]
};

const mockImprovedResponse = {
    improvedSubject: "Quick question about [Company]'s sales process",
    improvedBody: `Hey [Name],

Noticed you recently expanded to the midwest region. Congrats!

We helped a similar SaaS company reduce their sales cycle by 40% using personalized video outreach. They went from 90 to 54 days average close time.

Worth exploring how this applies to your team?

Best,
[Your Name]`,
    changes: [
        {
            category: "Subject Line",
            issue: "7 words, no personalization",
            reason: "Added [Company] placeholder",
            why: "Personalization adds +26% open rate.",
            summary: "Added personalization placeholder",
            detail: "Added [Company] placeholder to enable easy personalization. Research shows personalized subject lines increase opens by 26%.",
            signal: ""
        },
        {
            category: "Opening Hook",
            issue: "Generic 'Hey John'",
            reason: "Changed to [Name] placeholder",
            why: "Enables personalization at scale",
            summary: "Made name a variable for scaling",
            detail: "Changed hardcoded name to placeholder to make template scalable while maintaining personalization.",
            signal: ""
        },
        {
            category: "Value Proposition",
            issue: "Missing HOW value was delivered",
            reason: "Added 'using personalized video outreach'",
            why: "Specificity builds credibility",
            summary: "Added specific method used",
            detail: "Added the specific method (personalized video outreach) to make the value prop more credible and tangible.",
            signal: ""
        },
        {
            category: "Call to Action",
            issue: "'quick chat' creates time pressure",
            reason: "Changed to 'exploring'",
            why: "Lower friction increases replies",
            summary: "Softened CTA language",
            detail: "Changed from 'quick chat' to 'exploring' to reduce perceived commitment and make it easier to say yes.",
            signal: ""
        }
    ],
    furtherTips: [
        "Replace [Name] and [Company] with actual research about the prospect",
        "Make the opening line ultra-specific with exact details",
        "Add a specific case study name for stronger social proof"
    ],
    expectedImpact: "These changes should improve response rates by focusing on personalization and reducing friction."
};

const mockCombinedResponse = {
    original: {
        subjectLine: sampleEmailData.validSubject,
        copy: sampleEmailData.validBody
    },
    review: {
        score: 73,
        originalScore: 73
    },
    improved: {
        subjectLine: mockImprovedResponse.improvedSubject,
        copy: mockImprovedResponse.improvedBody,
        score: 89
    },
    changes: mockImprovedResponse.changes,
    furtherTips: mockImprovedResponse.furtherTips,
    expectedImpact: mockImprovedResponse.expectedImpact
};

module.exports = {
    sampleEmailData,
    mockReviewResponse,
    mockImprovedResponse,
    mockCombinedResponse
};
