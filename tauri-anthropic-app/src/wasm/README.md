# WASM TypeScript Bindings

TypeScript bindings for high-performance WASM modules in the Tauri Anthropic app.

## Files

- **`index.ts`** - Main API exports and functions
- **`types.ts`** - TypeScript type definitions
- **`example.ts`** - Usage examples and patterns

## Quick Start

```typescript
import { fibonacci, zeckendorf, initReasoningBank } from './wasm';

// Math operations
const f100 = await fibonacci(100);
console.log('F(100) =', f100);

// Zeckendorf decomposition
const z = await zeckendorf(100);
console.log('100 =', z.string_repr); // "3 + 8 + 89"

// Initialize ReasoningBank
await initReasoningBank('my-db');
```

## Available Modules

### Math Framework
High-performance mathematical computations:
- Fibonacci/Lucas sequences
- Zeckendorf decomposition
- BK divergence
- Phase space trajectories

### ReasoningBank
Pattern storage and retrieval:
- Store reasoning patterns
- Search by category
- Find similar patterns
- Semantic similarity

### AgentBooster
Code transformation:
- Apply code edits
- Syntax validation
- Confidence scoring
- Multiple merge strategies

## Documentation

- [Quick Reference](../../docs/WASM_QUICK_REFERENCE.md) - Cheat sheet
- [Full Integration Guide](../../docs/WASM_INTEGRATION.md) - Complete documentation
- [Summary](../../docs/WASM_INTEGRATION_SUMMARY.md) - Overview

## Examples

See `example.ts` for complete usage examples:

```typescript
import examples from './example';

await examples.fibonacciExample();
await examples.reasoningBankExample();
await examples.completeWorkflowExample();
```

## Type Safety

All functions are fully typed:

```typescript
import type {
  ZeckendorfResult,
  EditResultJson,
  PatternInput,
  TrajectoryResult,
} from './types';
```

## Performance

WASM modules provide significant speedups:

| Operation | JavaScript | WASM | Speedup |
|-----------|-----------|------|---------|
| Fibonacci | 45ms | 2ms | 22.5x |
| Zeckendorf | 120ms | 8ms | 15x |
| BK Divergence | 890ms | 35ms | 25.4x |

## Import Options

### Default Import
```typescript
import wasm from './wasm';

const f = await wasm.fibonacci(100);
```

### Named Imports
```typescript
import { fibonacci, zeckendorf, initReasoningBank } from './wasm';

const f = await fibonacci(100);
```

### Type Imports
```typescript
import type { ZeckendorfResult } from './wasm/types';
```

## Error Handling

```typescript
import { safeWasmInvoke, WasmError } from './wasm';

try {
  const result = await safeWasmInvoke(
    'fibonacci',
    () => fibonacci(100)
  );
} catch (error) {
  if (error instanceof WasmError) {
    console.error(`${error.operation} failed`);
  }
}
```

## Development

### Build
Ensure WASM modules are built:
```bash
cargo build --release -p math-framework-wasm
cargo build --release -p reasoningbank-wasm
cargo build --release -p agent-booster-wasm
```

### Test
Run examples to verify integration:
```bash
npm run dev
# Then in browser console:
import examples from './wasm/example';
await examples.completeWorkflowExample();
```

## License

MIT - See project LICENSE file
