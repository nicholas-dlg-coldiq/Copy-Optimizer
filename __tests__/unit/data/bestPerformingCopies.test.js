/**
 * Tests for bestPerformingCopies data module
 */

const {
    bestPerformingCopies,
    aggregateStats,
    commonPatterns,
    getBestCopiesSummary,
    addBestPerformingCopy
} = require('../../../data/bestPerformingCopies');

describe('bestPerformingCopies module', () => {
    describe('bestPerformingCopies array', () => {
        test('should be an array with entries', () => {
            expect(Array.isArray(bestPerformingCopies)).toBe(true);
            expect(bestPerformingCopies.length).toBeGreaterThan(0);
        });

        test('each copy should have required properties', () => {
            bestPerformingCopies.forEach(copy => {
                expect(copy).toHaveProperty('id');
                expect(copy).toHaveProperty('category');
                expect(copy).toHaveProperty('responseRate');
                expect(copy).toHaveProperty('characteristics');
                expect(copy).toHaveProperty('patterns');

                expect(typeof copy.responseRate).toBe('number');
                expect(copy.responseRate).toBeGreaterThan(0);
                expect(copy.responseRate).toBeLessThanOrEqual(100);
            });
        });

        test('characteristics should have expected fields', () => {
            bestPerformingCopies.forEach(copy => {
                const { characteristics } = copy;
                expect(characteristics).toHaveProperty('subjectLength');
                expect(characteristics).toHaveProperty('emailLength');
                expect(characteristics).toHaveProperty('personalizationPoints');
                expect(characteristics).toHaveProperty('hasDataPoint');
                expect(characteristics).toHaveProperty('hasSocialProof');
                expect(characteristics).toHaveProperty('ctaType');
                expect(characteristics).toHaveProperty('tone');

                expect(typeof characteristics.subjectLength).toBe('number');
                expect(typeof characteristics.emailLength).toBe('number');
                expect(typeof characteristics.hasDataPoint).toBe('boolean');
            });
        });

        test('patterns should be an array of strings', () => {
            bestPerformingCopies.forEach(copy => {
                expect(Array.isArray(copy.patterns)).toBe(true);
                expect(copy.patterns.length).toBeGreaterThan(0);
                copy.patterns.forEach(pattern => {
                    expect(typeof pattern).toBe('string');
                    expect(pattern.length).toBeGreaterThan(0);
                });
            });
        });

        test('should include different categories', () => {
            const categories = bestPerformingCopies.map(c => c.category);
            expect(new Set(categories).size).toBeGreaterThan(1);
        });
    });

    describe('aggregateStats', () => {
        test('should have all required properties', () => {
            expect(aggregateStats).toHaveProperty('averageResponseRate');
            expect(aggregateStats).toHaveProperty('optimalSubjectLength');
            expect(aggregateStats).toHaveProperty('optimalEmailLength');
            expect(aggregateStats).toHaveProperty('averagePersonalizationPoints');
            expect(aggregateStats).toHaveProperty('topCTAType');
            expect(aggregateStats).toHaveProperty('preferredTone');
        });

        test('average response rate should be reasonable', () => {
            expect(typeof aggregateStats.averageResponseRate).toBe('number');
            expect(aggregateStats.averageResponseRate).toBeGreaterThan(0);
            expect(aggregateStats.averageResponseRate).toBeLessThanOrEqual(100);
        });

        test('optimal lengths should be strings with guidance', () => {
            expect(typeof aggregateStats.optimalSubjectLength).toBe('string');
            expect(typeof aggregateStats.optimalEmailLength).toBe('string');
            expect(aggregateStats.optimalEmailLength).toContain('70-95');
        });

        test('average personalization points should be positive', () => {
            expect(typeof aggregateStats.averagePersonalizationPoints).toBe('number');
            expect(aggregateStats.averagePersonalizationPoints).toBeGreaterThan(0);
        });
    });

    describe('commonPatterns', () => {
        test('should be an array with pattern objects', () => {
            expect(Array.isArray(commonPatterns)).toBe(true);
            expect(commonPatterns.length).toBeGreaterThan(0);
        });

        test('each pattern should have required properties', () => {
            commonPatterns.forEach(pattern => {
                expect(pattern).toHaveProperty('pattern');
                expect(pattern).toHaveProperty('description');
                expect(pattern).toHaveProperty('frequency');
                expect(typeof pattern.pattern).toBe('string');
                expect(typeof pattern.description).toBe('string');
                expect(typeof pattern.frequency).toBe('string');
            });
        });

        test('should include key patterns', () => {
            const patternNames = commonPatterns.map(p => p.pattern);
            expect(patternNames).toContain('Specific personalization');
            expect(patternNames).toContain('Brief and scannable');
        });

        test('frequencies should be in valid format', () => {
            commonPatterns.forEach(pattern => {
                expect(pattern.frequency).toMatch(/\d+%/);
            });
        });
    });

    describe('getBestCopiesSummary()', () => {
        let summary;

        beforeAll(() => {
            summary = getBestCopiesSummary();
        });

        test('should return a non-empty string', () => {
            expect(typeof summary).toBe('string');
            expect(summary.length).toBeGreaterThan(0);
        });

        test('should include aggregate stats', () => {
            expect(summary).toContain('Average Response Rate');
            expect(summary).toContain('Optimal Subject Length');
            expect(summary).toContain('Optimal Email Length');
            expect(summary).toContain(aggregateStats.averageResponseRate.toString());
        });

        test('should include key patterns section', () => {
            expect(summary).toContain('KEY PATTERNS');
            commonPatterns.forEach(pattern => {
                expect(summary).toContain(pattern.pattern);
            });
        });

        test('should include examples by category', () => {
            expect(summary).toContain('EXAMPLES BY CATEGORY');
            bestPerformingCopies.forEach(copy => {
                expect(summary).toContain(copy.category);
                expect(summary).toContain(`${copy.responseRate}% response rate`);
            });
        });

        test('should be well-formatted for AI', () => {
            expect(summary).toContain('TOP PERFORMING PATTERNS:');
            expect(summary).toMatch(/\n-\s+/); // Has bullet points
        });
    });

    describe('addBestPerformingCopy()', () => {
        let initialLength;

        beforeEach(() => {
            initialLength = bestPerformingCopies.length;
        });

        test('should add a new copy to the array', () => {
            const newCopy = {
                category: 'Test Category',
                responseRate: 50,
                characteristics: {
                    subjectLength: 40,
                    emailLength: 80,
                    personalizationPoints: 2,
                    hasDataPoint: true,
                    hasSocialProof: false,
                    ctaType: 'question',
                    tone: 'direct'
                },
                patterns: ['Test pattern 1', 'Test pattern 2']
            };

            addBestPerformingCopy(newCopy);

            expect(bestPerformingCopies.length).toBe(initialLength + 1);
            const addedCopy = bestPerformingCopies[bestPerformingCopies.length - 1];
            expect(addedCopy.category).toBe('Test Category');
            expect(addedCopy).toHaveProperty('id');
            expect(addedCopy).toHaveProperty('addedAt');
        });

        test('should assign incremental ID', () => {
            const newCopy = {
                category: 'Another Test',
                responseRate: 45,
                characteristics: {
                    subjectLength: 35,
                    emailLength: 75,
                    personalizationPoints: 3,
                    hasDataPoint: true,
                    hasSocialProof: true,
                    ctaType: 'low-commitment',
                    tone: 'conversational'
                },
                patterns: ['Pattern A']
            };

            addBestPerformingCopy(newCopy);
            const addedCopy = bestPerformingCopies[bestPerformingCopies.length - 1];
            expect(addedCopy.id).toBe(initialLength + 1);
        });

        test('should add timestamp', () => {
            const newCopy = {
                category: 'Timestamp Test',
                responseRate: 55,
                characteristics: {
                    subjectLength: 42,
                    emailLength: 90,
                    personalizationPoints: 4,
                    hasDataPoint: false,
                    hasSocialProof: true,
                    ctaType: 'low-commitment',
                    tone: 'consultative'
                },
                patterns: ['Pattern X']
            };

            addBestPerformingCopy(newCopy);
            const addedCopy = bestPerformingCopies[bestPerformingCopies.length - 1];
            expect(addedCopy.addedAt).toBeDefined();
            expect(new Date(addedCopy.addedAt).toString()).not.toBe('Invalid Date');
        });
    });

    describe('data quality validation', () => {
        test('email lengths should be in optimal range', () => {
            bestPerformingCopies.forEach(copy => {
                expect(copy.characteristics.emailLength).toBeGreaterThanOrEqual(60);
                expect(copy.characteristics.emailLength).toBeLessThanOrEqual(110);
            });
        });

        test('response rates should correlate with best practices', () => {
            // Copies with more personalization should generally perform well
            const highPerformers = bestPerformingCopies.filter(c => c.responseRate >= 40);
            expect(highPerformers.length).toBeGreaterThan(0);

            highPerformers.forEach(copy => {
                // High performers should have at least 2 personalization points
                expect(copy.characteristics.personalizationPoints).toBeGreaterThanOrEqual(2);
            });
        });

        test('all have low-commitment or question CTAs', () => {
            bestPerformingCopies.forEach(copy => {
                expect(['low-commitment', 'question']).toContain(
                    copy.characteristics.ctaType
                );
            });
        });
    });
});
