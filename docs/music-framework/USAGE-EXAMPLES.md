# Zordic Music Studio - Usage Examples

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Advanced Workflows](#advanced-workflows)
4. [Integration Examples](#integration-examples)
5. [WebSocket Examples](#websocket-examples)

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install @antiwork/agentdb express ws

# Install AgentDB CLI (optional)
npm install -g @antiwork/agentdb
```

### Basic Server Setup

```javascript
const { MusicAPI } = require('./src/api/music-api');

// Create and start API server
const api = new MusicAPI({ port: 3000 });

api.start().then(() => {
  console.log('✅ Music API started on port 3000');
});
```

### Running with Hooks Integration

```javascript
const { MusicAPI } = require('./src/api/music-api');
const { HooksIntegration } = require('./src/fleet/hooks-integration');

async function main() {
  // Initialize hooks
  const hooks = new HooksIntegration({
    sessionId: 'my-music-session',
    enabled: true
  });

  await hooks.initializeSession({
    user: 'composer_123',
    project: 'my-song'
  });

  // Start API
  const api = new MusicAPI({ port: 3000 });
  await api.start();

  // Pre-task hook
  await hooks.preTask('Starting music composition session');

  console.log('✅ System ready with hooks integration');
}

main();
```

---

## Basic Usage

### Example 1: Learning from User Creation

```javascript
const axios = require('axios');

async function learnFromCreation() {
  const creation = {
    userId: 'user_123',
    creation: {
      genre: 'electronic',
      mood: 'energetic',
      tempo: 128,
      key: 'Am',
      timeSignature: '4/4',
      tracks: [
        { name: 'Kick', instrument: 'drum' },
        { name: 'Bass', instrument: 'synth' },
        { name: 'Lead', instrument: 'synth' }
      ],
      sessionTime: 450 // seconds
    }
  };

  const response = await axios.post('http://localhost:3000/patterns/learn', creation);

  console.log('Pattern learned:', response.data.patternId);
  return response.data;
}

learnFromCreation();
```

### Example 2: Getting Personalized Recommendations

```javascript
async function getRecommendations(userId) {
  const response = await axios.get(
    `http://localhost:3000/patterns/recommendations/${userId}`,
    { params: { limit: 5 } }
  );

  console.log('User Profile:', response.data.userProfile);
  console.log('\nRecommendations:');

  response.data.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.genre} - ${rec.mood}`);
    console.log(`   Tempo: ${rec.tempo} BPM, Key: ${rec.key}`);
    console.log(`   Reason: ${rec.reason}`);
    console.log(`   Confidence: ${(rec.confidence * 100).toFixed(1)}%\n`);
  });

  return response.data;
}

getRecommendations('user_123');
```

### Example 3: Generating a Beat

```javascript
async function generateBeat() {
  const context = {
    genre: 'hip-hop',
    mood: 'laid-back',
    tempo: 95,
    complexity: 4
  };

  const response = await axios.post('http://localhost:3000/beats/suggest', context);

  const beat = response.data.arrangements[0];

  console.log(`Beat: ${beat.name}`);
  console.log(`Pattern: ${beat.pattern.join(', ')}`);
  console.log(`Style: ${beat.style}`);
  console.log(`Complexity: ${beat.complexity}/10`);

  if (beat.variations) {
    console.log('\nVariations:');
    console.log('Fill:', beat.variations.fills);
    console.log('Breakdown:', beat.variations.breakdown);
  }

  return beat;
}

generateBeat();
```

### Example 4: Creating a Melody

```javascript
async function createMelody() {
  const request = {
    existingTrack: null, // Generate from scratch
    options: {
      key: 'C',
      scale: 'major',
      length: 16,
      complexity: 5,
      harmonic_role: 'melody'
    }
  };

  const response = await axios.post('http://localhost:3000/melody/generate', request);

  const melody = response.data.melody;

  console.log('Generated Melody:');
  melody.forEach((note, index) => {
    console.log(`${index + 1}. ${note.note} (MIDI: ${note.midiNote}) - ${note.duration} beats`);
  });

  console.log(`\nKey: ${response.data.metadata.key}`);
  console.log(`Scale: ${response.data.metadata.scale}`);
  console.log(`Complexity: ${response.data.metadata.complexity}/10`);

  return melody;
}

createMelody();
```

### Example 5: Student Assessment

```javascript
async function assessStudent() {
  const assessment = {
    userId: 'student_456',
    taskData: {
      skill: 'rhythm_basic',
      taskId: 'lesson_half_notes',
      score: 0.88,
      timeSpent: 180,
      mistakes: [
        { type: 'timing', severity: 'minor' },
        { type: 'timing', severity: 'minor' }
      ],
      completion: 1.0
    }
  };

  const response = await axios.post('http://localhost:3000/student/assess', assessment);

  const result = response.data.assessment;

  console.log('Assessment Results:');
  console.log(`Skill: ${result.skill}`);
  console.log(`Previous Level: ${result.previousLevel.toFixed(1)}`);
  console.log(`New Level: ${result.newLevel.toFixed(1)}`);
  console.log(`Improvement: +${result.improvement.toFixed(1)}`);
  console.log(`Accuracy: ${result.accuracy.toFixed(1)}%`);

  console.log('\nFeedback:');
  result.feedback.forEach(fb => console.log(`- ${fb}`));

  console.log('\nNext Steps:');
  result.nextSteps.forEach(step => {
    console.log(`- ${step.type}: ${step.reason}`);
  });

  return result;
}

assessStudent();
```

---

## Advanced Workflows

### Example 6: Complete Song Creation Workflow

```javascript
async function createCompleteSong(userId) {
  console.log('🎵 Starting song creation workflow...\n');

  // Step 1: Get user's preferred style
  const recommendations = await axios.get(
    `http://localhost:3000/patterns/recommendations/${userId}`,
    { params: { limit: 1 } }
  );

  const style = recommendations.data.recommendations[0];
  console.log(`✅ Style selected: ${style.genre} - ${style.mood}`);

  // Step 2: Generate beat
  const beatResponse = await axios.post('http://localhost:3000/beats/suggest', {
    genre: style.genre,
    tempo: style.tempo,
    complexity: Math.max(3, style.complexity - 2) // Slightly easier
  });

  const beat = beatResponse.data.arrangements[0];
  console.log(`✅ Beat created: ${beat.name}`);

  // Step 3: Get chord progression
  const chordResponse = await axios.post('http://localhost:3000/melody/chord-progression', {
    genre: style.genre,
    mood: style.mood,
    key: style.key,
    length: 4
  });

  const chords = chordResponse.data.progression;
  console.log(`✅ Chord progression: ${chords.name}`);

  // Step 4: Generate melody
  const melodyResponse = await axios.post('http://localhost:3000/melody/generate', {
    existingTrack: null,
    options: {
      key: style.key,
      scale: 'major',
      length: 16,
      complexity: style.complexity,
      harmonic_role: 'melody'
    }
  });

  const melody = melodyResponse.data.melody;
  console.log(`✅ Melody generated: ${melody.length} notes`);

  // Step 5: Learn the creation
  await axios.post('http://localhost:3000/patterns/learn', {
    userId,
    creation: {
      genre: style.genre,
      mood: style.mood,
      tempo: style.tempo,
      key: style.key,
      tracks: [
        { name: 'Beat', data: beat },
        { name: 'Chords', data: chords },
        { name: 'Melody', data: melody }
      ]
    }
  });

  console.log('✅ Song learned and saved\n');

  return {
    style,
    beat,
    chords,
    melody
  };
}

createCompleteSong('user_123');
```

### Example 7: Adaptive Learning Session

```javascript
async function runLearningSession(studentId, targetSkill) {
  console.log(`🎓 Starting learning session for ${studentId}\n`);

  let currentLevel = 0;
  const lessons = ['lesson_1', 'lesson_2', 'lesson_3', 'lesson_4'];

  for (const lessonId of lessons) {
    console.log(`📚 Lesson: ${lessonId}`);

    // Simulate lesson performance (in real app, this comes from student activity)
    const score = 0.7 + Math.random() * 0.25; // 70-95%
    const timeSpent = 180 + Math.random() * 120; // 3-5 minutes

    // Assess performance
    const assessmentResponse = await axios.post('http://localhost:3000/student/assess', {
      userId: studentId,
      taskData: {
        skill: targetSkill,
        taskId: lessonId,
        score,
        timeSpent,
        mistakes: score < 0.85 ? [{ type: 'timing', severity: 'minor' }] : [],
        completion: 1.0
      }
    });

    const assessment = assessmentResponse.data.assessment;
    currentLevel = assessment.newLevel;

    console.log(`  Score: ${(score * 100).toFixed(1)}%`);
    console.log(`  Level: ${currentLevel.toFixed(1)}`);
    console.log(`  Improvement: +${assessment.improvement.toFixed(1)}`);

    // Check if ready to advance
    if (currentLevel >= 50) {
      console.log('\n🎉 Ready to advance to intermediate level!');
      break;
    }

    console.log('');
  }

  // Get final report
  const reportResponse = await axios.get(`http://localhost:3000/student/${studentId}/report`);
  const report = reportResponse.data.report;

  console.log('\n📊 Final Report:');
  console.log(`Overall Level: ${report.overallLevel}`);
  console.log(`Skill Level: ${report.skillLevel}`);
  console.log(`Lessons Completed: ${report.totalLessonsCompleted}`);
  console.log(`Top Strengths: ${report.topStrengths.join(', ')}`);

  return report;
}

runLearningSession('student_789', 'rhythm_basic');
```

### Example 8: Multi-Agent Collaboration

```javascript
async function collaborativeComposition(userIds) {
  console.log(`🤝 Starting collaborative composition with ${userIds.length} users\n`);

  // Collect preferences from all users
  const allRecommendations = await Promise.all(
    userIds.map(userId =>
      axios.get(`http://localhost:3000/patterns/recommendations/${userId}`, {
        params: { limit: 3 }
      })
    )
  );

  // Merge preferences
  const genres = allRecommendations.flatMap(r =>
    r.data.recommendations.map(rec => rec.genre)
  );

  const genreCounts = genres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const popularGenre = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  console.log(`✅ Collaborative genre: ${popularGenre}`);

  // Create with multi-agent coordination
  const compositionResponse = await axios.post('http://localhost:3000/create/music', {
    userId: userIds[0], // Primary user
    context: {
      genre: popularGenre,
      mood: 'collaborative',
      tempo: 120,
      key: 'C'
    }
  });

  const composition = compositionResponse.data.result;

  console.log(`✅ Composition created`);
  console.log(`  Agents involved: ${composition.allResults.length}`);
  console.log(`  Failed agents: ${composition.failedAgents.length}`);

  return composition;
}

collaborativeComposition(['user_1', 'user_2', 'user_3']);
```

---

## Integration Examples

### Example 9: React Frontend Integration

```javascript
// MusicStudioClient.js
import axios from 'axios';

class MusicStudioClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({ baseURL });
  }

  async getRecommendations(userId, limit = 5) {
    const response = await this.client.get(`/patterns/recommendations/${userId}`, {
      params: { limit }
    });
    return response.data;
  }

  async createBeat(context) {
    const response = await this.client.post('/beats/suggest', context);
    return response.data.arrangements;
  }

  async generateMelody(options) {
    const response = await this.client.post('/melody/generate', {
      existingTrack: null,
      options
    });
    return response.data.melody;
  }

  async assessPerformance(userId, taskData) {
    const response = await this.client.post('/student/assess', {
      userId,
      taskData
    });
    return response.data.assessment;
  }
}

// Usage in React component
function MusicDashboard({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const client = new MusicStudioClient();

  useEffect(() => {
    client.getRecommendations(userId).then(data => {
      setRecommendations(data.recommendations);
    });
  }, [userId]);

  return (
    <div>
      <h2>Recommended Patterns</h2>
      {recommendations.map(rec => (
        <div key={rec.id}>
          <h3>{rec.genre} - {rec.mood}</h3>
          <p>Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
          <p>{rec.reason}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## WebSocket Examples

### Example 10: Real-time Collaboration

```javascript
const WebSocket = require('ws');

class MusicCollaborationClient {
  constructor(url = 'ws://localhost:3000') {
    this.ws = new WebSocket(url);
    this.setupHandlers();
  }

  setupHandlers() {
    this.ws.on('open', () => {
      console.log('✅ Connected to collaboration server');
      this.authenticate('user_123');
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  authenticate(userId, token = 'demo_token') {
    this.send({
      type: 'authenticate',
      userId,
      token
    });
  }

  joinRoom(roomId) {
    this.send({
      type: 'join_room',
      roomId
    });
  }

  requestBeat(context) {
    this.send({
      type: 'agent_request',
      requestType: 'beat_suggestion',
      requestData: {
        method: 'suggestArrangement',
        params: [context]
      },
      options: {
        priority: 'high'
      }
    });
  }

  sharePlaybackPosition(roomId, position) {
    this.send({
      type: 'collaboration_event',
      roomId,
      event: 'playback_position',
      data: { position, timestamp: Date.now() }
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log(`✅ Client ID: ${message.clientId}`);
        break;

      case 'authenticated':
        console.log(`✅ Authenticated as ${message.userId}`);
        break;

      case 'joined_room':
        console.log(`✅ Joined room: ${message.roomId}`);
        console.log(`   Participants: ${message.participants}`);
        break;

      case 'user_joined':
        console.log(`👋 User ${message.userId} joined`);
        break;

      case 'agent_response':
        console.log(`🤖 Agent response:`, message.result);
        break;

      case 'room_agent_activity':
        console.log(`🔔 ${message.userId} performed ${message.requestType}`);
        break;

      case 'collaboration_event':
        console.log(`🎵 Collaboration event from ${message.userId}:`, message.event);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️  WebSocket not ready');
    }
  }

  close() {
    this.ws.close();
  }
}

// Usage
const client = new MusicCollaborationClient();

setTimeout(() => {
  client.joinRoom('jam-session-1');

  client.requestBeat({
    genre: 'electronic',
    tempo: 128,
    complexity: 5
  });

  // Share playback position every second
  setInterval(() => {
    client.sharePlaybackPosition('jam-session-1', Math.random() * 60);
  }, 1000);
}, 1000);
```

---

## Hooks Integration Example

### Example 11: Using Hooks for Memory Persistence

```javascript
const { HooksIntegration } = require('./src/fleet/hooks-integration');

async function musicSessionWithHooks() {
  const hooks = new HooksIntegration({
    sessionId: 'composition-session-456',
    enabled: true
  });

  // Initialize session
  await hooks.initializeSession({
    user: 'composer_123',
    project: 'summer-vibes',
    genre: 'electronic'
  });

  // Pre-task hook
  await hooks.preTask('Creating electronic music composition');

  // Create beat
  const beatData = {
    name: 'Summer Beat',
    pattern: [1, 0, 1, 0, 1, 0, 1, 0],
    style: 'electronic',
    complexity: 5
  };

  // Store in memory
  await hooks.storeAgentPattern('beat-coordinator', 'beat', beatData);

  // Notify other agents
  await hooks.notify('Beat created', {
    beatName: beatData.name,
    style: beatData.style
  });

  // Post-task hook
  await hooks.postTask('beat-creation', { success: true });

  // Retrieve stored patterns
  const patterns = await hooks.retrieveAgentPatterns('beat-coordinator', 'beat');
  console.log('Stored patterns:', patterns.data);

  // Finalize session
  await hooks.finalizeSession({
    beatsCreated: 1,
    melodiesCreated: 0,
    duration: 300
  });

  console.log('✅ Session completed with hooks integration');
}

musicSessionWithHooks();
```

---

## Testing Examples

### Example 12: Jest Integration Test

```javascript
const { MusicAPI } = require('../src/api/music-api');

describe('Music Creation Workflow', () => {
  let api;
  let server;

  beforeAll(async () => {
    api = new MusicAPI({ port: 3001 });
    server = await api.start();
  });

  afterAll(async () => {
    await api.stop();
  });

  test('should create complete song', async () => {
    const userId = 'test_user_' + Date.now();

    // Learn user preference
    const learnResponse = await axios.post('http://localhost:3001/patterns/learn', {
      userId,
      creation: {
        genre: 'jazz',
        mood: 'smooth',
        tempo: 110,
        key: 'Bb'
      }
    });

    expect(learnResponse.data.success).toBe(true);

    // Get recommendations
    const recResponse = await axios.get(
      `http://localhost:3001/patterns/recommendations/${userId}`
    );

    expect(recResponse.data.recommendations.length).toBeGreaterThan(0);

    // Create beat
    const beatResponse = await axios.post('http://localhost:3001/beats/suggest', {
      genre: 'jazz',
      tempo: 110
    });

    expect(beatResponse.data.success).toBe(true);
    expect(beatResponse.data.arrangements.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Optimization

### Example 13: Batch Operations

```javascript
async function batchLearnPatterns(patterns) {
  // Learn multiple patterns in parallel
  const promises = patterns.map(pattern =>
    axios.post('http://localhost:3000/patterns/learn', pattern)
  );

  const results = await Promise.all(promises);

  console.log(`✅ Learned ${results.length} patterns`);
  return results;
}

// Usage
const patterns = [
  { userId: 'user_1', creation: { genre: 'rock', mood: 'energetic', tempo: 140 } },
  { userId: 'user_1', creation: { genre: 'jazz', mood: 'smooth', tempo: 95 } },
  { userId: 'user_1', creation: { genre: 'electronic', mood: 'uplifting', tempo: 128 } }
];

batchLearnPatterns(patterns);
```

---

This documentation provides comprehensive examples for integrating and using the Zordic Music Studio AgentDB fleet system.
