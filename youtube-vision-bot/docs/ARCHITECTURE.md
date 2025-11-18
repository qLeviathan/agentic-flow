# YouTube Vision Bot Architecture

## System Overview

The YouTube Vision Bot is built on a distributed agent architecture using AgentDB for persistent memory and swarm intelligence coordination.

## Core Components

### 1. YouTube Service (`src/services/youtube-service.ts`)

**Responsibilities:**
- Fetch YouTube video metadata
- Extract video transcripts
- Download videos
- Extract frames at regular intervals

**Key Methods:**
- `getVideoInfo(videoUrl)` - Fetch video metadata
- `getTranscript(videoUrl)` - Extract captions/subtitles
- `extractFrames(videoUrl, maxFrames)` - Extract video frames

**Dependencies:**
- `ytdl-core` - YouTube video downloader
- `youtube-transcript` - Transcript extraction
- `fluent-ffmpeg` - Video frame extraction

### 2. Vision Analyzer (`src/services/vision-analyzer.ts`)

**Responsibilities:**
- Frame-by-frame visual analysis
- Object detection
- Face detection
- Text extraction (OCR)
- Scene analysis
- Color analysis
- NLP text analysis

**Key Methods:**
- `analyzeFrame(frame)` - Comprehensive frame analysis
- `analyzeText(transcript)` - NLP analysis of transcript
- `detectObjects(image)` - Object detection
- `detectFaces(image)` - Face detection with Haar cascades
- `extractText(imagePath)` - OCR with Tesseract
- `extractDominantColors(imagePath)` - Color analysis

**Dependencies:**
- `opencv4nodejs` - Computer vision
- `tesseract.js` - OCR
- `sharp` - Image processing

### 3. Swarm Coordinator (`src/agents/swarm-coordinator.ts`)

**Responsibilities:**
- Spawn and manage agent swarm
- Distribute tasks across agents
- Aggregate results
- Generate insights using swarm intelligence

**Agent Types:**
- **Frame Analyzer Agents (5×)** - Parallel frame processing
- **Text Analyzer Agents (2×)** - NLP and transcript analysis
- **Insight Generator Agent (1×)** - Swarm intelligence synthesis

**Key Methods:**
- `initialize(db)` - Initialize swarm with AgentDB
- `spawnAnalysisSwarm(options)` - Create analysis task
- `distributeTask(taskType, tasks)` - Distribute work across agents
- `generateInsights(analysis)` - Generate swarm intelligence insights

### 4. AgentDB Manager (`src/services/agentdb-manager.ts`)

**Responsibilities:**
- Initialize AgentDB vector database
- Store video analyses with embeddings
- Semantic search across past analyses
- Store swarm tasks and insights
- Enable frontier memory features

**Frontier Memory Features:**
- **Reflexion Memory** - Learn from past analyses
- **Skill Library** - Reusable analysis patterns
- **Causal Memory** - Understand what works

**Key Methods:**
- `initialize(dbPath)` - Initialize AgentDB
- `storeAnalysis(videoId, analysis)` - Store analysis with embedding
- `searchAnalyses(query, limit)` - Semantic search
- `storeSwarmTask(taskId, taskData)` - Track swarm tasks
- `storeInsights(videoId, insights)` - Store generated insights

## Data Flow

```
1. Video URL Input
   ↓
2. YouTube Service
   ├─→ Download video metadata
   ├─→ Extract transcript
   └─→ Extract frames (30 frames)
   ↓
3. Swarm Coordinator
   ├─→ Create swarm task in AgentDB
   └─→ Distribute frames to agents
   ↓
4. Parallel Agent Processing
   ├─→ Agent 1: Analyze frames 1-6
   ├─→ Agent 2: Analyze frames 7-12
   ├─→ Agent 3: Analyze frames 13-18
   ├─→ Agent 4: Analyze frames 19-24
   └─→ Agent 5: Analyze frames 25-30
   ↓
5. Vision Analyzer (per frame)
   ├─→ Object detection
   ├─→ Face detection
   ├─→ Text extraction (OCR)
   ├─→ Scene analysis
   └─→ Color analysis
   ↓
6. Result Aggregation
   ↓
7. AgentDB Storage
   ├─→ Store analysis with embedding
   ├─→ Update skill library
   └─→ Track causal relationships
   ↓
8. Swarm Intelligence
   ├─→ Generate video summary
   ├─→ Extract key moments
   ├─→ Analyze visual patterns
   └─→ Create recommendations
   ↓
9. Output Results
```

## Swarm Coordination

### Agent Pool

```
Frame Analyzers (5 agents):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Agent 1    │  │  Agent 2    │  │  Agent 3    │
│  (idle)     │  │  (busy)     │  │  (idle)     │
└─────────────┘  └─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐
│  Agent 4    │  │  Agent 5    │
│  (busy)     │  │  (idle)     │
└─────────────┘  └─────────────┘

Text Analyzers (2 agents):
┌─────────────┐  ┌─────────────┐
│  Agent 1    │  │  Agent 2    │
│  (idle)     │  │  (idle)     │
└─────────────┘  └─────────────┘

Insight Generator (1 agent):
┌─────────────┐
│  Agent 1    │
│  (idle)     │
└─────────────┘
```

### Task Distribution

1. **Task Queue**: Frames are queued for processing
2. **Agent Assignment**: Idle agents are assigned tasks
3. **Parallel Execution**: Multiple agents process frames concurrently
4. **Result Collection**: Results are aggregated as agents complete tasks
5. **Insight Generation**: Final insights generated from all results

## Memory Architecture (AgentDB)

### Vector Storage

```
┌──────────────────────────────────────┐
│         AgentDB (SQLite)             │
├──────────────────────────────────────┤
│                                      │
│  Vectors Table:                      │
│  ├─ id                               │
│  ├─ embedding (384-dim vector)       │
│  ├─ metadata (JSON)                  │
│  │   ├─ type: 'video_analysis'      │
│  │   ├─ videoId                      │
│  │   ├─ title                        │
│  │   ├─ duration                     │
│  │   ├─ frameCount                   │
│  │   ├─ sentiment                    │
│  │   └─ keywords[]                   │
│  └─ tags[]                           │
│                                      │
│  Reflexion Memory:                   │
│  ├─ episodes (past analyses)         │
│  └─ critiques (self-improvement)     │
│                                      │
│  Skill Library:                      │
│  ├─ successful patterns              │
│  └─ reusable skills                  │
│                                      │
│  Causal Memory:                      │
│  └─ intervention effects             │
│                                      │
└──────────────────────────────────────┘
```

### Semantic Search

1. **Query Embedding**: Convert search query to vector
2. **Cosine Similarity**: Calculate similarity with stored vectors
3. **Filtering**: Apply metadata filters
4. **Ranking**: Sort by similarity score
5. **Return**: Top K results with metadata

## Performance Optimizations

### Parallel Processing

- **8 concurrent agents** for frame analysis
- **Batch processing** of frames in chunks
- **Non-blocking I/O** for file operations
- **Stream processing** for video download

### Memory Efficiency

- **Lazy loading** of video frames
- **Streaming** video download (no full buffering)
- **Vector quantization** in AgentDB
- **Connection pooling** for database access

### Caching

- **Frame cache** to avoid re-extraction
- **Embedding cache** for repeated queries
- **Video metadata cache**
- **AgentDB query cache**

## Scalability

### Horizontal Scaling

1. **Multiple Instances**: Run multiple bots in parallel
2. **Shared AgentDB**: Single database for all instances
3. **Task Queue**: Distribute videos across instances
4. **Load Balancing**: Route videos based on duration/complexity

### Vertical Scaling

1. **Increase Agent Pool**: More concurrent frame processors
2. **GPU Acceleration**: Use GPU for computer vision
3. **Larger Frames**: Extract more frames per video
4. **Higher Resolution**: Analyze at higher quality

## Error Handling

### Retry Logic

- **Network Errors**: Retry with exponential backoff
- **Frame Extraction Errors**: Skip corrupted frames
- **Analysis Failures**: Continue with partial results
- **Database Errors**: Queue for retry

### Graceful Degradation

- **Missing Transcript**: Analyze frames only
- **Frame Extraction Failure**: Use thumbnail images
- **OCR Failure**: Skip text analysis
- **Low Quality Video**: Reduce frame count

## Security Considerations

### Input Validation

- **URL Validation**: Verify YouTube URL format
- **File Path Sanitization**: Prevent directory traversal
- **Metadata Sanitization**: Clean user inputs
- **Size Limits**: Enforce max video duration

### Data Privacy

- **Local Processing**: All analysis happens locally
- **Secure Storage**: AgentDB uses local SQLite
- **No External APIs**: No data sent to third parties
- **Cleanup**: Auto-delete downloaded videos

## Future Enhancements

### Advanced Computer Vision

- TensorFlow.js object detection models
- YOLO for real-time detection
- DeepFace for facial recognition
- Pose estimation

### Enhanced NLP

- Transformers.js for embeddings
- Named entity recognition
- Topic modeling with LDA
- Summarization with T5

### Distributed Processing

- QUIC transport for multi-node coordination
- Redis for distributed task queue
- Kubernetes deployment
- Auto-scaling based on load

### Advanced Memory

- Temporal patterns across videos
- User preference learning
- Collaborative filtering
- Recommendation system
