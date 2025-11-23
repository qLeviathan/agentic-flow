# Zordic Music Studio - C4 Architecture Diagrams

## C4 Model Overview

The C4 model provides a hierarchical view of software architecture through four levels:
1. **Context**: System in environment
2. **Container**: High-level technology choices
3. **Component**: Internal structure
4. **Code**: Implementation details (optional)

---

## Level 1: System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐                                        ┌──────────────┐
│   Student    │                                        │   Music      │
│   User       │──────────┐                    ┌───────│   Educator   │
│              │          │                    │       │              │
│ Creates      │          │                    │       │ Manages      │
│ music        │          │                    │       │ curriculum   │
└──────────────┘          │                    │       └──────────────┘
                          │                    │
                          ▼                    ▼
                 ┌────────────────────────────────────┐
                 │                                    │
                 │    ZORDIC MUSIC STUDIO             │
                 │                                    │
                 │  AI-Powered Music Creation         │
                 │  Platform for High School          │
                 │  Artists                           │
                 │                                    │
                 └────────────────────────────────────┘
                          │                    │
                          │                    │
                          ▼                    ▼
┌──────────────┐   ┌──────────┐        ┌─────────────┐   ┌──────────────┐
│   YouTube    │   │ SoundCloud│        │   Spotify   │   │   Google     │
│              │◄──│           │◄───────│             │   │   Drive      │
│ Shares music │   │Distributes│        │  Playlists  │   │              │
│              │   │           │        │             │   │  Stores      │
└──────────────┘   └──────────┘        └─────────────┘   │  backups     │
                                                          └──────────────┘

External Dependencies:
- OAuth Provider (Google/GitHub for authentication)
- CDN (Cloudflare for asset delivery)
- Email Service (SendGrid for notifications)
- Analytics (Mixpanel/Amplitude for user tracking)
```

### Context Relationships

| Actor/System | Relationship | Description |
|--------------|--------------|-------------|
| Student User | Uses | Creates beats, melodies, and projects with AI assistance |
| Music Educator | Manages | Creates curriculum, monitors progress, provides feedback |
| YouTube | Integration | Direct export and upload of finished projects |
| SoundCloud | Integration | Music distribution and community sharing |
| Spotify | Integration | Playlist creation and music discovery |
| Google Drive | Integration | Cloud backup and project storage |

---

## Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZORDIC MUSIC STUDIO                             │
└─────────────────────────────────────────────────────────────────────────┘

                            [Student/Educator]
                                    │
                                    │ HTTPS
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      WEB APPLICATION                                   │
│  React 18 + TypeScript, Web Audio API, Socket.io Client              │
│  - Beat Maker UI          - Melody Composer                           │
│  - Visual Renderer        - Education Dashboard                       │
│  - Collaboration Workspace - Project Manager                          │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│   API GATEWAY        │  │  WEBSOCKET       │  │   CDN               │
│   Express + Node.js  │  │  SERVER          │  │   Cloudflare        │
│                      │  │  Socket.io       │  │                     │
│ - Authentication     │  │                  │  │ - Static Assets     │
│ - Rate Limiting      │  │ - Real-time Sync │  │ - Sample Library    │
│ - Request Routing    │  │ - Collaboration  │  │ - Audio Presets     │
└──────────────────────┘  └──────────────────┘  └─────────────────────┘
            │                      │
            ▼                      ▼
┌────────────────────────────────────────────────────────────┐
│                  AGENT ORCHESTRATION ENGINE                │
│           AgentDB + Claude Flow (Node.js)                  │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Pattern  │ │   Beat   │ │  Melody  │ │ Harmony  │    │
│  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Visual   │ │ Teacher  │ │  Collab  │                 │
│  │  Agent   │ │  Agent   │ │  Agent   │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
└────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   AGENTDB        │ │   PostgreSQL    │ │   Redis Cache    │
│   Vector DB      │ │   Database      │ │                  │
│                  │ │                 │ │ - Session Store  │
│ - Patterns       │ │ - User Data     │ │ - Collab State   │
│ - Preferences    │ │ - Projects      │ │ - Rate Limits    │
│ - Embeddings     │ │ - Curriculum    │ │ - Queue Jobs     │
└──────────────────┘ └─────────────────┘ └──────────────────┘

┌───────────────────────────────────────────────────────────┐
│              BACKGROUND SERVICES                          │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Audio       │  │  Export      │  │  Analytics   │   │
│  │  Processing  │  │  Service     │  │  Service     │   │
│  │  Queue       │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Container Descriptions

| Container | Technology | Purpose |
|-----------|-----------|---------|
| Web Application | React 18, TypeScript, Tone.js | Single-page application for music creation |
| API Gateway | Express, Node.js | REST API, authentication, request routing |
| WebSocket Server | Socket.io | Real-time collaboration and live updates |
| Agent Orchestration | AgentDB, Claude Flow | AI agent coordination and pattern learning |
| AgentDB Vector DB | AgentDB | Musical pattern storage and similarity search |
| PostgreSQL | PostgreSQL 15 | Relational data, user accounts, projects |
| Redis Cache | Redis 7 | Session management, real-time state |
| Audio Processing | Bull Queue, FFmpeg | Background audio rendering and conversion |
| Export Service | Node.js Workers | MP3/WAV/MIDI export processing |
| CDN | Cloudflare | Static asset delivery, sample library |

---

## Level 3: Component Diagram - Agent Orchestration Engine

```
┌─────────────────────────────────────────────────────────────────────┐
│              AGENT ORCHESTRATION ENGINE (Node.js)                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AGENT FLEET                                  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Pattern Agent    │  │  Beat Agent      │  │ Melody Agent    │  │
│  │                  │  │                  │  │                 │  │
│  │ - Learn styles   │  │ - Generate       │  │ - Compose       │  │
│  │ - Recommend      │  │   rhythms        │  │   melodies      │  │
│  │ - Adapt to user  │  │ - Quantize       │  │ - Harmonize     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │                     │            │
│  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴────────┐  │
│  │ Harmony Agent    │  │ Visual Agent     │  │ Teacher Agent   │  │
│  │                  │  │                  │  │                 │  │
│  │ - Chord prog.    │  │ - Sync visuals   │  │ - Guide users   │  │
│  │ - Voice leading  │  │ - Generate       │  │ - Curriculum    │  │
│  │ - Tension/resolve│  │   effects        │  │ - Feedback      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │                     │            │
│  ┌────────┴──────────────────────┴─────────────────────┴────────┐  │
│  │              Collaboration Agent                             │  │
│  │                                                              │  │
│  │  - Multi-user sync     - Conflict resolution                │  │
│  │  - Role assignment     - Session management                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    COORDINATION LAYER                               │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Fleet Manager   │  │ Memory Manager  │  │ Task Queue      │    │
│  │                 │  │                 │  │                 │    │
│  │ - Agent spawn   │  │ - Shared memory │  │ - Task routing  │    │
│  │ - Health checks │  │ - Context sync  │  │ - Priorities    │    │
│  │ - Load balance  │  │ - Persistence   │  │ - Scheduling    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Event Bus       │  │ Neural Engine   │  │ Pattern Library │    │
│  │                 │  │                 │  │                 │    │
│  │ - Pub/Sub       │  │ - Train models  │  │ - Vector search │    │
│  │ - Message queue │  │ - Predictions   │  │ - Embeddings    │    │
│  │ - Routing       │  │ - Learning loop │  │ - Similarity    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                      DATA ACCESS LAYER                              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ AgentDB Client  │  │ PostgreSQL      │  │ Redis Client    │    │
│  │                 │  │ Client          │  │                 │    │
│  │ - Vector ops    │  │ - CRUD ops      │  │ - Cache ops     │    │
│  │ - Similarity    │  │ - Transactions  │  │ - Pub/Sub       │    │
│  │ - Training      │  │ - Queries       │  │ - Sessions      │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Level 3: Component Diagram - Web Application

```
┌─────────────────────────────────────────────────────────────────────┐
│                 WEB APPLICATION (React 18)                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Beat Maker   │  │ Melody       │  │ Visual       │             │
│  │ UI           │  │ Composer     │  │ Renderer     │             │
│  │              │  │              │  │              │             │
│  │ - Track grid │  │ - Piano roll │  │ - Canvas     │             │
│  │ - Controls   │  │ - Note edit  │  │ - WebGL      │             │
│  │ - Mixer      │  │ - MIDI tools │  │ - Effects    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Education    │  │ Collaboration│  │ Project      │             │
│  │ Dashboard    │  │ Workspace    │  │ Manager      │             │
│  │              │  │              │  │              │             │
│  │ - Lessons    │  │ - Live users │  │ - File tree  │             │
│  │ - Progress   │  │ - Chat       │  │ - Versions   │             │
│  │ - Tutorials  │  │ - Cursors    │  │ - Export     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                       APPLICATION LAYER                             │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Audio Engine    │  │ State Manager   │  │ WebSocket       │    │
│  │ (Tone.js)       │  │ (Zustand)       │  │ Client          │    │
│  │                 │  │                 │  │                 │    │
│  │ - Synthesizers  │  │ - Global state  │  │ - Real-time     │    │
│  │ - Effects chain │  │ - Undo/redo     │  │ - Reconnect     │    │
│  │ - Audio routing │  │ - Persistence   │  │ - Events        │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Pattern Manager │  │ API Client      │  │ File Manager    │    │
│  │                 │  │ (Axios)         │  │                 │    │
│  │ - Templates     │  │                 │  │ - Upload        │    │
│  │ - User library  │  │ - REST calls    │  │ - Download      │    │
│  │ - Favorites     │  │ - Auth tokens   │  │ - Storage       │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                           │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Router          │  │ Auth Provider   │  │ Analytics       │    │
│  │ (React Router)  │  │ (OAuth)         │  │ (Mixpanel)      │    │
│  │                 │  │                 │  │                 │    │
│  │ - Navigation    │  │ - JWT tokens    │  │ - Events        │    │
│  │ - Guards        │  │ - Refresh       │  │ - Funnels       │    │
│  │ - Lazy loading  │  │ - Permissions   │  │ - Metrics       │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION DEPLOYMENT                         │
└─────────────────────────────────────────────────────────────────────┘

                           [Internet Users]
                                  │
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN (Edge Network)                    │
│  - DDoS Protection      - WAF Rules        - Edge Caching           │
│  - SSL/TLS              - Rate Limiting    - Static Assets          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│      VERCEL EDGE             │  │    AWS REGION (us-east-1)  │
│  (Frontend Deployment)       │  │                            │
│                              │  │                            │
│  - React App (SSG)           │  │  ┌──────────────────────┐  │
│  - Edge Functions            │  │  │  Application Load    │  │
│  - Auto-scaling              │  │  │  Balancer            │  │
│  - Global CDN                │  │  └──────────┬───────────┘  │
└──────────────────────────────┘  │             │              │
                                  │  ┌──────────▼───────────┐  │
                                  │  │   ECS Fargate        │  │
                                  │  │   (API + Agents)     │  │
                                  │  │                      │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ API Container  │  │  │
                                  │  │  │ (2-10 tasks)   │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ Agent Engine   │  │  │
                                  │  │  │ (2-10 tasks)   │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ WebSocket      │  │  │
                                  │  │  │ (2-10 tasks)   │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  └──────────────────────┘  │
                                  │             │              │
                                  │  ┌──────────▼───────────┐  │
                                  │  │   DATA TIER          │  │
                                  │  │                      │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ RDS PostgreSQL │  │  │
                                  │  │  │ (Multi-AZ)     │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ ElastiCache    │  │  │
                                  │  │  │ Redis Cluster  │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ AgentDB        │  │  │
                                  │  │  │ (Self-hosted)  │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  │  ┌────────────────┐  │  │
                                  │  │  │ S3 Storage     │  │  │
                                  │  │  │ (Projects)     │  │  │
                                  │  │  └────────────────┘  │  │
                                  │  └──────────────────────┘  │
                                  └────────────────────────────┘
```

### Deployment Specifications

| Component | Platform | Scaling Strategy | Cost Estimate |
|-----------|----------|------------------|---------------|
| Frontend | Vercel | Auto (Edge) | $20/month |
| API Gateway | AWS Fargate | 2-10 tasks | $100-500/month |
| Agent Engine | AWS Fargate | 2-10 tasks | $100-500/month |
| WebSocket | AWS Fargate | 2-10 tasks | $100-500/month |
| PostgreSQL | RDS | Multi-AZ | $200/month |
| Redis | ElastiCache | 2 nodes | $100/month |
| AgentDB | EC2 | Single instance | $50/month |
| S3 Storage | AWS S3 | Pay-as-you-go | $20-100/month |
| CDN | Cloudflare | Unlimited | $20/month |
| **Total** | | | **$710-1,990/month** |

---

## Architecture Patterns

### 1. Event-Driven Architecture
- Agents communicate via event bus
- Decoupled components
- Async processing
- Scalable coordination

### 2. Microservices Pattern
- Independent deployment
- Technology flexibility
- Fault isolation
- Team autonomy

### 3. CQRS (Command Query Responsibility Segregation)
- Separate read/write models
- Optimized queries
- Event sourcing ready
- Better scalability

### 4. Repository Pattern
- Data access abstraction
- Testability
- Database independence
- Consistent interface

### 5. Circuit Breaker
- Fault tolerance
- Graceful degradation
- Auto-recovery
- Error isolation

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-21
**Architecture Team**
