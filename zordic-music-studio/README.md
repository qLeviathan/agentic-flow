# Zordic Music Studio 🎵🤖

**An Agentic Music-Making Framework for High School Artists**

Zordic Music Studio is a comprehensive, AI-powered music education platform that combines cutting-edge technology with educational best practices to teach high school students music production, composition, and creative expression.

## 🌟 Features

### 🎹 Complete Music Production Suite
- **Beat Maker**: 16-step sequencer with 4+ drum tracks
- **Melody Composer**: Piano roll interface with scale helpers
- **Harmony Generator**: AI-assisted chord progressions
- **Visual Dynamics**: Real-time audio-reactive visualizations
- **Multi-track Mixing**: Professional mixing tools

### 🤖 AI-Powered Learning with AgentDB Fleet
- **Pattern Learning Agent**: Learns your style and provides personalized recommendations
- **Beat Coordinator Agent**: Suggests rhythm patterns and variations
- **Melody Agent**: Creates complementary melodies and harmonizations
- **Harmony Agent**: Generates chord progressions in any key
- **Visual Agent**: Syncs stunning visuals with your music
- **Teacher Agent**: Adaptive educational guidance and feedback
- **Collaboration Agent**: Real-time multi-user coordination

### 📚 10-Week Curriculum
- **20 Interactive Lessons**: Progressive learning from fundamentals to advanced techniques
- **6 Project-Based Modules**: Learn by creating real music
- **Comprehensive Rubrics**: Clear assessment and grading criteria
- **Differentiated Instruction**: Support for all skill levels

### 🎨 Visual Dynamics
- **Spectrum Analyzer**: Frequency bars with 4 layouts
- **Waveform Display**: Oscilloscope and phase visualization
- **Particle Systems**: 1000+ audio-reactive particles
- **3D Visualizations**: Three.js-powered 3D effects
- **Export to Video**: MP4, WebM, and GIF support

### 🎓 Free Tools Integration
Built on industry-standard free software:
- Tone.js (Web Audio framework)
- p5.js (Creative coding)
- Tonal.js (Music theory)
- NexusUI (Interactive controls)
- Three.js (3D visualizations)
- Wavesurfer.js (Waveform display)

## 🚀 Quick Start

### For Students

1. **Access the Platform**
   ```bash
   # Clone the repository
   git clone https://github.com/qLeviathan/agentic-flow.git
   cd agentic-flow/zordic-music-studio

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```

2. **Create Your First Beat**
   - Open http://localhost:3000
   - Click "New Project"
   - Select "Beat Maker" template
   - Follow the interactive tutorial

3. **Explore Lessons**
   - Navigate to "Curriculum" tab
   - Start with Lesson 1: "Understanding Sound"
   - Complete interactive exercises
   - Create your first composition

### For Teachers

1. **Review Curriculum**
   ```bash
   # View curriculum overview
   cat curriculum/README.md

   # Browse lesson plans
   open curriculum/lesson-plans.md

   # Check assessment rubrics
   open curriculum/assessment-rubrics.md
   ```

2. **Set Up Class**
   - Create teacher account
   - Add students to your class
   - Assign lessons and projects
   - Monitor progress via dashboard

3. **Customize Content**
   - Adjust difficulty levels
   - Create custom assignments
   - Add your own examples
   - Configure agent behavior

### For Developers

1. **Install AgentDB**
   ```bash
   # Install AgentDB globally
   npm install -g agentdb

   # Initialize music database
   cd src/agentdb
   node music-db.js
   ```

2. **Start Backend Server**
   ```bash
   # Install backend dependencies
   cd src
   npm install

   # Start API server
   node index.js
   ```

3. **Start Frontend**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Start React dev server
   npm start
   ```

## 📂 Project Structure

```
zordic-music-studio/
├── src/                          # Source code
│   ├── agents/                   # AI agents (Pattern, Beat, Melody, Teacher)
│   ├── agentdb/                  # Vector database for music patterns
│   ├── api/                      # REST API and WebSocket server
│   ├── fleet/                    # Multi-agent coordination
│   ├── music-framework/          # Core music engine
│   │   ├── audio/                # Tone.js integration
│   │   └── visuals/              # Visualization engine
│   ├── config/                   # Configuration files
│   └── index.js                  # Main entry point
│
├── tests/                        # Test suites
│   ├── integration/              # Integration tests
│   └── unit/                     # Unit tests
│
├── docs/                         # Comprehensive documentation
│   ├── architecture/             # System architecture
│   ├── music-framework/          # Framework documentation
│   └── research/                 # Research on music tools
│
├── curriculum/                   # Educational curriculum
│   ├── music-production-curriculum.json
│   ├── lesson-plans.md
│   └── assessment-rubrics.md
│
├── config/                       # Configuration
│   ├── agentdb/                  # AgentDB settings
│   └── music-framework/          # Visual presets
│
├── examples/                     # Code examples
│   └── music-framework/          # Usage examples
│
├── public/                       # Static assets
├── scripts/                      # Utility scripts
└── assets/                       # Media assets
```

## 🎓 Curriculum Overview

### Unit 1: Fundamentals (Weeks 1-2)
- Understanding sound waves and frequency
- Introduction to rhythm and beats
- Basic music theory (notes, scales)
- Tones and timbre

### Unit 2: Beat Making (Weeks 3-4)
- Drum patterns and percussion
- Layering sounds
- Creating grooves
- Using samplers

### Unit 3: Melody Creation (Weeks 5-6)
- Scale selection and key
- Melodic composition
- Lead and bass lines
- Synthesizer basics

### Unit 4: Harmony & Arrangement (Weeks 7-8)
- Chord progressions
- Song structure
- Multi-track arrangement
- Mixing basics

### Unit 5: Advanced Techniques (Weeks 9-10)
- Effects and processing
- Automation and dynamics
- Genre-specific production
- Collaboration and remixing

## 🤖 AI Agent System

### How Agents Work

Zordic Music Studio uses 7 specialized AI agents coordinated through AgentDB:

1. **Pattern Learning Agent**
   - Learns your musical preferences
   - Recommends similar styles and patterns
   - Adapts to your creative growth

2. **Beat Coordinator Agent**
   - Suggests drum patterns
   - Creates variations (fills, breakdowns)
   - Analyzes rhythm complexity

3. **Melody Agent**
   - Generates complementary melodies
   - Harmonizes with existing tracks
   - Suggests chord progressions

4. **Harmony Agent**
   - Creates chord progressions
   - Voice leading optimization
   - Key and scale suggestions

5. **Visual Agent**
   - Syncs visuals with audio
   - Applies audio-reactive effects
   - Generates music videos

6. **Teacher Agent**
   - Tracks student progress
   - Adapts difficulty levels
   - Provides personalized feedback

7. **Collaboration Agent**
   - Coordinates multi-user sessions
   - Manages real-time synchronization
   - Handles conflict resolution

### AgentDB Fleet Architecture

- **Vector Database**: 384-dimensional musical concept embeddings
- **HNSW Indexing**: 150x faster similarity search
- **Binary Quantization**: 32x memory reduction
- **5 Collections**: patterns, preferences, beats, melodies, progress

## 🎨 Visual Dynamics System

### Visualization Types

1. **Spectrum Analyzer**
   - Vertical/horizontal/circular/mirrored layouts
   - Peak detection and hold
   - Gradient effects

2. **Waveform Display**
   - Real-time oscilloscope
   - Lissajous phase scope
   - Scrolling waveform

3. **Particle Systems**
   - 1000+ audio-reactive particles
   - Beat-triggered effects
   - Physics simulation

4. **3D Visualizations** (coming soon)
   - Three.js integration
   - Shader-based effects
   - VR support

### Export Capabilities

- **MP4**: H.264 codec, 1080p/4K
- **WebM**: VP9 codec, web-optimized
- **GIF**: Social media formats
- **Presets**: Instagram, TikTok, YouTube

## 📖 Documentation

### Architecture Documentation
- [System Overview](docs/architecture/system-overview.md)
- [C4 Architecture Diagrams](docs/architecture/c4-diagrams.md)
- [AgentDB Schema](docs/architecture/agentdb-schema.md)
- [Data Flow](docs/architecture/data-flow.md)
- [Implementation Phases](docs/architecture/implementation-phases.md)

### Framework Documentation
- [API Documentation](docs/music-framework/API-DOCUMENTATION.md)
- [Usage Examples](docs/music-framework/USAGE-EXAMPLES.md)
- [Visual System Specs](docs/music-framework/visual-dynamics-specifications.md)
- [Performance Optimization](docs/music-framework/performance-optimization.md)

### Research
- [Music Tools Catalog](docs/research/music-education-tools-catalog.json)
- [Tools Summary](docs/research/music-education-tools-summary.md)

## 🛠️ Technology Stack

### Frontend
- React 18 (concurrent rendering)
- TypeScript (type safety)
- Tone.js (Web Audio API)
- Zustand (state management)
- Socket.io (real-time)

### Backend
- Node.js + Express
- AgentDB (vector database)
- PostgreSQL (relational data)
- Redis (caching)
- Socket.io (WebSocket server)

### Infrastructure
- Vercel (frontend hosting)
- AWS ECS Fargate (API servers)
- AWS RDS (PostgreSQL)
- AWS ElastiCache (Redis)
- EC2 (AgentDB)
- S3 (storage)

## 🎯 Performance Targets

- Audio latency: <20ms
- Pattern search: <50ms (p95)
- Visual rendering: 60 FPS
- API response: <200ms (p95)
- Collaboration sync: <50ms
- First page load: <3s

## 🧪 Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

## 📝 API Reference

### REST Endpoints

**Pattern Learning**
- `GET /patterns/recommendations/:userId` - Get personalized recommendations
- `POST /patterns/learn` - Learn from user interaction

**Beat Coordination**
- `POST /beats/suggest` - Get beat pattern suggestions
- `POST /beats/variation` - Generate beat variations

**Melody Generation**
- `POST /melody/generate` - Generate complementary melodies
- `POST /melody/harmonize` - Harmonize with existing melody

**Student Assessment**
- `POST /student/assess` - Assess student performance
- `GET /student/progress/:userId` - Get student progress

**Collaboration**
- `POST /collaborate/create` - Create collaboration session
- `POST /collaborate/join/:sessionId` - Join session

See [API Documentation](docs/music-framework/API-DOCUMENTATION.md) for complete reference.

## 🤝 Contributing

We welcome contributions from educators, developers, and music enthusiasts!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Open Source Projects
- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- [p5.js](https://p5js.org/) - Creative coding platform
- [Tonal.js](https://tonaljs.github.io/tonal/) - Music theory library
- [Three.js](https://threejs.org/) - 3D visualization
- [AgentDB](https://github.com/ruvnet/agentdb) - Vector database

### Educational Resources
- [EarSketch](https://gtcmt.gatech.edu/earsketch) - Music education inspiration
- [Chrome Music Lab](https://musiclab.chromeexperiments.com/) - Interactive tools

### Research
- Music cognition research
- Web Audio API standards
- Educational technology best practices

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/qLeviathan/agentic-flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/qLeviathan/agentic-flow/discussions)
- **Email**: support@zordic-music.studio (coming soon)
- **Documentation**: [Full Docs](docs/)

## 🗺️ Roadmap

### Phase 1: MVP (Weeks 1-4) ✅
- ✅ Core beat maker
- ✅ Basic agents
- ✅ User accounts
- ✅ Project saving

### Phase 2: Full Composition (Weeks 5-8)
- 🔄 Piano roll
- 🔄 Chord generator
- 🔄 Multi-agent coordination
- 🔄 Advanced mixing

### Phase 3: Education & Visuals (Weeks 9-12)
- 🔄 20 interactive lessons
- 🔄 Teacher dashboard
- 🔄 Visual effects
- 🔄 Video export

### Phase 4: Collaboration (Weeks 13-16)
- ⏳ Real-time 4-user sessions
- ⏳ Project sharing
- ⏳ Export system
- ⏳ Mobile responsive

### Phase 5: Scale (Weeks 17-22)
- ⏳ Performance optimization
- ⏳ Advanced production tools
- ⏳ Mobile apps
- ⏳ Cloud deployment

### Phase 6: AI Enhancements (Ongoing)
- ⏳ Advanced AI composition
- ⏳ Voice-to-music
- ⏳ Style transfer
- ⏳ Collaborative AI jamming

## 🎉 Get Started Today!

Ready to create amazing music? Follow the [Quick Start](#-quick-start) guide and start your musical journey with Zordic Music Studio!

**Remember**: Music is for everyone. Our mission is to democratize music education and empower the next generation of artists. 🎵✨
