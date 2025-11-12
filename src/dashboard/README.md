# Mathematical Framework Dashboard

An interactive web dashboard for visualizing mathematical sequences, game theory, and neural network convergence.

## Features

### 1. Sequence Plots (F, L)
- **Fibonacci Sequence**: F(n) = F(n-1) + F(n-2)
- **Lucas Sequence**: L(n) = L(n-1) + L(n-2)
- Logarithmic scale visualization
- Real-time updates

### 2. Phase Space Trajectory
- **φ(n)** vs **ψ(n)** visualization
- Color-coded trajectory progression
- Interactive point exploration
- Smooth animations

### 3. Divergence Plot with Nash Points
- **S(n)** = |F(n)/F(n-1) - φ| metric
- Nash equilibrium points highlighted
- Click to explore equilibrium details
- Threshold line visualization

### 4. Game Theory Tensor
- Payoff matrix visualization
- Nash equilibria marked with stars
- Color-coded payoff values
- Interactive cell tooltips

### 5. Neural Network Convergence
- Architecture visualization
- Training loss over epochs
- Animated convergence
- Layer-by-layer display

### 6. Dependency Graph Explorer
- Interactive force-directed graph
- Node type color coding
- Formula display
- Drag-and-drop rearrangement

## Tech Stack

- **React 18** with TypeScript
- **D3.js v7** for advanced visualizations
- **Tailwind CSS** for styling
- **Vite** for fast development
- **WASM-ready** architecture (calculations.ts can be ported)

## Installation

```bash
cd src/dashboard
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:3000

## Build

```bash
npm run build
```

Output in `dist/` directory.

## Usage

### Controls

1. **Iterations Slider (n)**: Adjust computation depth (5-100)
2. **Max Iterations**: Set upper bound for auto-update
3. **Epsilon (ε)**: Adjust Nash equilibrium threshold
4. **Auto Update**: Animate through values automatically
5. **Reset**: Return to initial state

### Interactivity

- **Sequence Plot**: Hover to see values
- **Phase Space**: Click points to see coordinates
- **Divergence Plot**: Click Nash points for details
- **Game Tensor**: Hover cells for strategy info
- **Neural Network**: Watch convergence animation
- **Dependency Graph**: Drag nodes, click to explore

### Export

- **Export JSON**: Full dataset with metadata
- **Export CSV**: Tabular data for analysis

## Mathematical Framework

### Sequences
```
F(n) = F(n-1) + F(n-2), F(0)=0, F(1)=1
L(n) = L(n-1) + L(n-2), L(0)=2, L(1)=1
```

### Transforms
```
φ(n) = φⁿ/√5, where φ = (1+√5)/2
ψ(n) = ψⁿ/√5, where ψ = (1-√5)/2
```

### Divergence Metric
```
S(n) = |F(n)/F(n-1) - φ|
```

### Nash Equilibrium Condition
```
S(n) < ε ∧ L(n)/F(n) → √5
```

## Performance

- **Real-time computation**: Up to n=100 without lag
- **WASM-ready**: Calculations module can be compiled to WebAssembly
- **Optimized rendering**: D3.js transitions for smooth animations
- **Responsive design**: Works on desktop and tablet

## File Structure

```
src/dashboard/
├── components/          # React visualization components
│   ├── SequencePlot.tsx
│   ├── PhaseSpace.tsx
│   ├── DivergencePlot.tsx
│   ├── GameTensor.tsx
│   ├── NeuralNetwork.tsx
│   └── DependencyGraph.tsx
├── hooks/              # Custom React hooks
│   └── useRealtimeComputation.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Calculation utilities
│   └── calculations.ts
├── App.tsx             # Main application
├── index.tsx           # Entry point
├── index.css           # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript config
```

## Customization

### Adding New Visualizations

1. Create component in `components/`
2. Import in `App.tsx`
3. Add to computation pipeline in `utils/calculations.ts`
4. Update types in `types/index.ts`

### Theme Customization

Edit Tailwind colors in `vite.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

### WASM Integration

To compile calculations to WebAssembly:

1. Port `utils/calculations.ts` to Rust/C++
2. Compile with wasm-pack or Emscripten
3. Import WASM module in `useRealtimeComputation.ts`
4. Update computation calls

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Credits

Built with React, TypeScript, D3.js, and Tailwind CSS.
