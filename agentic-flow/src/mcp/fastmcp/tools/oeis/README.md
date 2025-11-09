# OEIS MCP Tools

Mathematical sequence validation and analysis tools for the Online Encyclopedia of Integer Sequences (OEIS).

## Tools Overview

| Tool | Purpose | Key Features |
|------|---------|-------------|
| `oeis_validate_sequence` | Validate numeric sequences | Confidence scoring, pattern matching, formula extraction |
| `oeis_match_pattern` | Match mathematical patterns | Keyword, formula, recurrence, regex matching |
| `oeis_link_skill` | Link skills to sequences | Metadata updates, relationship tracking |
| `oeis_search_sequences` | Search OEIS database | Multi-type search, popularity sorting |

## Quick Start

### Validate a Sequence

```typescript
import { validateSequenceTool } from './validate-sequence';

const result = await validateSequenceTool.execute({
  sequence: [1, 1, 2, 3, 5, 8, 13],
  minConfidence: 0.9,
  includeExtended: true
}, {
  onProgress: (update) => console.log(update.message)
});

console.log(result.bestMatch); // A000045 - Fibonacci numbers
```

### Search by Pattern

```typescript
import { matchPatternTool } from './match-pattern';

const result = await matchPatternTool.execute({
  pattern: 'n^2',
  patternType: 'formula',
  maxResults: 5
}, {});

console.log(result.matches); // Square numbers and related sequences
```

### Link a Skill

```typescript
import { linkSkillTool } from './link-skill';

const result = await linkSkillTool.execute({
  skillName: 'fibonacci-generator',
  oeisId: 'A000045',
  relationship: 'generates',
  updateSkillFile: true
}, {});

console.log(result.skillFilePath); // Updated skill file location
```

### Search Sequences

```typescript
import { searchSequencesTool } from './search-sequences';

const result = await searchSequencesTool.execute({
  query: 'prime AND mersenne',
  searchType: 'keyword',
  sortBy: 'popularity'
}, {});

console.log(result.results); // Matching sequences
```

## Architecture

### Tool Structure

Each tool follows the FastMCP pattern:

```typescript
export const toolName: ToolDefinition = {
  name: 'oeis_tool_name',
  description: 'Tool description with examples',
  parameters: zodSchema,
  execute: async (params, context) => {
    // Implementation with:
    // - Progress reporting via context.onProgress
    // - Error handling
    // - OEIS API integration
    // - Fallback mechanisms
    return result;
  }
};
```

### Key Components

1. **Zod Schema Validation**: All parameters validated with comprehensive schemas
2. **Progress Reporting**: Real-time updates via `onProgress` callbacks
3. **Error Handling**: Robust try-catch with meaningful error messages
4. **API Integration**: Direct OEIS API calls with curl fallback
5. **Fallback Data**: Mock data for known sequences when API unavailable
6. **TypeScript Types**: Full type safety with `ToolDefinition` interface

## OEIS API Integration

### API Endpoints

- **Search**: `https://oeis.org/search?q={query}&fmt=json`
- **Sequence by ID**: `https://oeis.org/search?q=id:{oeisId}&fmt=json`

### Response Format

```json
{
  "results": [
    {
      "number": "A000045",
      "name": "Fibonacci numbers",
      "data": "0,1,1,2,3,5,8,13,21,34,55,89,144",
      "formula": ["F(n) = F(n-1) + F(n-2)"],
      "keyword": ["nonn", "core", "easy"],
      "comment": ["The Fibonacci sequence"],
      "reference": [...],
      "link": [...],
      "author": "N.J.A. Sloane"
    }
  ],
  "count": 1
}
```

### Rate Limiting

- OEIS API has rate limits
- Tools include automatic retry logic
- Fallback to mock data for common sequences
- Results cached for 15 minutes

## Testing

### Unit Tests

```bash
# Run OEIS tool tests
npm test -- tools/oeis

# Test specific tool
npm test -- tools/oeis/validate-sequence.test.ts
```

### Integration Tests

```bash
# Test with live OEIS API
npm run test:integration -- oeis
```

### Manual Testing

```bash
# Start MCP server with OEIS tools
node src/mcp/fastmcp/servers/claude-flow-sdk.ts

# Or use full server
node src/mcp/fastmcp/servers/stdio-full.ts
```

## Development

### Adding New Tools

1. Create tool file in `/tools/oeis/`
2. Define Zod schema for parameters
3. Implement `ToolDefinition` interface
4. Add OEIS API integration
5. Include fallback mock data
6. Export from `index.ts`
7. Update server registrations

### Code Style

```typescript
// Use descriptive names
const calculateConfidence = (query: number[], oeis: number[]): number => {
  // Implementation
};

// Include JSDoc comments
/**
 * Extract numeric sequence from OEIS data string
 * @param data - OEIS data string (comma-separated)
 * @returns Array of parsed numbers
 */
function extractSequenceData(data: string): number[] {
  // Implementation
}

// Handle errors gracefully
try {
  const result = await fetchOEISData(oeisId);
} catch (error: any) {
  // Fallback to mock data
  return getMockOEISData(oeisId);
}
```

## Dependencies

- `zod`: Schema validation
- `child_process`: Execute curl commands
- `fs/promises`: File system operations (link-skill)
- `path`: Path manipulation (link-skill)

## Known Sequences (Mock Data)

The tools include fallback data for common sequences:

- **A000045**: Fibonacci numbers
- **A000040**: Prime numbers
- **A000142**: Factorial numbers
- **A000079**: Powers of 2
- **A000290**: Square numbers

## Error Handling

### Common Errors

```typescript
// Invalid sequence format
Error: Sequence must be an array of numbers with minimum 3 terms

// Invalid OEIS ID
Error: OEIS ID must match format A######

// API timeout
Error: OEIS API request timed out

// Sequence not found
Error: OEIS sequence A999999 not found
```

### Error Recovery

1. **API Failures**: Automatic fallback to mock data
2. **Network Issues**: Retry with exponential backoff
3. **Invalid Input**: Clear validation error messages
4. **File Operations**: Graceful degradation (link-skill)

## Performance

### Optimization Strategies

- **Caching**: 15-minute cache for API responses
- **Batch Requests**: Combine multiple searches
- **Lazy Loading**: Load metadata only when needed
- **Mock Fallback**: Fast responses for known sequences

### Benchmarks

- Validate sequence: ~500ms (with API), ~50ms (cached)
- Pattern matching: ~800ms (with API), ~100ms (cached)
- Skill linking: ~300ms (local operations)
- Search: ~600ms (with API), ~80ms (cached)

## Contributing

See main [CONTRIBUTING.md](/CONTRIBUTING.md) for guidelines.

### OEIS-Specific Guidelines

1. Test with both API and mock data
2. Include example usage in tool descriptions
3. Add new mock sequences for common patterns
4. Document confidence score calculations
5. Update documentation with new features

## Resources

- [OEIS Website](https://oeis.org)
- [OEIS API Documentation](https://oeis.org/wiki/JSON_Format)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [Zod Documentation](https://zod.dev)

## License

Part of agentic-flow project. See [LICENSE](/LICENSE) for details.
