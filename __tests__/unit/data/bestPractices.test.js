/**
 * Tests for bestPractices data module
 */

const { bestPractices, getBestPracticesContext } = require('../../../data/bestPractices');

describe('bestPractices module', () => {
    describe('bestPractices object', () => {
        test('should have all required sections', () => {
            expect(bestPractices).toHaveProperty('principles');
            expect(bestPractices).toHaveProperty('frameworks');
            expect(bestPractices).toHaveProperty('realExamples');
            expect(bestPractices).toHaveProperty('mistakes');
            expect(bestPractices).toHaveProperty('copywritingPrinciples');
            expect(bestPractices).toHaveProperty('selfCheckQuestions');
            expect(bestPractices).toHaveProperty('signals');
            expect(bestPractices).toHaveProperty('personalizationTactics');
            expect(bestPractices).toHaveProperty('psychologicalTriggers');
            expect(bestPractices).toHaveProperty('ctaFrameworks');
            expect(bestPractices).toHaveProperty('followUpFrameworks');
            expect(bestPractices).toHaveProperty('useCasePlays');
        });

        test('principles should be an array', () => {
            expect(Array.isArray(bestPractices.principles)).toBe(true);
            expect(bestPractices.principles.length).toBeGreaterThan(0);
        });

        test('each principle should have category and rules', () => {
            bestPractices.principles.forEach(principle => {
                expect(principle).toHaveProperty('category');
                expect(principle).toHaveProperty('rules');
                expect(Array.isArray(principle.rules)).toBe(true);
                expect(principle.rules.length).toBeGreaterThan(0);
            });
        });

        test('should contain key principle categories', () => {
            const categories = bestPractices.principles.map(p => p.category);
            expect(categories).toContain('Personalization');
            expect(categories).toContain('Subject Lines');
            expect(categories).toContain('Opening Hook');
            expect(categories).toContain('Value Proposition');
            expect(categories).toContain('Call to Action');
            expect(categories).toContain('Length & Structure');
        });

        test('frameworks should be an array with valid structure', () => {
            expect(Array.isArray(bestPractices.frameworks)).toBe(true);
            expect(bestPractices.frameworks.length).toBeGreaterThan(0);

            bestPractices.frameworks.forEach(framework => {
                expect(framework).toHaveProperty('name');
                expect(framework).toHaveProperty('whenToUse');
                // Should have either template, structure, or example
                expect(
                    framework.template || framework.structure || framework.example
                ).toBeTruthy();
            });
        });

        test('signals should contain growth and hiring triggers', () => {
            const signalTypes = bestPractices.signals.map(s => s.signal);
            expect(signalTypes).toContain('Company Growth & Expansion');
            expect(signalTypes).toContain('Hiring Patterns');
            expect(signalTypes).toContain('Funding & Financial Events');
        });

        test('each signal should have required properties', () => {
            bestPractices.signals.forEach(signal => {
                expect(signal).toHaveProperty('signal');
                expect(signal).toHaveProperty('triggers');
                expect(signal).toHaveProperty('why');
                expect(signal).toHaveProperty('example');
                expect(Array.isArray(signal.triggers)).toBe(true);
            });
        });

        test('mistakes should have fix guidance', () => {
            expect(bestPractices.mistakes.length).toBeGreaterThan(0);
            bestPractices.mistakes.forEach(mistake => {
                expect(mistake).toHaveProperty('mistake');
                expect(mistake).toHaveProperty('why');
                expect(mistake).toHaveProperty('fix');
            });
        });

        test('CTA frameworks should have examples and explanations', () => {
            expect(bestPractices.ctaFrameworks.length).toBeGreaterThan(0);
            bestPractices.ctaFrameworks.forEach(cta => {
                expect(cta).toHaveProperty('type');
                expect(cta).toHaveProperty('whyItWorks');
                if (cta.examples) {
                    expect(Array.isArray(cta.examples)).toBe(true);
                }
            });
        });
    });

    describe('getBestPracticesContext()', () => {
        let context;

        beforeAll(() => {
            context = getBestPracticesContext();
        });

        test('should return a non-empty string', () => {
            expect(typeof context).toBe('string');
            expect(context.length).toBeGreaterThan(0);
        });

        test('should include all major sections', () => {
            expect(context).toContain('# COLD EMAIL BEST PRACTICES');
            expect(context).toContain('## Core Principles');
            expect(context).toContain('## Signals & Triggers for Personalization');
            expect(context).toContain('## Proven Frameworks');
            expect(context).toContain('## Advanced Personalization Tactics');
            expect(context).toContain('## Call-to-Action Frameworks');
            expect(context).toContain('## Common Mistakes to Flag');
        });

        test('should include specific guidance on length', () => {
            expect(context).toContain('70-95 words');
            expect(context).toContain('Length & Structure');
        });

        test('should include personalization guidance', () => {
            expect(context).toContain('Personalization');
            expect(context).toContain('NO generic AI compliments');
        });

        test('should include CTA best practices', () => {
            expect(context).toContain('Call to Action');
            expect(context).toContain('Low commitment');
        });

        test('should be formatted for AI consumption', () => {
            // Should have markdown formatting
            expect(context).toMatch(/##\s+/);
            expect(context).toMatch(/\*\*/);
            expect(context).toMatch(/^-\s+/m);
        });

        test('should include specific examples', () => {
            expect(context).toContain('Example:');
            expect(context.match(/Example:/g).length).toBeGreaterThan(5);
        });

        test('should be under reasonable size limit', () => {
            // Context should be substantial but not excessive
            expect(context.length).toBeLessThan(100000); // 100KB limit
            expect(context.length).toBeGreaterThan(10000); // At least 10KB
        });
    });

    describe('best practices content quality', () => {
        test('should have actionable subject line rules', () => {
            const subjectPrinciple = bestPractices.principles.find(
                p => p.category === 'Subject Lines'
            );
            expect(subjectPrinciple).toBeDefined();
            expect(subjectPrinciple.rules.length).toBeGreaterThan(3);
        });

        test('should have specific don\'ts', () => {
            const donts = bestPractices.principles.find(
                p => p.category === 'Critical DON\'Ts'
            );
            expect(donts).toBeDefined();
            expect(donts.rules).toContain('Don\'t start with "I hope this email finds you well"');
        });

        test('should have self-check questions', () => {
            expect(bestPractices.selfCheckQuestions).toBeDefined();
            expect(bestPractices.selfCheckQuestions.length).toBeGreaterThan(0);
            expect(bestPractices.selfCheckQuestions).toContain(
                'Would I respond to this email?'
            );
        });
    });
});
