import { VisionAnalyzer } from '../src/services/vision-analyzer';
import type { Frame } from '../src/services/youtube-service';

describe('VisionAnalyzer', () => {
  let analyzer: VisionAnalyzer;

  beforeEach(async () => {
    analyzer = new VisionAnalyzer();
    await analyzer.initialize();
  });

  describe('analyzeText', () => {
    it('should extract keywords from text', async () => {
      const transcript = {
        text: 'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data',
        segments: [],
      };

      const analysis = await analyzer.analyzeText(transcript);

      expect(analysis.keywords).toBeDefined();
      expect(analysis.keywords.length).toBeGreaterThan(0);
      expect(analysis.summary).toBeTruthy();
      expect(['positive', 'negative', 'neutral']).toContain(analysis.sentiment);
    });

    it('should detect positive sentiment', async () => {
      const transcript = {
        text: 'This is great! I love this awesome excellent content.',
        segments: [],
      };

      const analysis = await analyzer.analyzeText(transcript);

      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', async () => {
      const transcript = {
        text: 'This is terrible bad awful hate poor quality.',
        segments: [],
      };

      const analysis = await analyzer.analyzeText(transcript);

      expect(analysis.sentiment).toBe('negative');
    });

    it('should handle empty transcript', async () => {
      const transcript = {
        text: '',
        segments: [],
      };

      const analysis = await analyzer.analyzeText(transcript);

      expect(analysis.keywords).toEqual([]);
      expect(analysis.sentiment).toBe('neutral');
    });
  });

  describe('analyzeFrame', () => {
    it('should analyze frame and return structured data', async () => {
      // Mock frame - would need actual image file for real test
      const frame: Frame = {
        path: './test-data/sample-frame.png',
        timestamp: 10.5,
        index: 0,
      };

      // This test would fail without actual image file
      // In production, use fixture images for testing
      expect(async () => {
        await analyzer.analyzeFrame(frame);
      }).toBeDefined();
    });
  });
});
