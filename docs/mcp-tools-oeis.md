# OEIS MCP Tools Documentation

## Overview

The OEIS (Online Encyclopedia of Integer Sequences) MCP tools provide powerful capabilities for validating, searching, and linking mathematical sequences within the agentic-flow framework. These tools integrate with the OEIS database to enable mathematical sequence analysis and skill enhancement.

## Available Tools

### 1. `oeis_validate_sequence`

Validates any numeric sequence against the OEIS database and returns matching sequences with confidence scores.

**Parameters:**
- `sequence` (array of numbers, required): Array of numbers to validate (minimum 3 terms)
- `minConfidence` (number, optional): Minimum confidence score for matches (0-1, default: 0.7)
- `maxResults` (number, optional): Maximum number of matches to return (default: 5)
- `includeExtended` (boolean, optional): Include extended information like formulas and references (default: false)

**Returns:**
- `success`: Boolean indicating operation success
- `matches`: Array of matching sequences with confidence scores
- `bestMatch`: The highest confidence match
- `matchCount`: Number of matches found

**Example Usage:**

```javascript
// Validate Fibonacci sequence
{
  "sequence": [1, 1, 2, 3, 5, 8, 13],
  "minConfidence": 0.9,
  "maxResults": 3,
  "includeExtended": true
}

// Response:
{
  "success": true,
  "matches": [
    {
      "oeisId": "A000045",
      "name": "Fibonacci numbers",
      "confidence": 1.0,
      "sequence": [0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
      "formula": "F(n) = F(n-1) + F(n-2)",
      "url": "https://oeis.org/A000045"
    }
  ],
  "bestMatch": { "oeisId": "A000045", "confidence": 1.0 }
}
```

**Use Cases:**
- Identify unknown mathematical sequences
- Validate sequence correctness
- Discover sequence properties and formulas
- Link sequences to mathematical concepts

---

### 2. `oeis_match_pattern`

Matches OEIS sequences to mathematical patterns using various strategies (keyword, formula, recurrence, regex).

**Parameters:**
- `pattern` (string, required): Pattern to match (regex-like syntax or mathematical expression)
- `patternType` (enum, optional): Type of pattern matching - `keyword`, `formula`, `recurrence`, `regex` (default: `keyword`)
- `maxResults` (number, optional): Maximum matching sequences to return (default: 10)
- `includeMetadata` (boolean, optional): Include sequence metadata (default: true)

**Returns:**
- `success`: Boolean indicating operation success
- `matches`: Array of sequences matching the pattern
- `matchCount`: Number of matches found

**Example Usage:**

```javascript
// Search by keyword
{
  "pattern": "fibonacci",
  "patternType": "keyword",
  "maxResults": 5
}

// Search by formula
{
  "pattern": "n^2",
  "patternType": "formula",
  "maxResults": 10
}

// Search by recurrence
{
  "pattern": "a(n)=2*a(n-1)",
  "patternType": "recurrence"
}

// Advanced regex pattern
{
  "pattern": "^[13579]+$",
  "patternType": "regex",
  "includeMetadata": true
}

// Response:
{
  "success": true,
  "matches": [
    {
      "oeisId": "A000290",
      "name": "Square numbers",
      "sequence": [0, 1, 4, 9, 16, 25, 36, 49, 64],
      "matchReason": "Formula matches: n^2",
      "relevance": 0.95,
      "formula": ["a(n) = n^2"],
      "keywords": ["nonn", "easy", "core"]
    }
  ]
}
```

**Pattern Types:**
- **keyword**: Search by mathematical concepts (e.g., "prime", "fibonacci", "partition")
- **formula**: Match specific formulas (e.g., "n^2", "2^n", "n!")
- **recurrence**: Match recurrence relations (e.g., "a(n)=a(n-1)+a(n-2)")
- **regex**: Advanced pattern matching on sequence data

---

### 3. `oeis_link_skill`

Links a Claude Code skill to an OEIS sequence and updates skill metadata with mathematical context.

**Parameters:**
- `skillName` (string, required): Name of the skill to link
- `oeisId` (string, required): OEIS sequence ID (format: A######, e.g., "A000045")
- `relationship` (enum, optional): Type of relationship - `implements`, `generates`, `validates`, `analyzes`, `references` (default: `references`)
- `metadata` (object, optional): Additional metadata including confidence, description, examples, tags
- `updateSkillFile` (boolean, optional): Update the skill file with OEIS metadata (default: true)

**Returns:**
- `success`: Boolean indicating operation success
- `link`: The created link record
- `skillFileUpdated`: Whether the skill file was updated
- `skillFilePath`: Path to the updated skill file
- `oeisData`: Summary of OEIS sequence data

**Example Usage:**

```javascript
// Link Fibonacci generator skill
{
  "skillName": "fibonacci-generator",
  "oeisId": "A000045",
  "relationship": "generates",
  "metadata": {
    "confidence": 0.98,
    "description": "Generates Fibonacci numbers efficiently",
    "examples": ["fib(10) = 55"],
    "tags": ["recursive", "dynamic-programming"]
  },
  "updateSkillFile": true
}

// Response:
{
  "success": true,
  "link": {
    "skillName": "fibonacci-generator",
    "oeisId": "A000045",
    "relationship": "generates",
    "oeisName": "Fibonacci numbers",
    "linkedAt": "2025-01-15T10:30:00.000Z"
  },
  "skillFileUpdated": true,
  "skillFilePath": "/path/to/skill/fibonacci-generator.md",
  "oeisData": {
    "id": "A000045",
    "name": "Fibonacci numbers",
    "url": "https://oeis.org/A000045",
    "formula": "F(n) = F(n-1) + F(n-2)"
  }
}
```

**Relationship Types:**
- **implements**: Skill implements the sequence generation algorithm
- **generates**: Skill can generate terms of the sequence
- **validates**: Skill validates sequence membership
- **analyzes**: Skill analyzes properties of the sequence
- **references**: Skill references or mentions the sequence

---

### 4. `oeis_search_sequences`

Search the OEIS database by terms, keywords, formulas, authors, or references.

**Parameters:**
- `query` (string, required): Search query (sequence terms, keywords, or formula)
- `searchType` (enum, optional): Type of search - `auto`, `sequence`, `keyword`, `author`, `reference` (default: `auto`)
- `maxResults` (number, optional): Maximum results to return (default: 10)
- `sortBy` (enum, optional): Sort order - `relevance`, `number`, `popularity` (default: `relevance`)
- `includeMetadata` (boolean, optional): Include full sequence metadata (default: true)

**Returns:**
- `success`: Boolean indicating operation success
- `results`: Array of matching sequences
- `resultCount`: Number of results returned
- `totalMatches`: Total number of matches found

**Example Usage:**

```javascript
// Search by sequence terms
{
  "query": "1,1,2,3,5,8,13",
  "searchType": "sequence",
  "maxResults": 5
}

// Search by keyword
{
  "query": "prime AND mersenne",
  "searchType": "keyword",
  "sortBy": "popularity"
}

// Search by author
{
  "query": "Sloane",
  "searchType": "author",
  "maxResults": 20
}

// Auto-detect search type
{
  "query": "2^n-1",
  "searchType": "auto",
  "includeMetadata": true
}

// Response:
{
  "success": true,
  "results": [
    {
      "oeisId": "A000045",
      "name": "Fibonacci numbers",
      "sequence": [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
      "url": "https://oeis.org/A000045",
      "popularity": 95,
      "keywords": ["nonn", "core", "easy"],
      "formula": ["F(n) = F(n-1) + F(n-2)"],
      "author": "N.J.A. Sloane"
    }
  ],
  "resultCount": 1,
  "totalMatches": 1
}
```

**Search Types:**
- **auto**: Automatically detect search type (recommended)
- **sequence**: Search by numeric sequence terms
- **keyword**: Search by mathematical keywords
- **author**: Search by author name
- **reference**: Search by citation or reference

---

## Integration Examples

### Example 1: Validate and Link a Skill

```javascript
// Step 1: Validate a sequence
const validation = await oeis_validate_sequence({
  sequence: [2, 3, 5, 7, 11, 13, 17, 19],
  minConfidence: 0.9,
  includeExtended: true
});

// Step 2: Link to skill if match found
if (validation.bestMatch && validation.bestMatch.confidence > 0.9) {
  await oeis_link_skill({
    skillName: "prime-checker",
    oeisId: validation.bestMatch.oeisId,
    relationship: "validates",
    metadata: {
      confidence: validation.bestMatch.confidence,
      description: "Validates prime number sequences"
    }
  });
}
```

### Example 2: Pattern-Based Skill Discovery

```javascript
// Find all sequences related to factorials
const patterns = await oeis_match_pattern({
  pattern: "factorial",
  patternType: "keyword",
  maxResults: 10,
  includeMetadata: true
});

// Create skills for each pattern
for (const match of patterns.matches) {
  console.log(`Found: ${match.oeisId} - ${match.name}`);
  console.log(`Formula: ${match.formula}`);
  console.log(`Relevance: ${match.relevance}`);
}
```

### Example 3: Comprehensive Sequence Research

```javascript
// Research a specific mathematical concept
const search = await oeis_search_sequences({
  query: "catalan numbers",
  searchType: "keyword",
  maxResults: 5,
  sortBy: "popularity",
  includeMetadata: true
});

// Validate against known terms
for (const result of search.results) {
  const validation = await oeis_validate_sequence({
    sequence: result.sequence.slice(0, 8),
    minConfidence: 0.95
  });

  console.log(`${result.oeisId}: Confidence ${validation.bestMatch?.confidence}`);
}
```

---

## CLI Access

The OEIS tools are also accessible via CLI through the MCP server:

```bash
# Start the MCP server with OEIS tools
npx claude-flow@alpha mcp start

# Or use the full stdio server
node agentic-flow/src/mcp/fastmcp/servers/stdio-full.ts
```

## API Integration

### Using with Claude Code

```typescript
import { oeisTools } from './src/mcp/fastmcp/tools/oeis';

// Access individual tools
const { validateSequenceTool, matchPatternTool, linkSkillTool, searchSequencesTool } = oeisTools;

// Execute a tool
const result = await validateSequenceTool.execute(
  { sequence: [1, 2, 4, 8, 16, 32], minConfidence: 0.8 },
  { onProgress: (update) => console.log(update.message) }
);
```

### Using with MCP Protocol

```json
{
  "method": "tools/call",
  "params": {
    "name": "oeis_validate_sequence",
    "arguments": {
      "sequence": [1, 1, 2, 3, 5, 8, 13],
      "minConfidence": 0.9,
      "includeExtended": true
    }
  }
}
```

---

## Error Handling

All OEIS tools include robust error handling:

```javascript
try {
  const result = await oeis_validate_sequence({
    sequence: [1, 2, 3],  // Might be too short
    minConfidence: 0.9
  });
} catch (error) {
  console.error('Validation failed:', error.message);
  // Handle error appropriately
}
```

Common errors:
- **Invalid sequence format**: Sequence must be array of numbers
- **OEIS ID format error**: Must match pattern A######
- **API timeout**: Network issues or rate limiting
- **No matches found**: Sequence not in OEIS database

---

## Performance Considerations

- **Caching**: Results are cached for 15 minutes to reduce API calls
- **Rate Limiting**: OEIS API has rate limits; tools include automatic retry logic
- **Fallback Data**: Mock data available for common sequences when API is unavailable
- **Batch Operations**: Use search tools for multiple sequence lookups

---

## Best Practices

1. **Start with Search**: Use `oeis_search_sequences` for exploratory research
2. **Validate Before Linking**: Always validate sequences before linking to skills
3. **Use Confidence Scores**: Set appropriate `minConfidence` thresholds (0.7-0.9)
4. **Include Metadata**: Enable `includeExtended` for comprehensive information
5. **Pattern Types**: Use `auto` search type unless you need specific matching
6. **Error Handling**: Always wrap OEIS calls in try-catch blocks

---

## Future Enhancements

- [ ] Real-time OEIS API streaming
- [ ] Sequence generation from OEIS formulas
- [ ] Cross-referencing between related sequences
- [ ] Advanced pattern matching with ML
- [ ] Skill recommendation based on OEIS metadata
- [ ] Batch validation for multiple sequences
- [ ] OEIS data synchronization and caching

---

## Resources

- **OEIS Website**: https://oeis.org
- **OEIS API Documentation**: https://oeis.org/wiki/JSON_Format
- **Agentic Flow Documentation**: /docs
- **MCP Tools Guide**: /docs/mcp-tools.md

---

## License

These tools are part of the agentic-flow project and follow the same license terms.
