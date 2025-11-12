# Phase Space Coordinate System (Level 6)

Advanced mathematical framework for analyzing phase space trajectories based on Riemann zeta function zeros.

## Overview

This implementation provides a complete phase space coordinate system that maps integer values to 2D phase space using the non-trivial zeros of the Riemann zeta function.

### Mathematical Foundation

The coordinate system is defined by:

- **φ(n) = Σᵢ∈Z(n) φⁱ** - φ-coordinate (sum of cosine terms)
- **ψ(n) = Σᵢ∈Z(n) ψⁱ** - ψ-coordinate (sum of sine terms)
- **θ(n) = arctan(ψ(n)/φ(n))** - Phase angle

Where:
- φⁱ = cos(tᵢ·log(n))
- ψⁱ = sin(tᵢ·log(n))
- tᵢ is the imaginary part of the i-th Riemann zeta zero

## Features

### 1. Core Coordinate Calculations

```typescript
import { calculateCoordinates } from './phase-space';

const coords = calculateCoordinates(50, 50);
console.log(coords);
// {
//   n: 50,
//   phi: -2.345,
//   psi: 1.234,
//   theta: 2.678,
//   magnitude: 2.652,
//   isNashPoint: false,
//   timestamp: 1234567890
// }
```

### 2. Trajectory Generation

Generate phase space trajectories over a range of n values:

```typescript
import { generateTrajectory } from './phase-space';

const trajectory = generateTrajectory(1, 200, 0.5, 50);
// Returns array of TrajectoryPoint with coordinates, velocity, acceleration
```

### 3. Nash Point Detection

Find points where S(n) = 0 (equilibrium points):

```typescript
import { findNashPoints } from './phase-space';

const nashPoints = findNashPoints(1, 100, 0.1);
nashPoints.forEach(np => {
  console.log(`Nash point at n=${np.n}, flow: ${np.surroundingFlow}`);
});
```

### 4. Visualization

Generate SVG visualizations and interactive HTML:

```typescript
import {
  generatePhasePlotSVG,
  generatePhasePortraitSVG,
  generateInteractiveHTML
} from './phase-space';

// Phase plot with trajectory and Nash points
const phasePlot = generatePhasePlotSVG(trajectory, nashPoints, {
  colorScheme: 'viridis',
  highlightNashPoints: true,
  resolution: 800
});

// Phase portrait with vector field
const phasePortrait = generatePhasePortraitSVG(trajectory, {
  colorScheme: 'plasma',
  showVectorField: true,
  resolution: 800
});

// Interactive D3.js visualization
const html = generateInteractiveHTML(trajectory, nashPoints);
```

### 5. Pattern Analysis and Storage

Store and analyze phase space patterns using AgentDB:

```typescript
import {
  createPattern,
  analyzePhaseSpace,
  createPhaseSpaceStorage
} from './phase-space';

// Create pattern
const pattern = createPattern(trajectory, nashPoints);
console.log(pattern.characteristics);
// {
//   periodicity: 42,
//   chaosIndicator: 3.456,
//   lyapunovExponent: 0.123,
//   convergenceRate: -0.002
// }

// Analyze phase space
const analysis = analyzePhaseSpace(trajectory);
console.log(`Found ${analysis.attractors.length} attractors`);

// Store in AgentDB
const storage = createPhaseSpaceStorage();
await storage.initialize();
await storage.storePattern(pattern);

// Find similar patterns
const similar = await storage.findSimilarPatterns(pattern, 5);
```

## File Structure

```
src/math-framework/phase-space/
├── index.ts           # Main exports
├── types.ts           # TypeScript type definitions
├── coordinates.ts     # Core coordinate calculations
├── visualization.ts   # D3.js-based visualizations
└── storage.ts         # AgentDB integration

examples/
└── phase-space-demo.ts  # Comprehensive demonstrations

tests/
└── phase-space.test.ts  # Full test suite

docs/
└── phase-space/         # Generated visualizations
    ├── phase-plot.svg
    ├── phase-portrait.svg
    ├── interactive.html
    └── visualization-data.json
```

## API Reference

### Core Functions

#### `calculateCoordinates(n, maxZeros?)`
Calculate complete phase space coordinates for a given n.
- **Parameters:**
  - `n`: number - The input value
  - `maxZeros`: number (optional, default: 50) - Number of Riemann zeros to use
- **Returns:** `PhaseSpaceCoordinates`

#### `generateTrajectory(nMin, nMax, step?, maxZeros?)`
Generate a trajectory through phase space.
- **Parameters:**
  - `nMin`: number - Starting value
  - `nMax`: number - Ending value
  - `step`: number (optional, default: 1) - Step size
  - `maxZeros`: number (optional, default: 50) - Number of zeros
- **Returns:** `TrajectoryPoint[]`

#### `findNashPoints(nMin, nMax, step?, tolerance?)`
Find Nash equilibrium points in a range.
- **Parameters:**
  - `nMin`: number - Starting value
  - `nMax`: number - Ending value
  - `step`: number (optional, default: 0.1) - Step size
  - `tolerance`: number (optional, default: 1e-6) - Detection threshold
- **Returns:** `NashPoint[]`

### Visualization Functions

#### `generatePhasePlotSVG(trajectory, nashPoints, config?)`
Generate SVG visualization of phase space trajectory.
- **Parameters:**
  - `trajectory`: TrajectoryPoint[]
  - `nashPoints`: NashPoint[]
  - `config`: PhasePortraitConfig (optional)
- **Returns:** string (SVG markup)

#### `generatePhasePortraitSVG(trajectory, config?)`
Generate phase portrait with optional vector field.
- **Parameters:**
  - `trajectory`: TrajectoryPoint[]
  - `config`: PhasePortraitConfig (optional)
- **Returns:** string (SVG markup)

#### `generateInteractiveHTML(trajectory, nashPoints, config?)`
Generate interactive D3.js visualization.
- **Parameters:**
  - `trajectory`: TrajectoryPoint[]
  - `nashPoints`: NashPoint[]
  - `config`: PhasePortraitConfig (optional)
- **Returns:** string (HTML document)

### Storage Functions

#### `createPhaseSpaceStorage(config?)`
Create a storage instance for patterns.
- **Parameters:**
  - `config`: AgentDBConfig (optional)
- **Returns:** `PhaseSpaceStorage`

#### Storage Methods

- `initialize()`: Initialize database connection
- `storePattern(pattern)`: Store a phase space pattern
- `getPattern(id)`: Retrieve pattern by ID
- `findSimilarPatterns(pattern, topK)`: Find similar patterns
- `queryByCharacteristics(criteria)`: Query patterns by properties
- `getStatistics()`: Get storage statistics
- `close()`: Close database connection

## Configuration Options

### PhasePortraitConfig

```typescript
{
  nMin: number;           // Minimum n value
  nMax: number;           // Maximum n value
  step: number;           // Step size
  colorScheme: 'viridis' | 'plasma' | 'inferno' | 'magma';
  highlightNashPoints: boolean;
  showVectorField: boolean;
  resolution: number;     // SVG resolution in pixels
}
```

### AgentDBConfig

```typescript
{
  dbPath: string;         // Database file path
  collectionName: string; // Collection name
  embeddingDimension: number;
  distanceMetric: 'cosine' | 'euclidean' | 'manhattan';
}
```

## Running Demonstrations

```bash
# Run all demos
npx ts-node examples/phase-space-demo.ts

# Or run individual demos in code
import {
  demo1_BasicCoordinates,
  demo2_Trajectory,
  demo3_PatternAnalysis,
  demo4_PhaseSpaceAnalysis,
  demo5_ZetaZeros
} from './examples/phase-space-demo';

await demo1_BasicCoordinates();
```

## Running Tests

```bash
npm test tests/phase-space.test.ts
```

## Riemann Zeta Zeros

The implementation includes the first 100 non-trivial zeros of the Riemann zeta function (imaginary parts on the critical line ρ = 1/2 + i·t):

```typescript
import { ZETA_ZEROS } from './phase-space';

console.log(ZETA_ZEROS[0]); // 14.134725 (first zero)
console.log(ZETA_ZEROS.length); // 100
```

## Pattern Characteristics

Patterns are analyzed for:

- **Periodicity**: Detected via autocorrelation (if present)
- **Chaos Indicator**: Entropy-based measure of complexity
- **Lyapunov Exponent**: Rate of trajectory divergence
- **Convergence Rate**: Rate of magnitude change

## Nash Point Classification

Nash points are classified by their surrounding flow:

- **Attractive**: Flow converges toward the point (stable)
- **Repulsive**: Flow diverges from the point (unstable)
- **Saddle**: Mixed stability (attractive in some directions, repulsive in others)
- **Neutral**: Minimal flow change (borderline stability)

## Color Schemes

Available color schemes for visualization:
- **Viridis**: Perceptually uniform, colorblind-friendly
- **Plasma**: High contrast, vibrant
- **Inferno**: Warm colors, good for dark backgrounds
- **Magma**: Similar to inferno with more purple tones

## Performance Considerations

- Using more Riemann zeros (maxZeros) increases accuracy but computation time
- Smaller step sizes in trajectory generation provide smoother paths but more points
- Vector field rendering is computationally intensive for high resolutions
- AgentDB storage enables efficient similarity search on large pattern collections

## Integration with Other Modules

This phase space system can be integrated with:

- **Game Theory Module**: Analyze Nash equilibria in phase space
- **Neural Networks**: Use patterns as training data
- **Optimization Algorithms**: Navigate phase space toward attractors
- **Time Series Analysis**: Study temporal evolution in phase space

## Mathematical Background

The Riemann zeta function ζ(s) has non-trivial zeros on the critical line Re(s) = 1/2. These zeros have deep connections to prime number distribution and are used here to create oscillatory terms that define the phase space coordinates.

The phase space represents a projection of complex dynamics onto a 2D plane where:
- Trajectories show how the system evolves with n
- Nash points indicate equilibrium states
- Vector fields show instantaneous rates of change
- Attractors reveal stable configurations

## License

Part of the Agentic Flow framework. See main repository for license details.

## Support

For questions and issues:
- GitHub: https://github.com/ruvnet/agentic-flow
- Documentation: https://github.com/ruvnet/agentic-flow/tree/main/docs
