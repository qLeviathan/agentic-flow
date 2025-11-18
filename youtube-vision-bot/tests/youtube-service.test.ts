import { YouTubeService } from '../src/services/youtube-service';

describe('YouTubeService', () => {
  let service: YouTubeService;

  beforeEach(() => {
    service = new YouTubeService('./test-downloads');
  });

  describe('getVideoInfo', () => {
    it('should extract video info from YouTube URL', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      const info = await service.getVideoInfo(videoUrl);

      expect(info).toBeDefined();
      expect(info.id).toBe('dQw4w9WgXcQ');
      expect(info.title).toBeTruthy();
      expect(info.duration).toBeGreaterThan(0);
      expect(info.author).toBeTruthy();
    });

    it('should throw error for invalid URL', async () => {
      const invalidUrl = 'https://invalid-url.com';

      await expect(service.getVideoInfo(invalidUrl)).rejects.toThrow();
    });
  });

  describe('getTranscript', () => {
    it('should extract transcript when available', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      const transcript = await service.getTranscript(videoUrl);

      expect(transcript).toBeDefined();
      expect(transcript.segments).toBeDefined();
      expect(Array.isArray(transcript.segments)).toBe(true);
    });

    it('should return empty transcript when not available', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=invalid';

      const transcript = await service.getTranscript(videoUrl);

      expect(transcript.text).toBe('');
      expect(transcript.segments).toEqual([]);
    });
  });

  describe('extractFrames', () => {
    it('should extract frames from video', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const maxFrames = 5;

      const frames = await service.extractFrames(videoUrl, maxFrames, false);

      expect(frames).toBeDefined();
      expect(frames.length).toBeLessThanOrEqual(maxFrames);

      frames.forEach((frame) => {
        expect(frame.path).toBeTruthy();
        expect(frame.timestamp).toBeGreaterThanOrEqual(0);
        expect(frame.index).toBeGreaterThanOrEqual(0);
      });
    }, 60000); // Increase timeout for video download
  });
});
