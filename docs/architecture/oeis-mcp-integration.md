# OEIS MCP Tool Integration

## Overview

This document specifies the MCP (Model Context Protocol) tool definitions for OEIS mathematical validation integration. These tools enable Claude to validate sequences, detect patterns, and link mathematical concepts directly through the MCP interface.

## MCP Tool Architecture

```
┌─────────────────────────────────────────────────────┐
│              Claude Desktop / CLI                   │
└────────────────────┬────────────────────────────────┘
                     │ MCP Protocol
┌────────────────────▼────────────────────────────────┐
│              FastMCP Server                         │
│  (/home/user/agentic-flow/agentic-flow/src/mcp)   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         OEIS MCP Tools (6 tools)            │  │
│  ├─────────────────────────────────────────────┤  │
│  │  1. oeis_validate                           │  │
│  │  2. oeis_match                              │  │
│  │  3. oeis_link_skill                         │  │
│  │  4. oeis_search                             │  │
│  │  5. oeis_pattern_detect                     │  │
│  │  6. oeis_analyze                            │  │
│  └─────────────────────────────────────────────┘  │
│                      │                              │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│          OEIS Integration Layer                     │
│  (OeisIntegration, SequenceValidator, etc.)        │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
/home/user/agentic-flow/agentic-flow/src/mcp/fastmcp/tools/
├── oeis/
│   ├── validate.ts               # oeis_validate
│   ├── match.ts                  # oeis_match
│   ├── link.ts                   # oeis_link_skill
│   ├── search.ts                 # oeis_search
│   ├── pattern.ts                # oeis_pattern_detect
│   └── analyze.ts                # oeis_analyze
└── index.ts                      # Tool registry
```

## MCP Tool Definitions

### 1. oeis_validate

**Purpose**: Validate a sequence of numbers against OEIS database

**Input Schema**:
```typescript
{
  name: "oeis_validate",
  description: "Validate a sequence of numbers against the OEIS database to check if it matches known mathematical sequences",
  inputSchema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: { type: "number" },
        description: "Array of sequence terms to validate (minimum 3 terms)",
        minItems: 3
      },
      context: {
        type: "string",
        description: "Optional context about what generated this sequence"
      },
      minConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.7,
        description: "Minimum confidence threshold for matches (0.0-1.0)"
      },
      maxResults: {
        type: "number",
        minimum: 1,
        maximum: 50,
        default: 10,
        description: "Maximum number of results to return"
      }
    },
    required: ["terms"]
  }
}
```

**Output**:
```typescript
{
  success: boolean;
  matches: Array<{
    oeisId: string;          // e.g., "A000045"
    name: string;
    confidence: number;      // 0.0-1.0
    matchType: string;       // "exact", "subsequence", "pattern", "semantic"
    matchedTerms: number[];
    formula?: string;
  }>;
  patterns: Array<{
    patternType: string;     // "arithmetic", "geometric", "recursive", "polynomial"
    formula: string;
    confidence: number;
  }>;
  confidence: number;
  improvementSuggestions?: string[];
}
```

**Example Usage**:
```typescript
// From Claude
mcp__claude-flow__oeis_validate({
  terms: [1, 1, 2, 3, 5, 8, 13, 21],
  context: "Generated Fibonacci sequence",
  minConfidence: 0.8
})

// Response
{
  success: true,
  matches: [{
    oeisId: "A000045",
    name: "Fibonacci numbers",
    confidence: 0.98,
    matchType: "exact",
    matchedTerms: [1, 1, 2, 3, 5, 8, 13, 21],
    formula: "F(n) = F(n-1) + F(n-2)"
  }],
  patterns: [{
    patternType: "recursive",
    formula: "a(n) = a(n-1) + a(n-2)",
    confidence: 0.95
  }],
  confidence: 0.98
}
```

### 2. oeis_match

**Purpose**: Find OEIS sequences matching a pattern or partial sequence

**Input Schema**:
```typescript
{
  name: "oeis_match",
  description: "Find OEIS sequences that match a pattern or partial sequence",
  inputSchema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: { type: "number" },
        description: "Sequence terms to match"
      },
      pattern: {
        type: "string",
        description: "Pattern description or formula to match"
      },
      keyword: {
        type: "string",
        description: "Keyword to search for"
      },
      limit: {
        type: "number",
        default: 10,
        description: "Maximum results to return"
      }
    }
  }
}
```

**Output**:
```typescript
{
  matches: Array<{
    oeisId: string;
    name: string;
    description: string;
    terms: number[];
    keywords: string[];
    formula?: string;
    similarity: number;
  }>;
  count: number;
}
```

### 3. oeis_link_skill

**Purpose**: Link a skill to an OEIS sequence pattern

**Input Schema**:
```typescript
{
  name: "oeis_link_skill",
  description: "Create a link between a skill and an OEIS mathematical sequence",
  inputSchema: {
    type: "object",
    properties: {
      skillId: {
        type: "number",
        description: "ID of the skill to link"
      },
      oeisId: {
        type: "string",
        description: "OEIS sequence ID (e.g., 'A000045')"
      },
      relationship: {
        type: "string",
        enum: ["produces", "uses", "validates_with", "similar_to"],
        default: "similar_to",
        description: "Type of relationship"
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.8,
        description: "Confidence in this link"
      },
      autoDetect: {
        type: "boolean",
        default: false,
        description: "Automatically detect and create multiple links"
      }
    },
    required: ["skillId"]
  }
}
```

**Output**:
```typescript
{
  success: boolean;
  links: Array<{
    skillId: number;
    skillName: string;
    oeisId: string;
    sequenceName: string;
    relationship: string;
    confidence: number;
  }>;
  message: string;
}
```

### 4. oeis_search

**Purpose**: Search OEIS database by terms, keywords, or name

**Input Schema**:
```typescript
{
  name: "oeis_search",
  description: "Search the OEIS database for sequences",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (terms, keywords, or name)"
      },
      searchType: {
        type: "string",
        enum: ["terms", "keyword", "name", "auto"],
        default: "auto",
        description: "Type of search to perform"
      },
      limit: {
        type: "number",
        default: 10,
        description: "Maximum results"
      },
      cachedOnly: {
        type: "boolean",
        default: false,
        description: "Search only cached sequences"
      }
    },
    required: ["query"]
  }
}
```

**Output**:
```typescript
{
  results: Array<{
    oeisId: string;
    name: string;
    description: string;
    terms: number[];
    keywords: string[];
    author: string;
    cached: boolean;
  }>;
  count: number;
  source: "cache" | "api";
}
```

### 5. oeis_pattern_detect

**Purpose**: Detect mathematical patterns in a sequence

**Input Schema**:
```typescript
{
  name: "oeis_pattern_detect",
  description: "Detect mathematical patterns in a sequence of numbers",
  inputSchema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: { type: "number" },
        minItems: 4,
        description: "Sequence terms to analyze"
      },
      patternTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["arithmetic", "geometric", "recursive", "polynomial", "custom"]
        },
        description: "Pattern types to check"
      },
      predictNext: {
        type: "number",
        default: 0,
        description: "Number of next terms to predict"
      }
    },
    required: ["terms"]
  }
}
```

**Output**:
```typescript
{
  patterns: Array<{
    patternType: string;
    signature: string;
    formula: string;
    confidence: number;
    relatedSequences: string[];  // OEIS IDs
  }>;
  predictions?: number[];
  confidence: number;
}
```

### 6. oeis_analyze

**Purpose**: Comprehensive OEIS analysis of skills or episodes

**Input Schema**:
```typescript
{
  name: "oeis_analyze",
  description: "Perform comprehensive OEIS mathematical analysis",
  inputSchema: {
    type: "object",
    properties: {
      targetType: {
        type: "string",
        enum: ["skill", "episode", "patterns"],
        description: "What to analyze"
      },
      targetId: {
        type: "number",
        description: "ID of skill or episode to analyze"
      },
      detailed: {
        type: "boolean",
        default: false,
        description: "Include detailed analysis"
      }
    },
    required: ["targetType"]
  }
}
```

**Output**:
```typescript
{
  analysis: {
    targetType: string;
    targetId?: number;
    summary: string;
    linkedSequences: number;
    patterns: number;
    avgConfidence: number;
    details: {
      sequences?: Array<{
        oeisId: string;
        name: string;
        relationship: string;
        useCount: number;
      }>;
      patterns?: Array<{
        patternType: string;
        confidence: number;
        validations: number;
      }>;
      validations?: {
        total: number;
        successful: number;
        avgConfidence: number;
      };
      suggestions?: string[];
    };
  };
}
```

## Tool Implementation Template

```typescript
// File: /home/user/agentic-flow/agentic-flow/src/mcp/fastmcp/tools/oeis/validate.ts

import { Database } from 'better-sqlite3';
import { SequenceValidator } from '../../../../agentdb/controllers/SequenceValidator.js';
import { OeisCache } from '../../../../agentdb/controllers/OeisCache.js';
import { OeisApiClient } from '../../../../agentdb/controllers/OeisApiClient.js';
import { EmbeddingService } from '../../../../agentdb/controllers/EmbeddingService.js';
import type { SequenceValidationQuery, ValidationResult } from '../../../../agentdb/controllers/types/oeis-types.js';

export async function oeisValidate(
  args: {
    terms: number[];
    context?: string;
    minConfidence?: number;
    maxResults?: number;
  },
  context: {
    db: Database;
  }
): Promise<ValidationResult> {
  const { db } = context;

  // Initialize OEIS components
  const embedder = new EmbeddingService();
  const apiClient = new OeisApiClient();
  const cache = new OeisCache(db);
  const validator = new SequenceValidator(db, embedder, apiClient, cache);

  // Build query
  const query: SequenceValidationQuery = {
    terms: args.terms,
    context: args.context,
    minConfidence: args.minConfidence ?? 0.7,
    maxResults: args.maxResults ?? 10,
    validationType: 'exact',
    includePartial: true
  };

  // Validate
  const result = await validator.validateSequence(query);

  return result;
}

// MCP Tool definition
export const oeisValidateTool = {
  name: "oeis_validate",
  description: "Validate a sequence of numbers against the OEIS database",
  inputSchema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: { type: "number" },
        description: "Array of sequence terms",
        minItems: 3
      },
      context: {
        type: "string",
        description: "Context about the sequence"
      },
      minConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.7
      },
      maxResults: {
        type: "number",
        minimum: 1,
        maximum: 50,
        default: 10
      }
    },
    required: ["terms"]
  },
  handler: oeisValidate
};
```

## Tool Registration

```typescript
// File: /home/user/agentic-flow/agentic-flow/src/mcp/fastmcp/tools/index.ts

import { oeisValidateTool } from './oeis/validate.js';
import { oeisMatchTool } from './oeis/match.js';
import { oeisLinkSkillTool } from './oeis/link.js';
import { oeisSearchTool } from './oeis/search.js';
import { oeisPatternDetectTool } from './oeis/pattern.js';
import { oeisAnalyzeTool } from './oeis/analyze.js';

export const oeisTools = [
  oeisValidateTool,
  oeisMatchTool,
  oeisLinkSkillTool,
  oeisSearchTool,
  oeisPatternDetectTool,
  oeisAnalyzeTool
];

// Register with MCP server
export function registerOeisTools(server: FastMCP) {
  for (const tool of oeisTools) {
    server.addTool(tool);
  }
}
```

## Integration with Existing MCP Server

```typescript
// File: /home/user/agentic-flow/agentic-flow/src/mcp/fastmcp/servers/stdio-full.ts

import { FastMCP } from 'fastmcp';
import { registerOeisTools } from '../tools/index.js';

const server = new FastMCP({
  name: "claude-flow",
  version: "2.0.0"
});

// Register existing tools
registerMemoryTools(server);
registerSwarmTools(server);
registerAgentTools(server);

// Register OEIS tools
registerOeisTools(server);

// Start server
server.start();
```

## Usage Examples

### Example 1: Validate Fibonacci Sequence

```typescript
// Claude uses MCP tool
const result = await mcp__claude_flow__oeis_validate({
  terms: [1, 1, 2, 3, 5, 8, 13, 21],
  context: "Testing Fibonacci generation",
  minConfidence: 0.8
});

console.log(`Found ${result.matches.length} matches`);
console.log(`Best match: ${result.matches[0].oeisId} (${result.matches[0].confidence})`);
```

### Example 2: Link Skill to Pattern

```typescript
// Auto-detect and link skill to OEIS patterns
const linkResult = await mcp__claude_flow__oeis_link_skill({
  skillId: 123,
  autoDetect: true,
  confidence: 0.7
});

console.log(`Created ${linkResult.links.length} links`);
```

### Example 3: Pattern Detection

```typescript
// Detect pattern in unknown sequence
const patternResult = await mcp__claude_flow__oeis_pattern_detect({
  terms: [1, 4, 9, 16, 25, 36],
  patternTypes: ["arithmetic", "polynomial"],
  predictNext: 3
});

console.log(`Pattern: ${patternResult.patterns[0].formula}`);
console.log(`Next terms: ${patternResult.predictions}`);  // [49, 64, 81]
```

### Example 4: Comprehensive Analysis

```typescript
// Analyze skill's mathematical profile
const analysis = await mcp__claude_flow__oeis_analyze({
  targetType: "skill",
  targetId: 123,
  detailed: true
});

console.log(analysis.analysis.summary);
console.log(`Linked sequences: ${analysis.analysis.linkedSequences}`);
console.log(`Patterns detected: ${analysis.analysis.patterns}`);
```

## Error Handling

All MCP tools return structured errors:

```typescript
{
  error: {
    code: string;           // "VALIDATION_ERROR", "RATE_LIMIT", "NETWORK_ERROR"
    message: string;
    details?: any;
    retryable: boolean;
  }
}
```

## Performance Considerations

1. **Caching**: All tools leverage L1/L2 cache for performance
2. **Rate Limiting**: API calls are rate-limited (3 req/sec)
3. **Batch Operations**: Multiple validations use batch processing
4. **Async Operations**: All operations are async/await
5. **Connection Pooling**: Database connections are pooled

## Testing

```typescript
// Test file: /home/user/agentic-flow/agentic-flow/src/mcp/fastmcp/tools/oeis/validate.test.ts

describe('oeis_validate MCP tool', () => {
  it('should validate Fibonacci sequence', async () => {
    const result = await oeisValidate({
      terms: [1, 1, 2, 3, 5, 8]
    }, { db });

    expect(result.success).toBe(true);
    expect(result.matches[0].oeisId).toBe('A000045');
  });

  it('should handle rate limiting', async () => {
    // Test rate limit error handling
  });
});
```

## Documentation

Add to MCP tools list:

```bash
npx claude-flow mcp tools
```

Output:
```
📦 Available MCP Tools (17 total)

Memory Tools (3):
  1. memory_store
  2. memory_retrieve
  3. memory_search

Swarm Tools (3):
  4. swarm_init
  5. agent_spawn
  6. task_orchestrate

Agent Tools (5):
  7. agent_execute
  8. agent_parallel
  9. agent_list
  10. agent_add
  11. command_add

OEIS Tools (6):
  12. oeis_validate      - Validate sequences against OEIS
  13. oeis_match         - Find matching OEIS sequences
  14. oeis_link_skill    - Link skills to OEIS patterns
  15. oeis_search        - Search OEIS database
  16. oeis_pattern_detect - Detect mathematical patterns
  17. oeis_analyze       - Comprehensive OEIS analysis
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-09
**Status**: Complete - Ready for Implementation
