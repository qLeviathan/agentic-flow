# ADR 003: React 18 with TypeScript Over Vue 3

## Status
**Accepted** - 2025-11-21

## Context
We need to select a frontend framework for Zordic Music Studio. The application requires:
- Real-time audio visualization (60 FPS)
- Complex state management (multi-track editor, collaboration)
- High-performance rendering (Canvas/WebGL)
- Type safety (reduce bugs in complex audio logic)
- Good developer experience

### Options Considered

#### Option 1: Vue 3 + TypeScript
**Pros**:
- Simpler learning curve
- Better template syntax for designers
- Composition API is elegant
- Good performance

**Cons**:
- Smaller ecosystem than React
- TypeScript support improving but not as mature
- Fewer audio/music libraries
- Less team experience

#### Option 2: React 18 + TypeScript (Selected)
**Pros**:
- **Largest ecosystem**: More audio/music libraries
- **Concurrent features**: Better for real-time updates
- **Strong TypeScript support**: Mature, excellent DX
- **Team expertise**: Faster development
- **React 18 features**:
  - Automatic batching (fewer re-renders)
  - useTransition (smooth UI during heavy operations)
  - useDeferredValue (defer expensive calculations)
  - Concurrent rendering (don't block audio thread)

**Cons**:
- More verbose than Vue
- Steeper learning curve for beginners
- More boilerplate for simple components

#### Option 3: Svelte
**Pros**:
- Minimal bundle size
- Reactive by default
- Simple syntax

**Cons**:
- Smaller ecosystem
- Less enterprise adoption
- Fewer audio libraries
- Limited TypeScript tooling

## Decision
**We will use React 18 with TypeScript** as the frontend framework.

### Rationale

1. **React 18 Concurrent Features**: Perfect for audio apps
   ```typescript
   // Don't block audio thread during UI updates
   import { useTransition } from 'react';

   function BeatMaker() {
     const [isPending, startTransition] = useTransition();

     const addNote = (note) => {
       // Audio playback: high priority (immediate)
       playNote(note);

       // UI update: low priority (can defer)
       startTransition(() => {
         setNotes(notes => [...notes, note]);
       });
     };
   }
   ```

2. **Strong TypeScript Integration**: Catch audio bugs at compile-time
   ```typescript
   interface AudioNode {
     frequency: number;
     velocity: number; // 0-127
     duration: number;
   }

   // Type error if wrong parameter
   const playNote = (node: AudioNode) => { /* ... */ };
   ```

3. **Ecosystem**: Many music/audio libraries already use React
   - react-piano: Piano roll component
   - wavesurfer-react: Waveform visualization
   - react-use-measure: Performance monitoring
   - react-spring: Smooth animations

4. **Performance**: React 18 automatic batching reduces re-renders
   ```typescript
   // React 18: Both updates batched into one render
   const onClick = () => {
     setNotes([...notes, newNote]);
     setPlayheadPosition(newPosition);
     setIsPlaying(true);
     // Only 1 re-render (vs 3 in React 17)
   };
   ```

5. **Team Velocity**: Team has React experience
   - Faster onboarding
   - More productive development
   - Established patterns and conventions

## Implementation Details

### Project Structure
```
src/
├── components/
│   ├── BeatMaker/
│   │   ├── TrackGrid.tsx
│   │   ├── DrumPad.tsx
│   │   └── Mixer.tsx
│   ├── MelodyComposer/
│   │   ├── PianoRoll.tsx
│   │   └── NoteEditor.tsx
│   └── VisualRenderer/
│       └── CanvasRenderer.tsx
├── hooks/
│   ├── useAudioEngine.ts
│   ├── useWebSocket.ts
│   └── useAgentRecommendations.ts
├── stores/
│   ├── projectStore.ts (Zustand)
│   ├── collaborationStore.ts
│   └── audioStore.ts
└── utils/
    ├── audioEngine.ts
    └── midiUtils.ts
```

### State Management: Zustand
```typescript
// Lightweight, TypeScript-friendly
import create from 'zustand';

interface ProjectStore {
  tracks: Track[];
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
}

const useProjectStore = create<ProjectStore>((set) => ({
  tracks: [],
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track]
  })),
  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id)
  })),
  playheadPosition: 0,
  setPlayheadPosition: (pos) => set({ playheadPosition: pos })
}));
```

### Performance Optimization
```typescript
// 1. Memoize expensive calculations
const memoizedWaveform = useMemo(() =>
  generateWaveform(audioBuffer),
  [audioBuffer]
);

// 2. Defer non-urgent updates
const [deferredQuery, setDeferredQuery] = useDeferredValue(searchQuery);

// 3. Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {Row}
</FixedSizeList>

// 4. Lazy load heavy components
const VisualRenderer = lazy(() => import('./VisualRenderer'));
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "types": ["vite/client", "web-audio-api"]
  }
}
```

## Consequences

### Positive
- **Concurrent rendering**: Smooth UI during audio operations
- **Type safety**: Catch audio parameter bugs at compile-time
- **Rich ecosystem**: Leverage existing music libraries
- **Team productivity**: Faster development with familiar tools
- **Performance**: Automatic batching, suspense, lazy loading

### Negative
- **Bundle size**: Larger than Svelte (but acceptable with code splitting)
- **Learning curve**: New team members need React knowledge
- **Boilerplate**: More verbose than Vue for simple components

### Mitigations
- **Bundle size**: Code splitting, lazy loading, tree shaking
- **Learning curve**: Documentation, onboarding guides
- **Boilerplate**: Create reusable component library

## Metrics for Success
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] 60 FPS rendering maintained
- [ ] <500KB initial bundle (gzipped)
- [ ] Zero runtime errors from type issues

## Related Decisions
- ADR 004: Zustand for State Management
- ADR 005: Vite as Build Tool
- ADR 006: Component Library Architecture

---

**Authors**: Frontend Team, Architecture Team
**Reviewers**: UX Team, Backend Team
**Date**: 2025-11-21
