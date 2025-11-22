# Zordic Music Studio - Quick Start Guide

Get up and running with Zordic Music Studio in 5 minutes!

## 🚀 Installation

### Prerequisites

- Node.js 16+ and npm 8+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

### Step 1: Clone Repository

```bash
git clone https://github.com/qLeviathan/agentic-flow.git
cd agentic-flow/zordic-music-studio
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install AgentDB globally
npm install -g agentdb
```

### Step 3: Initialize AgentDB

```bash
# Initialize music pattern database
npm run agentdb:init

# Optional: Seed with sample data
npm run agentdb:seed
```

### Step 4: Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

**Server will be available at:**
- REST API: http://localhost:3000
- WebSocket: ws://localhost:3000

## 🎓 For Students

### Your First Beat (5 minutes)

1. **Access the Platform**
   - Open http://localhost:3000 in your browser
   - Click "Get Started" or "New Project"

2. **Create a Beat**
   ```javascript
   // The beat maker will guide you through:
   - Selecting a tempo (try 120 BPM)
   - Choosing drum sounds (kick, snare, hi-hat, clap)
   - Creating a 16-step pattern
   - Adding variations
   ```

3. **Get AI Assistance**
   - Click "Ask AI" for beat suggestions
   - Try "Suggest a variation" for fills
   - Use "Complexity Analysis" to see your rhythm level

4. **Save and Export**
   - Click "Save Project"
   - Export to WAV, MP3, or MIDI
   - Share with friends or teacher

### Your First Melody (10 minutes)

1. **Open Piano Roll**
   - Click "Add Track" → "Melody Track"
   - Select a scale (try C Major)

2. **Compose**
   - Click on the grid to add notes
   - The AI will suggest complementary notes
   - Try different instruments (synth, piano, bass)

3. **Add Harmony**
   - Click "Ask AI" → "Suggest Chords"
   - The Harmony Agent will create a progression
   - Adjust to match your melody

4. **Add Visuals**
   - Switch to "Visual" tab
   - Choose a preset (try "Spectrum Bars")
   - See your music come to life!
   - Export as MP4 for social media

### Follow the Curriculum

```bash
# View all lessons
open curriculum/lesson-plans.md

# Start with Lesson 1
Navigate to "Curriculum" → "Lesson 1: Understanding Sound"
```

**Recommended Learning Path:**
- Week 1-2: Fundamentals
- Week 3-4: Beat Making
- Week 5-6: Melody Creation
- Week 7-8: Harmony & Arrangement
- Week 9-10: Advanced Techniques

## 👨‍🏫 For Teachers

### Set Up Your Class (10 minutes)

1. **Create Teacher Account**
   ```bash
   # Access admin panel
   http://localhost:3000/admin

   # Create account with teacher role
   Email: teacher@school.edu
   Role: Teacher
   ```

2. **Add Students**
   - Import class roster (CSV)
   - Send invitation links
   - Students create accounts

3. **Configure Curriculum**
   ```bash
   # Review curriculum
   cat curriculum/README.md

   # Customize lessons (optional)
   edit curriculum/lesson-plans.md
   ```

4. **Monitor Progress**
   - Dashboard shows student activity
   - View completion rates
   - Track skill development
   - Review student projects

### Assign First Lesson

1. Navigate to "Teacher Dashboard"
2. Click "Assign Lesson"
3. Select "Lesson 1: Understanding Sound"
4. Choose students or entire class
5. Set due date
6. Click "Assign"

### Grade Student Work

```bash
# Review rubrics
open curriculum/assessment-rubrics.md

# Grade using platform
Dashboard → Student Projects → Select Project → Grade
```

**Grading Tips:**
- Use provided rubrics for consistency
- Focus on effort and creativity
- Provide constructive feedback
- Use AI-generated insights

## 💻 For Developers

### Project Structure

```
zordic-music-studio/
├── src/
│   ├── agents/          # AI agents
│   ├── agentdb/         # Vector database
│   ├── api/             # REST API
│   ├── fleet/           # Agent coordination
│   └── music-framework/ # Audio/visual engines
├── tests/               # Test suites
├── docs/                # Documentation
└── curriculum/          # Educational content
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# With coverage report
npm run test:coverage
```

### API Development

```bash
# Start API server
npm run dev

# Test endpoints
curl http://localhost:3000/patterns/recommendations/user_123
curl -X POST http://localhost:3000/beats/suggest \
  -H "Content-Type: application/json" \
  -d '{"genre": "rock", "tempo": 120, "complexity": 5}'
```

See [API Documentation](docs/music-framework/API-DOCUMENTATION.md) for complete reference.

### Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Frontend available at http://localhost:3001
```

### Database Management

```bash
# Access AgentDB CLI
agentdb-cli

# View collections
> db.listCollections()

# Query patterns
> db.collection('beat_patterns').find({tempo: 120})

# Vector search
> db.collection('beat_patterns').search(query_vector, k=10)
```

## 🎨 Customization

### Change Visual Presets

```bash
# Edit visual presets
edit config/music-framework/visual-presets.json

# Add new preset
{
  "name": "My Custom Preset",
  "visualizer": "spectrum",
  "config": {
    "barCount": 64,
    "layout": "circular",
    "gradient": true
  }
}
```

### Modify Agent Behavior

```bash
# Edit agent configuration
edit src/config/agents.config.js

# Adjust recommendation threshold
patternAgent.recommendationThreshold = 0.75

# Change learning rate
teacherAgent.learningRate = 0.8
```

### Add Custom Lessons

```bash
# Create new lesson
edit curriculum/music-production-curriculum.json

# Add to lesson array
{
  "id": "lesson_21",
  "title": "Advanced Synthesis",
  "unit": 6,
  "week": 11,
  "duration": 90,
  "objectives": [...],
  "content": {...}
}
```

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check Node version
node --version  # Should be 16+

# Check port availability
lsof -i :3000  # Kill process if needed

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### AgentDB Connection Issues

```bash
# Restart AgentDB service
agentdb restart

# Re-initialize database
npm run agentdb:init

# Check logs
tail -f logs/agentdb.log
```

### Audio Not Working

1. **Check browser compatibility**
   - Chrome 90+, Firefox 88+, Safari 14+
   - WebRTC and Web Audio API required

2. **Check permissions**
   - Microphone access (for recording)
   - Autoplay policy (user interaction required)

3. **Check audio context**
   ```javascript
   // Resume audio context if suspended
   if (audioContext.state === 'suspended') {
     await audioContext.resume();
   }
   ```

### Visual Rendering Issues

```bash
# Check WebGL support
chrome://gpu  # Should show WebGL enabled

# Reduce particle count for performance
config.particleCount = 500  # Default is 1000

# Disable advanced effects
config.enableBloom = false
config.enableGlow = false
```

## 📚 Next Steps

### Students
1. Complete Lesson 1
2. Create your first beat
3. Explore AI recommendations
4. Share with classmates

### Teachers
1. Review full curriculum
2. Assign Lesson 1 to class
3. Explore teacher dashboard
4. Customize lessons as needed

### Developers
1. Read [Architecture Docs](docs/architecture/system-overview.md)
2. Review [API Reference](docs/music-framework/API-DOCUMENTATION.md)
3. Explore [Code Examples](examples/music-framework/)
4. Contribute to GitHub

## 🆘 Getting Help

- **Documentation**: [Full docs](docs/)
- **Examples**: [Code examples](examples/music-framework/)
- **Issues**: [GitHub Issues](https://github.com/qLeviathan/agentic-flow/issues)
- **Community**: [Discussions](https://github.com/qLeviathan/agentic-flow/discussions)

## 🎉 You're Ready!

You've completed the quick start guide. Now go create amazing music! 🎵✨

**Pro Tips:**
- Start simple, then add complexity
- Experiment with different genres
- Use AI suggestions as inspiration, not rules
- Collaborate with others
- Have fun and be creative!

Remember: There are no wrong notes in music, only opportunities for creativity. 🎹
