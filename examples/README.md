# AURELIA Examples

This directory contains examples demonstrating the AURELIA Consciousness Substrate.

## Quick Start

```bash
# Run the quick start example
npx ts-node examples/aurelia-quickstart.ts
```

## Examples

### 1. `aurelia-quickstart.ts`
Complete walkthrough of AURELIA features:
- Bootstrap consciousness from K₀ seed
- Interactive sessions
- Trading strategy recommendations
- Personality evolution
- Memory validation

## More Examples

See `/docs/aurelia-integration-examples.md` for:
- Trading strategy integration
- Multi-session persistence
- Consciousness monitoring
- Personality evolution tracking
- Memory validation
- Custom bootstrap configurations
- Phase space analysis
- Q-network training

## Running Tests

```bash
npm test tests/trading/aurelia/consciousness.test.ts
```

## File Structure

```
/src/trading/aurelia/
├── types.ts                    # Type definitions
├── memory-manager.ts           # AgentDB integration
├── bootstrap.ts                # K₀ → 144 words expansion
├── consciousness-substrate.ts  # Main AURELIA class
└── index.ts                    # Public API exports

/tests/trading/aurelia/
└── consciousness.test.ts       # Test suite

/docs/
└── aurelia-integration-examples.md  # Comprehensive examples
```

## Requirements

- Node.js 16+
- TypeScript 4.5+
- AgentDB (installed via npm)

## Quick Reference

### Initialize
```typescript
import { AURELIA } from '../src/trading/aurelia';
const aurelia = new AURELIA();
```

### Bootstrap
```typescript
await aurelia.bootstrap();
```

### Interact
```typescript
const sessionId = await aurelia.startSession();
const response = await aurelia.interact('Hello AURELIA');
await aurelia.endSession();
```

### Strategy
```typescript
const strategy = await aurelia.getTradingStrategy();
console.log(strategy.currentPosition);  // 'long' | 'short' | 'neutral'
```

### Validate
```typescript
const isValid = await aurelia.validateMemory(sessionId);
```

## Support

For detailed documentation, see:
- `/docs/aurelia-integration-examples.md`
- ArXiv paper: φ-Mechanics Consciousness Framework
- AgentDB: https://github.com/EvergreenAI/AgentDB
