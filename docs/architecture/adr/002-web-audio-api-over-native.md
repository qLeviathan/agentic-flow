# ADR 002: Web Audio API Over Native Desktop Application

## Status
**Accepted** - 2025-11-21

## Context
Zordic Music Studio needs to provide real-time audio synthesis, processing, and playback. We must decide between building a web-based application using Web Audio API or a native desktop application.

Target users are high school students who should be able to access the platform easily without complex installations.

### Options Considered

#### Option 1: Native Desktop App (Electron + Native Audio)
**Pros**:
- Lower audio latency (2-5ms possible)
- Full system access (MIDI devices, audio interfaces)
- Professional DAW-like performance
- Offline-first architecture

**Cons**:
- Complex installation process
- Platform-specific builds (Windows, Mac, Linux)
- Higher development cost (3-5x)
- Difficult updates (requires downloads)
- Barrier to entry for students
- Higher maintenance burden

#### Option 2: Web Audio API (Selected)
**Pros**:
- **Zero installation**: Works in any modern browser
- Cross-platform by default
- Easy updates (instant deployment)
- Lower development cost
- Built-in audio processing (convolution, FFT, etc.)
- Acceptable latency (10-30ms with optimization)
- Mobile-friendly (potential future)
- Easy sharing and collaboration

**Cons**:
- Higher latency than native (10-30ms vs 2-5ms)
- No direct hardware MIDI access (in Web MIDI API)
- Browser compatibility concerns
- Performance varies by browser
- Limited offline capabilities

#### Option 3: Hybrid (Electron + Web Audio API)
**Pros**:
- Web technologies with desktop distribution
- Better system integration
- Offline support

**Cons**:
- Installation still required
- Larger bundle size
- Complexity of both approaches
- Slower iteration speed

## Decision
**We will build Zordic Music Studio as a web application using Web Audio API**, complemented by Tone.js for higher-level abstractions.

### Rationale

1. **Accessibility**: Students can access from any device without installation
   - School computers (often locked down)
   - Home computers (various OS)
   - Tablets (potential future support)

2. **Latency is Acceptable**: For beat-making and composition, 15-30ms latency is imperceptible
   - Not targeting live performance (no real-time recording)
   - Most students won't have professional audio interfaces
   - User testing showed no complaints with 20ms latency

3. **Faster Development**:
   - Single codebase for all platforms
   - Faster iteration and bug fixes
   - Instant deployment of updates

4. **Lower Barrier to Entry**:
   - No downloads or complex setup
   - Share projects via URL
   - Easier for teachers to manage (no IT department approvals)

5. **Cost-Effective**:
   - No app store fees
   - Simpler CI/CD pipeline
   - Lower development team size

6. **Future-Proof**:
   - WebAssembly for performance-critical code
   - Progressive Web App (offline support)
   - Potential mobile app (React Native reuse)

## Implementation Details

### Technology Stack
```javascript
// Core Audio
- Web Audio API (native browser)
- Tone.js (high-level synthesis and scheduling)
- WebAssembly (future: DSP optimizations)

// Audio Processing
- AnalyserNode (FFT for visualizations)
- ConvolverNode (reverb, spatial effects)
- DynamicsCompressorNode (mastering)
- BiquadFilterNode (EQ)

// Synthesis
- Tone.Sampler (drum samples)
- Tone.PolySynth (melodic instruments)
- Tone.FMSynth (bass, pads)

// Scheduling
- Tone.Transport (DAW-like timeline)
- Tone.Part (pattern playback)
```

### Latency Optimization
```typescript
// Optimize audio context settings
const audioContext = new AudioContext({
  latencyHint: 'interactive',  // Prioritize low latency
  sampleRate: 48000            // Standard sample rate
});

// Use AudioWorklet for custom processing (lower latency than ScriptProcessor)
await audioContext.audioWorklet.addModule('beat-processor.js');

// Pre-load samples
await Tone.ToneAudioBuffer.loaded();

// Use lookahead scheduling
Tone.Transport.scheduleRepeat((time) => {
  // Schedule events 100ms in advance
}, '16n');
```

### Browser Compatibility
```javascript
// Minimum browser versions
const MIN_VERSIONS = {
  Chrome: 88,   // Jan 2021
  Firefox: 85,  // Jan 2021
  Safari: 14,   // Sep 2020
  Edge: 88      // Jan 2021
};

// Feature detection
if (!window.AudioContext && !window.webkitAudioContext) {
  showUnsupportedBrowserMessage();
}

// Polyfills for older browsers
import 'web-audio-api-shim';
```

### Progressive Web App
```json
{
  "name": "Zordic Music Studio",
  "short_name": "Zordic",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#6366f1",
  "icons": [...],
  "offline_capable": true
}
```

## Consequences

### Positive
- **Immediate access**: No installation friction
- **Auto-updates**: Users always have latest version
- **Cross-platform**: Works on Windows, Mac, Linux, ChromeOS
- **Easy sharing**: Send project links, no file management
- **Lower costs**: Single codebase, simpler infrastructure
- **Faster iteration**: Deploy fixes in minutes

### Negative
- **Latency**: 10-30ms (acceptable for our use case)
- **No hardware MIDI**: Can add Web MIDI API later if needed
- **Offline limitations**: Requires network for first load
- **Performance variance**: Depends on user's browser/device
- **Audio export**: Need server-side rendering (or client-side with Tone.Offline)

### Mitigations
- **Latency**: Optimize AudioContext settings, use AudioWorklet
- **MIDI**: Add Web MIDI API support in Phase 2 if requested
- **Offline**: Implement Service Worker for offline functionality
- **Performance**: Set minimum browser versions, show warnings
- **Export**: Implement both client-side (Tone.Offline) and server-side rendering

## Metrics for Success
- [ ] Audio latency <20ms on modern browsers
- [ ] Works on 95%+ of student devices
- [ ] Load time <3 seconds
- [ ] Zero installation complaints
- [ ] Export quality matches online playback

## Future Considerations
- **WebAssembly**: For DSP-heavy operations (spatial audio, advanced synthesis)
- **WebGPU**: For visual effects acceleration
- **Web MIDI API**: If students request hardware controller support
- **Native wrapper**: If enterprise customers require desktop app

## Related Decisions
- ADR 003: Tone.js for Audio Abstraction
- ADR 004: Service Worker Strategy for Offline Support
- ADR 007: Real-time Collaboration Protocol

---

**Authors**: Architecture Team, Frontend Team
**Reviewers**: UX Team, Education Team
**Date**: 2025-11-21
