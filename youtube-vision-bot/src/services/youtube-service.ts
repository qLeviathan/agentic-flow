import ytdl from 'ytdl-core';
import { getSubtitles } from 'youtube-transcript';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  author: string;
  uploadDate: string;
  views: number;
  thumbnailUrl: string;
}

export interface Transcript {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    duration: number;
  }>;
}

export interface Frame {
  path: string;
  timestamp: number;
  index: number;
}

export class YouTubeService {
  private outputDir: string;

  constructor(outputDir: string = './youtube-downloads') {
    this.outputDir = outputDir;
  }

  async getVideoInfo(videoUrl: string): Promise<VideoInfo> {
    try {
      const info = await ytdl.getInfo(videoUrl);
      const details = info.videoDetails;

      return {
        id: details.videoId,
        title: details.title,
        description: details.description || '',
        duration: parseInt(details.lengthSeconds),
        author: details.author.name,
        uploadDate: details.uploadDate || '',
        views: parseInt(details.viewCount),
        thumbnailUrl: details.thumbnails[0]?.url || '',
      };
    } catch (error) {
      logger.error(`Failed to get video info: ${error}`);
      throw error;
    }
  }

  async getTranscript(videoUrl: string): Promise<Transcript> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      const transcriptData = await getSubtitles({ videoID: videoId });

      const fullText = transcriptData.map((t: any) => t.text).join(' ');

      return {
        text: fullText,
        segments: transcriptData.map((t: any) => ({
          text: t.text,
          start: t.offset / 1000, // Convert to seconds
          duration: t.duration / 1000,
        })),
      };
    } catch (error) {
      logger.warn(`Transcript not available: ${error}`);
      return { text: '', segments: [] };
    }
  }

  async extractFrames(
    videoUrl: string,
    maxFrames: number = 30,
    saveToDisks: boolean = true
  ): Promise<Frame[]> {
    const videoId = this.extractVideoId(videoUrl);
    const videoPath = path.join(this.outputDir, `${videoId}.mp4`);
    const framesDir = path.join(this.outputDir, 'frames', videoId);

    try {
      // Create directories
      await fs.mkdir(framesDir, { recursive: true });

      // Download video if not exists
      if (!(await this.fileExists(videoPath))) {
        await this.downloadVideo(videoUrl, videoPath);
      }

      // Get video duration
      const info = await ytdl.getInfo(videoUrl);
      const duration = parseInt(info.videoDetails.lengthSeconds);

      // Calculate frame extraction interval
      const interval = duration / maxFrames;

      const frames: Frame[] = [];

      return new Promise((resolve, reject) => {
        let frameIndex = 0;

        ffmpeg(videoPath)
          .on('end', () => {
            logger.info(`✅ Extracted ${frameIndex} frames`);
            resolve(frames);
          })
          .on('error', (err) => {
            logger.error(`Frame extraction failed: ${err}`);
            reject(err);
          })
          .screenshots({
            count: maxFrames,
            folder: framesDir,
            filename: 'frame-%04d.png',
            timestamps: Array.from({ length: maxFrames }, (_, i) => i * interval),
          })
          .on('filenames', (filenames) => {
            filenames.forEach((filename, index) => {
              frames.push({
                path: path.join(framesDir, filename),
                timestamp: index * interval,
                index,
              });
            });
          });
      });
    } catch (error) {
      logger.error(`Frame extraction failed: ${error}`);
      throw error;
    }
  }

  private async downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`📥 Downloading video to ${outputPath}`);

      ytdl(videoUrl, { quality: 'highest' })
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          logger.info('✅ Video download complete');
          resolve();
        })
        .on('error', (err) => {
          logger.error(`Download failed: ${err}`);
          reject(err);
        });
    });
  }

  private extractVideoId(videoUrl: string): string {
    const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (!match) {
      throw new Error(`Invalid YouTube URL: ${videoUrl}`);
    }
    return match[1];
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
