# Zordic Music Studio - Code Examples

This directory contains comprehensive code examples demonstrating how to use the Zordic Music Studio framework.

## 📚 Examples Overview

### 01. Simple Beat Creation
**File**: `01-simple-beat.js`

Learn the basics of creating beats:
- Initialize the music API client
- Create a 4/4 drum pattern
- Get AI-powered beat suggestions
- Generate variations and fills
- Analyze rhythm complexity
- Export to audio file

**Perfect for**: Beginners, Lesson 3-4 (Beat Making unit)

**Run it**:
```bash
node examples/01-simple-beat.js
```

---

### 02. Melody Composition
**File**: `02-melody-composition.js`

Master melody creation with AI assistance:
- Generate melodies with the Melody Agent
- Work with scales and keys
- Create harmonies
- Generate chord progressions
- Analyze melodic structure
- Combine melody with rhythm section

**Perfect for**: Intermediate students, Lesson 5-6 (Melody Creation unit)

**Run it**:
```bash
node examples/02-melody-composition.js
```

---

### 03. Visual Music Video
**File**: `03-visual-music-video.js`

Create stunning audio-reactive visuals:
- Set up the visualization engine
- Use spectrum analyzer and particle systems
- Sync visuals with audio in real-time
- Export to MP4 video
- Optimize for social media platforms

**Perfect for**: Advanced students, Visual dynamics module

**Run it** (requires browser):
```bash
# Serve the example
npx http-server examples -p 8080

# Open in browser
open http://localhost:8080/03-visual-music-video.html
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd /home/user/agentic-flow/zordic-music-studio
npm install

# Start the API server
npm run dev
```

### Running Examples

```bash
# Basic examples (command line)
node examples/01-simple-beat.js
node examples/02-melody-composition.js

# Visual examples (browser)
npx http-server examples -p 8080
# Then open http://localhost:8080 in your browser
```

## 📖 Learning Path

**Week 1-2: Fundamentals**
- Read the curriculum introduction
- Understand sound waves and rhythm basics
- No code examples yet - focus on theory

**Week 3-4: Beat Making**
→ Start with `01-simple-beat.js`
- Create your first beat
- Experiment with different patterns
- Try AI suggestions

**Week 5-6: Melody Creation**
→ Move to `02-melody-composition.js`
- Compose melodies
- Learn about scales and keys
- Add harmonies

**Week 7-8: Full Composition**
→ Combine examples 1 and 2
- Create complete songs
- Add chord progressions
- Structure your composition

**Week 9-10: Visual Dynamics**
→ Explore `03-visual-music-video.js`
- Add visuals to your music
- Create music videos
- Export for social media

## 🎓 Educational Use

### For Students

1. **Read Before Running**: Each example has extensive comments explaining what's happening
2. **Experiment**: Change parameters and see what happens
3. **Combine**: Use multiple examples together to create full projects
4. **Ask AI**: Use the built-in AI agents for help and suggestions

### For Teachers

1. **Live Coding**: Use these examples for in-class demonstrations
2. **Assignments**: Assign examples as homework with modifications
3. **Assessment**: Students can submit their modified versions
4. **Differentiation**: Examples range from basic to advanced

## 🛠️ API Client Setup

All examples use the `ZordicMusicClient` class:

```javascript
import { ZordicMusicClient } from '../src/api/client.js';

const client = new ZordicMusicClient({
  apiUrl: 'http://localhost:3000',
  userId: 'your_user_id',
  apiKey: 'optional_api_key'  // For production
});

// Now use client for all API calls
const project = await client.createProject({ name: 'My Song' });
const beat = await client.beats.suggest({ genre: 'rock' });
```

## 🎵 Common Patterns

### Creating a Beat

```javascript
// 1. Create project
const project = await client.createProject({
  name: 'My Beat',
  type: 'beat',
  tempo: 120
});

// 2. Get AI suggestion
const suggestion = await client.beats.suggest({
  genre: 'hip-hop',
  tempo: 120,
  complexity: 5
});

// 3. Save pattern
const pattern = await client.beats.save({
  projectId: project.id,
  pattern: suggestion.pattern
});

// 4. Export
const audio = await client.export({
  projectId: project.id,
  format: 'wav'
});
```

### Generating a Melody

```javascript
// 1. Generate melody
const melody = await client.melody.generate({
  key: 'C',
  scale: 'major',
  length: 16,
  style: 'uplifting'
});

// 2. Harmonize
const harmony = await client.melody.harmonize({
  melody: melody.notes,
  key: 'C',
  harmonizationType: 'thirds'
});

// 3. Add chords
const chords = await client.harmony.suggest({
  key: 'C',
  style: 'pop',
  length: 8
});
```

### Creating Visuals

```javascript
// 1. Initialize engine
const engine = new VisualizationEngine({
  container: document.getElementById('viz'),
  width: 1920,
  height: 1080
});
await engine.initialize();

// 2. Connect audio
const audio = document.getElementById('audio');
await engine.connectAudioSource(audio);

// 3. Set visualizer
const spectrum = new SpectrumAnalyzerVisualizer({
  barCount: 64,
  layout: 'circular'
});
engine.setVisualizer(spectrum);

// 4. Start
engine.start();
audio.play();
```

## 🐛 Troubleshooting

**API Connection Error**
```bash
Error: Cannot connect to http://localhost:3000

Solution:
1. Make sure the server is running: npm run dev
2. Check the port is 3000: echo $PORT
3. Verify API URL in example code
```

**Audio Not Playing**
```javascript
// Browser may block autoplay
// Add user interaction first:
button.addEventListener('click', async () => {
  await audioContext.resume();
  audio.play();
});
```

**Export Fails**
```bash
Error: Export timeout

Solution:
1. Check disk space
2. Reduce export duration
3. Lower quality settings
4. Check logs: tail -f logs/export.log
```

## 📚 Additional Resources

- **Full API Documentation**: `docs/music-framework/API-DOCUMENTATION.md`
- **Architecture Overview**: `docs/architecture/system-overview.md`
- **Curriculum**: `curriculum/lesson-plans.md`
- **Visual System Specs**: `docs/music-framework/visual-dynamics-specifications.md`

## 🤝 Contributing Examples

Have a great example to share? We'd love to include it!

1. Create a new file: `examples/04-your-example.js`
2. Add extensive comments explaining the code
3. Include a "Perfect for" section
4. Add to this README
5. Submit a pull request

**Example Template**:
```javascript
/**
 * Example X: Your Example Title
 *
 * This example demonstrates how to:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

import { ZordicMusicClient } from '../src/api/client.js';

async function yourExample() {
  console.log('🎵 Example X: Your Example Title\n');

  // Your code here with lots of comments
}

yourExample().catch(console.error);
```

## 💡 Tips for Learning

1. **Start Simple**: Begin with example 01, then progress
2. **Read Comments**: Every line has explanatory comments
3. **Experiment**: Change one thing at a time and observe results
4. **Combine**: Mix and match code from different examples
5. **Use AI Help**: The AI agents are there to guide you
6. **Share**: Show your creations to classmates and teachers

## 🎉 Happy Coding!

Remember: The best way to learn is by doing. Don't be afraid to experiment, make mistakes, and try new things. Music is creative expression, and there are no wrong answers!

🎵 Create. Learn. Share. Repeat. ✨
