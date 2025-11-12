# WASM Quick Reference

Quick reference for using WASM modules in the Tauri Anthropic app.

## Import

```typescript
import {
  // Math Framework
  fibonacci,
  lucas,
  zeckendorf,
  bkDivergence,
  phaseSpaceTrajectory,

  // ReasoningBank
  initReasoningBank,
  storePattern,
  getPattern,
  searchPatterns,
  findSimilarPatterns,

  // AgentBooster
  applyEdit,

  // Utils
  clearCaches,
  formatLargeNumber,
} from './wasm';

import type {
  ZeckendorfResult,
  TrajectoryResult,
  EditResultJson,
  PatternInput,
} from './wasm/types';
```

## Math Framework

### Fibonacci
```typescript
// Returns string for large numbers
const f100 = await fibonacci(100);
// "354224848179261915075"

const formatted = formatLargeNumber(f100);
// "354,224,848,179,261,915,075"
```

### Lucas
```typescript
const l10 = await lucas(10);
// "123"
```

### Zeckendorf
```typescript
const z = await zeckendorf(100);
// Returns: {
//   number: "100",
//   indices: "[4,6,11]",
//   fibonacci_numbers: "[3,8,89]",
//   is_valid: true,
//   string_repr: "3 + 8 + 89"
// }

// Parse JSON fields
const indices = JSON.parse(z.indices);
// [4, 6, 11]
```

### BK Divergence
```typescript
const s = await bkDivergence(50);
// 425
```

### Phase Space
```typescript
const traj = await phaseSpaceTrajectory(1, 100);
// Returns: {
//   start: 1,
//   end: 100,
//   length: 100,
//   path_length: 156.42
// }
```

### Batch Operations
```typescript
// Compute multiple in parallel
const results = await Promise.all([
  fibonacci(10),
  fibonacci(20),
  fibonacci(30)
]);
```

## ReasoningBank

### Initialize
```typescript
// Initialize with default DB name
await initReasoningBank();

// Or with custom name
await initReasoningBank('my-custom-db');
```

### Store Pattern
```typescript
import { createPattern } from './wasm/types';

const pattern = createPattern(
  'Implement user authentication',
  'security',
  'Use JWT tokens with refresh mechanism',
  0.95,  // success_score (0.0 - 1.0)
  120    // duration_seconds (optional)
);

const patternId = await storePattern(pattern);
// "550e8400-e29b-41d4-a716-446655440000"
```

### Get Pattern
```typescript
const pattern = await getPattern(patternId);
// Returns: {
//   id: "...",
//   task_description: "...",
//   task_category: "...",
//   strategy: "...",
//   success_score: 0.95,
//   duration_seconds: 120,
//   created_at: "..."
// }
```

### Search Patterns
```typescript
const patterns = await searchPatterns('security', 10);
// Returns array of up to 10 patterns in 'security' category
```

### Find Similar
```typescript
const similar = await findSimilarPatterns(
  'Add user login functionality',
  'security',
  5  // top 5 results
);

// Returns array of:
// [{
//   pattern: { ... },
//   similarity_score: 0.92
// }, ...]
```

## AgentBooster

### Apply Edit
```typescript
const result = await applyEdit(
  originalCode,
  editedCode,
  'javascript'  // or 'typescript', 'python', 'rust', etc.
);

// Returns: {
//   merged_code: "...",
//   confidence: 0.95,
//   strategy: "exact_replace",
//   chunks_found: 1,
//   best_similarity: 0.98,
//   syntax_valid: true,
//   processing_time_ms: 12
// }
```

### Check Confidence
```typescript
import { hasHighConfidence } from './wasm/types';

if (hasHighConfidence(result, 0.7)) {
  // Safe to use
  console.log(result.merged_code);
} else {
  // Low confidence, needs review
  console.warn('Edit requires manual review');
}
```

### Supported Languages
```typescript
import { SupportedLanguages, isLanguageSupported } from './wasm';

console.log(SupportedLanguages);
// ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp']

if (isLanguageSupported('python')) {
  await applyEdit(code, edit, 'python');
}
```

## Error Handling

### Try-Catch
```typescript
try {
  const result = await fibonacci(100);
  console.log(result);
} catch (error) {
  console.error('WASM error:', error);
}
```

### Safe Invoke
```typescript
import { safeWasmInvoke, WasmError } from './wasm';

try {
  const result = await safeWasmInvoke(
    'fibonacci',
    () => fibonacci(100)
  );
} catch (error) {
  if (error instanceof WasmError) {
    console.error(`${error.operation} failed: ${error.message}`);
  }
}
```

## Performance

### Cache Management
```typescript
// Clear caches when memory is low
await clearCaches();

// Or on application idle
window.addEventListener('idle', async () => {
  await clearCaches();
});
```

### Monitoring
```typescript
const start = performance.now();
const result = await fibonacci(1000);
const duration = performance.now() - start;
console.log(`Computed in ${duration.toFixed(2)}ms`);
```

### Batch Processing
```typescript
// Instead of:
for (const n of [10, 20, 30]) {
  await fibonacci(n);  // Sequential - slow
}

// Do this:
const results = await Promise.all(
  [10, 20, 30].map(n => fibonacci(n))  // Parallel - fast
);
```

## Common Patterns

### Compute and Store
```typescript
// Compute with Math Framework
const f100 = await fibonacci(100);
const z100 = await zeckendorf(100);

// Store results in ReasoningBank
const pattern = createPattern(
  `Computed F(100) and Z(100)`,
  'mathematics',
  `F(100) = ${f100}, Z(100) = ${z100.string_repr}`,
  1.0
);
await storePattern(pattern);
```

### Edit and Validate
```typescript
const result = await applyEdit(original, edited, 'typescript');

if (result.syntax_valid && result.confidence > 0.8) {
  // Apply edit
  updateCode(result.merged_code);
} else {
  // Fallback or request manual review
  showReviewDialog(result);
}
```

### Trajectory Analysis
```typescript
const traj = await phaseSpaceTrajectory(1, 1000);

console.log(`Analyzed ${traj.length} points`);
console.log(`Total path length: ${traj.path_length.toFixed(2)}`);

// Store trajectory metadata
await storePattern(createPattern(
  'Phase space analysis 1-1000',
  'analysis',
  `Path length: ${traj.path_length}`,
  1.0
));
```

## Type Safety

### Use TypeScript Types
```typescript
import type {
  ZeckendorfResult,
  EditResultJson,
  PatternInput,
  TrajectoryResult,
} from './wasm/types';

async function analyzeNumber(n: number): Promise<ZeckendorfResult> {
  return await zeckendorf(n);
}

function createSecurityPattern(desc: string): PatternInput {
  return createPattern(desc, 'security', 'TBD', 0.0);
}
```

### Type Guards
```typescript
function isValidEdit(result: EditResultJson): boolean {
  return result.syntax_valid &&
         result.confidence >= 0.7 &&
         result.chunks_found > 0;
}
```

## Development Tips

### 1. Always Initialize
```typescript
// Initialize once at app startup
await initReasoningBank();
```

### 2. Handle Large Numbers
```typescript
// Use strings, not numbers
const big = await fibonacci(1000);
const bigInt = BigInt(big);
```

### 3. Clear Caches Periodically
```typescript
// Every 100 operations
let opCount = 0;
async function compute() {
  opCount++;
  if (opCount % 100 === 0) {
    await clearCaches();
  }
}
```

### 4. Validate Inputs
```typescript
if (n < 0 || n > 10000) {
  throw new Error('n must be between 0 and 10000');
}
await fibonacci(n);
```

### 5. Use Parallel Operations
```typescript
// When operations are independent
const [fib, zeck, div] = await Promise.all([
  fibonacci(n),
  zeckendorf(n),
  bkDivergence(n)
]);
```

## Debugging

### Enable Logging
```rust
// In Rust (src-tauri)
log::set_max_level(log::LevelFilter::Debug);
```

```typescript
// In TypeScript
console.log('WASM operation:', { input, result });
```

### Check Module Status
```typescript
try {
  await fibonacci(1);
  console.log('Math framework: OK');
} catch (e) {
  console.error('Math framework: FAILED', e);
}
```

## Examples

See `/home/user/agentic-flow/tauri-anthropic-app/src/wasm/example.ts` for complete examples:

```typescript
import examples from './wasm/example';

// Run all examples
await examples.fibonacciExample();
await examples.zeckendorfExample();
await examples.reasoningBankExample();
await examples.agentBoosterExample();
await examples.completeWorkflowExample();
```

## Reference

- **Full Guide**: [WASM_INTEGRATION.md](./WASM_INTEGRATION.md)
- **Summary**: [WASM_INTEGRATION_SUMMARY.md](./WASM_INTEGRATION_SUMMARY.md)
- **API Types**: `/src/wasm/types.ts`
- **Examples**: `/src/wasm/example.ts`

---

**Pro Tip**: Import everything you need in one go:

```typescript
import wasm, {
  fibonacci,
  zeckendorf,
  initReasoningBank,
  storePattern,
  applyEdit,
  clearCaches,
} from './wasm';

// Then use directly
const f = await fibonacci(100);
```
