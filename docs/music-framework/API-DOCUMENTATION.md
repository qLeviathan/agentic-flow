# Zordic Music Studio - AgentDB Fleet API Documentation

## Overview

The Zordic Music Studio framework provides an intelligent, multi-agent system for music creation using AgentDB for vector-based pattern learning and agent coordination.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
          REST API│                       │WebSocket
                  │                       │
┌─────────────────▼───────────────────────▼───────────────────┐
│                    Music API Server                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Agent Fleet Coordinator                      │  │
│  └─────┬──────────┬──────────┬──────────┬────────────────┘  │
│        │          │          │          │                    │
│  ┌─────▼────┐┌───▼────┐┌───▼────┐┌────▼─────┐             │
│  │ Pattern  ││  Beat  ││ Melody ││ Teacher  │             │
│  │ Learning ││  Coord ││ Agent  ││  Agent   │             │
│  └─────┬────┘└───┬────┘└───┬────┘└────┬─────┘             │
│        └──────────┴──────────┴──────────┘                   │
│                         │                                    │
│                    ┌────▼─────┐                             │
│                    │ AgentDB  │                             │
│                    │  Vector  │                             │
│                    │ Database │                             │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## Base URL

```
http://localhost:3000
```

## API Endpoints

### Health & Status

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-21T10:30:00.000Z"
}
```

#### GET /fleet/status

Get fleet coordinator status and statistics.

**Response:**
```json
{
  "success": true,
  "fleet": {
    "coordinatorId": "fleet-coordinator",
    "totalAgents": 4,
    "activeRequests": 2,
    "queuedMessages": 0,
    "agents": [
      {
        "agentId": "pattern-learning-agent",
        "status": "idle",
        "capabilities": ["pattern_recommendation", "music_creation"],
        "requestCount": 42,
        "successRate": "98.5%",
        "lastActive": "2025-11-21T10:29:45.000Z"
      }
    ]
  },
  "statistics": {
    "totalRequests": 150,
    "completed": 148,
    "failed": 2,
    "successRate": "98.7%",
    "averageResponseTime": "245ms"
  }
}
```

#### GET /agents/status

Get status of all individual agents.

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "agentId": "pattern-learning-agent",
      "status": "active",
      "statistics": {
        "totalPatterns": 1250,
        "totalPreferences": 3500,
        "minSamplesForRecommendation": 3
      }
    }
  ]
}
```

---

### Pattern Learning Agent

#### GET /patterns/recommendations/:userId

Get personalized pattern recommendations for a user.

**Parameters:**
- `userId` (path) - User identifier
- `limit` (query, optional) - Number of recommendations (default: 5)

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "pattern_123",
      "genre": "electronic",
      "mood": "uplifting",
      "tempo": 128,
      "key": "Am",
      "complexity": 6,
      "relevanceScore": 0.92,
      "reason": "Similar to 3 patterns you enjoyed",
      "confidence": 0.87
    }
  ],
  "userProfile": {
    "favoriteGenres": ["electronic", "house", "techno"],
    "favoriteMoods": ["uplifting", "energetic"],
    "averageComplexity": 5.8,
    "totalCreations": 24
  }
}
```

#### POST /patterns/learn

Learn from a user's music creation.

**Request Body:**
```json
{
  "userId": "user_123",
  "creation": {
    "genre": "electronic",
    "mood": "chill",
    "tempo": 95,
    "key": "Am",
    "timeSignature": "4/4",
    "tracks": [
      { "name": "Bass" },
      { "name": "Synth" }
    ],
    "sessionTime": 300
  }
}
```

**Response:**
```json
{
  "success": true,
  "patternId": "pattern_456",
  "message": "Pattern learned successfully"
}
```

#### POST /patterns/rate

Rate a pattern (explicit feedback).

**Request Body:**
```json
{
  "userId": "user_123",
  "patternId": "pattern_456",
  "rating": 5,
  "feedback": {
    "comment": "Great pattern!",
    "tags": ["fun", "easy"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating recorded successfully"
}
```

#### POST /patterns/similar

Find similar musical styles.

**Request Body:**
```json
{
  "query": {
    "genre": "rock",
    "mood": "upbeat",
    "tempo": 120
  },
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "patterns": [
    {
      "id": "pattern_789",
      "genre": "rock",
      "mood": "energetic",
      "similarity": 0.89
    }
  ]
}
```

---

### Beat Coordinator Agent

#### POST /beats/suggest

Get beat arrangement suggestions.

**Request Body:**
```json
{
  "genre": "rock",
  "mood": "energetic",
  "tempo": 120,
  "complexity": 5,
  "existingTracks": [
    { "name": "Bass", "pattern": [...] }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "arrangements": [
    {
      "id": "standard_basic",
      "name": "Basic Rock Beat",
      "pattern": [1, 0, 1, 0, 1, 0, 1, 0],
      "style": "rock",
      "complexity": 1,
      "variations": {
        "fills": [1, 1, 1, 1, 1, 1, 1, 1],
        "breakdown": [1, 0, 0, 0, 1, 0, 0, 0],
        "buildup": [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
      }
    }
  ],
  "context": {
    "genre": "rock",
    "tempo": 120,
    "complexity": 5
  }
}
```

#### POST /beats/learn

Learn a beat combination.

**Request Body:**
```json
{
  "beatData": {
    "name": "Custom Rock Beat",
    "pattern": [1, 0, 1, 0, 1, 0, 1, 0],
    "style": "rock",
    "complexity": 4,
    "tempo": 120,
    "timeSignature": "4/4"
  },
  "performance": {
    "rating": 0.8,
    "userRating": 4,
    "completionRate": 1.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "beatId": "beat_xyz",
  "message": "Beat combination learned successfully"
}
```

#### GET /beats/templates/:style

Get beat templates for a specific style.

**Parameters:**
- `style` (path) - Beat style (e.g., "rock", "jazz", "hip-hop")
- `limit` (query, optional) - Number of templates (default: 10)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "beat_123",
      "name": "Classic Rock",
      "pattern": [1, 0, 1, 0, 1, 0, 1, 0],
      "style": "rock",
      "complexity": 3,
      "successRate": 0.92
    }
  ],
  "count": 5
}
```

#### PUT /beats/:beatId/performance

Update beat performance metrics.

**Request Body:**
```json
{
  "performance": {
    "rating": 0.9
  }
}
```

**Response:**
```json
{
  "success": true,
  "beatId": "beat_xyz",
  "newSuccessRate": 0.85
}
```

---

### Melody Agent

#### POST /melody/generate

Generate complementary melody.

**Request Body:**
```json
{
  "existingTrack": {
    "notes": [
      { "note": "C", "midiNote": 60, "duration": 1.0 },
      { "note": "E", "midiNote": 64, "duration": 1.0 }
    ]
  },
  "options": {
    "key": "C",
    "scale": "major",
    "length": 16,
    "complexity": 5,
    "harmonic_role": "harmony"
  }
}
```

**Response:**
```json
{
  "success": true,
  "melody": [
    {
      "note": "E",
      "midiNote": 64,
      "duration": 1.0,
      "velocity": 80
    }
  ],
  "metadata": {
    "key": "C",
    "scale": "major",
    "scaleNotes": [
      { "note": "C", "midiNote": 60, "interval": 0 }
    ],
    "harmonic_role": "harmony",
    "complexity": 6
  }
}
```

#### POST /melody/chord-progression

Suggest chord progression.

**Request Body:**
```json
{
  "genre": "pop",
  "mood": "uplifting",
  "key": "C",
  "length": 4
}
```

**Response:**
```json
{
  "success": true,
  "progression": {
    "name": "I-V-vi-IV",
    "chords": [
      { "root": "C", "quality": "maj", "name": "Cmaj" },
      { "root": "G", "quality": "maj", "name": "Gmaj" },
      { "root": "A", "quality": "min", "name": "Amin" },
      { "root": "F", "quality": "maj", "name": "Fmaj" }
    ],
    "key": "C",
    "mood": "uplifting"
  }
}
```

#### POST /melody/learn

Learn a melody pattern.

**Request Body:**
```json
{
  "melodyData": {
    "notes": [
      { "note": "C", "midiNote": 60, "duration": 1.0 }
    ],
    "scale": "major",
    "key": "C",
    "progression": [1, 4, 5, 1],
    "harmonicFunction": "melody"
  },
  "performance": {
    "rating": 0.9
  }
}
```

**Response:**
```json
{
  "success": true,
  "melodyId": "melody_abc"
}
```

---

### Teacher Agent

#### POST /student/assess

Assess student performance on a task.

**Request Body:**
```json
{
  "userId": "student_123",
  "taskData": {
    "skill": "rhythm_basic",
    "taskId": "lesson_quarter_notes",
    "score": 0.85,
    "timeSpent": 240,
    "mistakes": [
      { "type": "timing", "severity": "minor" }
    ],
    "completion": 1.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "assessment": {
    "skill": "rhythm_basic",
    "previousLevel": 30.5,
    "newLevel": 35.2,
    "accuracy": 85.0,
    "improvement": 4.7,
    "feedback": [
      "Excellent accuracy! You have a strong grasp of this concept.",
      "Good pace! You are working efficiently.",
      "Current skill level: Beginner (35.2/100)"
    ],
    "nextSteps": [
      {
        "type": "continue_skill",
        "skill": "rhythm_basic",
        "lesson": "half_notes",
        "reason": "Continue mastering current skill"
      }
    ]
  }
}
```

#### GET /student/:userId/report

Get comprehensive student progress report.

**Response:**
```json
{
  "success": true,
  "report": {
    "userId": "student_123",
    "overallLevel": "42.5",
    "skillLevel": "Intermediate",
    "overallAccuracy": "83.2",
    "totalLessonsCompleted": 15,
    "skills": [
      {
        "skill": "rhythm_basic",
        "level": "45.0",
        "accuracy": "85.0",
        "lessonsCompleted": 8
      }
    ],
    "topStrengths": ["high_accuracy", "fast_learner", "efficient"],
    "areasForImprovement": ["rhythm_issues"],
    "learningStyle": "thorough_learner",
    "recommendedPath": [
      {
        "currentSkill": "rhythm_basic",
        "nextStep": {
          "type": "continue_skill",
          "skill": "rhythm_basic",
          "lesson": "whole_notes"
        }
      }
    ]
  }
}
```

#### GET /student/:userId/next-steps

Get next learning steps for a student.

**Parameters:**
- `userId` (path) - Student identifier
- `skill` (query) - Current skill
- `level` (query) - Current level

**Response:**
```json
{
  "success": true,
  "nextSteps": [
    {
      "type": "continue_skill",
      "skill": "rhythm_basic",
      "lesson": "half_notes",
      "reason": "Continue mastering current skill"
    },
    {
      "type": "peer_learning",
      "peers": ["student_456", "student_789"],
      "reason": "Connect with students at similar level"
    }
  ]
}
```

---

### Multi-Agent Coordination

#### POST /create/music

Create music using multiple coordinated agents.

**Request Body:**
```json
{
  "userId": "user_123",
  "context": {
    "genre": "electronic",
    "mood": "uplifting",
    "tempo": 128,
    "key": "Am"
  }
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_12345",
  "result": {
    "primary": {
      "patterns": [...],
      "beats": [...],
      "melodies": [...]
    },
    "allResults": [
      { "agentId": "pattern-learning-agent", "data": {...} },
      { "agentId": "beat-coordinator-agent", "data": {...} },
      { "agentId": "melody-agent", "data": {...} }
    ],
    "failedAgents": []
  }
}
```

#### POST /resolve/conflict

Resolve conflicting suggestions from multiple agents.

**Request Body:**
```json
{
  "suggestions": [
    { "id": 1, "value": "suggestion_1", "confidence": 0.6 },
    { "id": 2, "value": "suggestion_2", "confidence": 0.9 }
  ],
  "context": {
    "strategy": "confidence",
    "userPreference": "user_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "resolution": {
    "winner": {
      "id": 2,
      "value": "suggestion_2",
      "confidence": 0.9
    },
    "method": "confidence",
    "confidenceScore": 0.9
  }
}
```

---

## WebSocket API

### Connection

Connect to WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Message Types

#### Client -> Server

**Authenticate:**
```json
{
  "type": "authenticate",
  "userId": "user_123",
  "token": "auth_token"
}
```

**Join Room:**
```json
{
  "type": "join_room",
  "roomId": "room_abc"
}
```

**Agent Request:**
```json
{
  "type": "agent_request",
  "requestType": "pattern_recommendation",
  "requestData": {
    "method": "getRecommendations",
    "params": ["user_123", { "limit": 5 }]
  },
  "options": {
    "priority": "high"
  }
}
```

**Collaboration Event:**
```json
{
  "type": "collaboration_event",
  "roomId": "room_abc",
  "event": "playback_position",
  "data": {
    "position": 4.5,
    "timestamp": 1637512345000
  }
}
```

#### Server -> Client

**Connected:**
```json
{
  "type": "connected",
  "clientId": "client_xyz",
  "timestamp": 1637512345000
}
```

**Agent Response:**
```json
{
  "type": "agent_response",
  "requestType": "pattern_recommendation",
  "result": {
    "success": true,
    "recommendations": [...]
  },
  "timestamp": 1637512345000
}
```

**Room Activity:**
```json
{
  "type": "room_agent_activity",
  "userId": "user_456",
  "requestType": "beat_suggestion",
  "result": {...},
  "timestamp": 1637512345000
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- Default: 100 requests per minute per IP
- WebSocket: 50 messages per minute per connection

---

## Authentication

Currently using simple userId-based authentication. In production, implement:
- JWT tokens
- OAuth2
- API keys for programmatic access

---

## AgentDB Integration

All agents use AgentDB for:
- **Vector Embeddings**: Semantic similarity search
- **Learning Patterns**: User preference tracking
- **Performance Metrics**: Success rate optimization
- **Memory Persistence**: Cross-session learning

Vector dimensions: 384 (configurable)
Quantization: Binary (32x memory reduction)
Index: HNSW (150x faster similarity search)
