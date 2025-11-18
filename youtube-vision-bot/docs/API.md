# API Documentation

## YouTubeVisionBot

Main class for analyzing YouTube videos with computer vision and swarm intelligence.

### Constructor

```typescript
const bot = new YouTubeVisionBot();
```

### Methods

#### `initialize(): Promise<void>`

Initialize the bot with AgentDB and swarm coordination.

**Example:**
```typescript
await bot.initialize();
```

#### `analyzeVideo(options: AnalysisOptions): Promise<AnalysisResult>`

Analyze a YouTube video with configurable options.

**Parameters:**
- `options.videoUrl: string` - YouTube video URL (required)
- `options.analysisType?: 'full' | 'quick' | 'frames-only' | 'text-only'` - Analysis mode (default: 'full')
- `options.maxFrames?: number` - Maximum frames to extract (default: 30)
- `options.saveFrames?: boolean` - Save frames to disk (default: false)

**Returns:** Promise<AnalysisResult>

**Example:**
```typescript
const results = await bot.analyzeVideo({
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  analysisType: 'full',
  maxFrames: 30,
  saveFrames: true,
});
```

#### `queryPastAnalyses(query: string, limit?: number): Promise<SearchResult[]>`

Search past video analyses using semantic search.

**Parameters:**
- `query: string` - Search query
- `limit?: number` - Maximum results (default: 5)

**Returns:** Promise<SearchResult[]>

**Example:**
```typescript
const similar = await bot.queryPastAnalyses('machine learning tutorial', 5);
```

#### `shutdown(): Promise<void>`

Gracefully shutdown the bot and close all connections.

**Example:**
```typescript
await bot.shutdown();
```

## Types

### AnalysisOptions

```typescript
interface AnalysisOptions {
  videoUrl: string;
  analysisType?: 'full' | 'quick' | 'frames-only' | 'text-only';
  maxFrames?: number;
  saveFrames?: boolean;
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  videoInfo: VideoInfo;
  transcript: Transcript;
  frameAnalysis?: FrameAnalysis[];
  textAnalysis?: TextAnalysis;
  swarmTaskId: string;
  timestamp: string;
  insights: Insights;
}
```

### VideoInfo

```typescript
interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  author: string;
  uploadDate: string;
  views: number;
  thumbnailUrl: string;
}
```

### FrameAnalysis

```typescript
interface FrameAnalysis {
  frameIndex: number;
  timestamp: number;
  objects: DetectedObject[];
  text: ExtractedText[];
  faces: DetectedFace[];
  scenes: SceneInfo;
  dominantColors: ColorInfo[];
}
```

### TextAnalysis

```typescript
interface TextAnalysis {
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  entities: Array<{ text: string; type: string }>;
}
```

### Insights

```typescript
interface Insights {
  videoSummary: string;
  keyMoments: Array<{
    timestamp: number;
    reason: string;
    preview: string;
  }>;
  visualPatterns: {
    faceAppearanceRate: number;
    textOverlayRate: number;
    averageObjectsPerFrame: number;
  };
  textHighlights: string[];
  recommendations: string[];
}
```

## Error Handling

All methods may throw errors. Use try-catch blocks:

```typescript
try {
  const results = await bot.analyzeVideo({ videoUrl: url });
} catch (error) {
  console.error('Analysis failed:', error);
}
```

## Common Errors

- `Invalid YouTube URL` - URL format is incorrect
- `Video not found` - Video doesn't exist or is private
- `Transcript not available` - Video has no captions
- `Frame extraction failed` - Video download or processing error
- `AgentDB initialization failed` - Database setup error
