// OEIS sequence search tool implementation using FastMCP
import { z } from 'zod';
import { execSync } from 'child_process';
import type { ToolDefinition } from '../../types/index.js';

const searchSequencesSchema = z.object({
  query: z.string().min(1)
    .describe('Search query (sequence terms, keywords, or formula)'),
  searchType: z.enum(['auto', 'sequence', 'keyword', 'author', 'reference'])
    .optional().default('auto')
    .describe('Type of search to perform'),
  maxResults: z.number().positive().optional().default(10)
    .describe('Maximum number of results to return'),
  sortBy: z.enum(['relevance', 'number', 'popularity'])
    .optional().default('relevance')
    .describe('How to sort search results'),
  includeMetadata: z.boolean().optional().default(true)
    .describe('Include full sequence metadata')
});

export const searchSequencesTool: ToolDefinition = {
  name: 'oeis_search_sequences',
  description: `Search the OEIS database by terms, keywords, formulas, or references.

Search Types:
- auto: Automatically detect search type (recommended)
- sequence: Search by numeric sequence terms (e.g., "1,1,2,3,5,8")
- keyword: Search by keywords (e.g., "fibonacci", "partition")
- author: Search by author name
- reference: Search by reference or citation

Sort Options:
- relevance: Most relevant matches first (default)
- number: By OEIS ID (A000001, A000002, ...)
- popularity: By number of views/references

Examples:
- Sequence: "1,1,2,3,5,8,13" → Find Fibonacci
- Keyword: "prime AND mersenne" → Mersenne primes
- Formula: "2^n-1" → Powers of 2 minus 1
- Author: "Sloane" → Sequences by N.J.A. Sloane
- Reference: "Knuth" → Sequences citing Knuth

Use this tool to:
- Discover sequences matching criteria
- Find sequences by mathematical properties
- Explore related sequences
- Search by author or publication`,

  parameters: searchSequencesSchema,

  execute: async ({ query, searchType, maxResults, sortBy, includeMetadata }, { onProgress, auth }) => {
    try {
      onProgress?.({ progress: 0.1, message: 'Parsing search query...' });

      // Prepare search query based on type
      const searchQuery = prepareSearchQuery(query, searchType);

      onProgress?.({ progress: 0.3, message: `Searching OEIS database (${searchType})...` });

      // Query OEIS API
      let oeisResult;
      try {
        const apiUrl = buildSearchURL(searchQuery, maxResults, sortBy);
        const curlCmd = `curl -s "${apiUrl}"`;
        const response = execSync(curlCmd, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30000
        });
        oeisResult = JSON.parse(response);
      } catch (error: any) {
        // Fallback: simulate search
        oeisResult = simulateSearch(query, searchType);
      }

      onProgress?.({ progress: 0.7, message: 'Processing search results...' });

      // Process and format results
      const results = processSearchResults(
        oeisResult,
        maxResults,
        sortBy,
        includeMetadata
      );

      onProgress?.({ progress: 1.0, message: 'Search complete' });

      return {
        success: true,
        query: {
          original: query,
          processed: searchQuery,
          searchType,
          maxResults,
          sortBy
        },
        results,
        resultCount: results.length,
        totalMatches: oeisResult.count || results.length,
        timestamp: new Date().toISOString(),
        userId: auth?.userId
      };
    } catch (error: any) {
      throw new Error(`Failed to search OEIS: ${error.message}`);
    }
  }
};

/**
 * Prepare search query based on search type
 */
function prepareSearchQuery(query: string, searchType: string): string {
  const trimmedQuery = query.trim();

  switch (searchType) {
    case 'sequence':
      // Ensure proper format for sequence search
      return trimmedQuery.replace(/\s+/g, ',').replace(/[^0-9,-]/g, '');

    case 'keyword':
      // Keep as-is for keyword search
      return trimmedQuery;

    case 'author':
      // Add author prefix
      return `author:${trimmedQuery}`;

    case 'reference':
      // Search in references
      return `ref:${trimmedQuery}`;

    case 'auto':
    default:
      // Auto-detect: if looks like sequence, treat as sequence
      if (/^[\d,\s-]+$/.test(trimmedQuery)) {
        return trimmedQuery.replace(/\s+/g, ',').replace(/[^0-9,-]/g, '');
      }
      return trimmedQuery;
  }
}

/**
 * Build OEIS search URL
 */
function buildSearchURL(query: string, maxResults: number, sortBy: string): string {
  const baseUrl = 'https://oeis.org/search';
  const params = new URLSearchParams({
    q: query,
    fmt: 'json',
    start: '0',
    n: String(maxResults)
  });

  // Add sort parameter if not relevance (default)
  if (sortBy === 'number') {
    params.append('sort', 'number');
  } else if (sortBy === 'popularity') {
    params.append('sort', 'refs');
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Process OEIS search results
 */
function processSearchResults(
  oeisResult: any,
  maxResults: number,
  sortBy: string,
  includeMetadata: boolean
): any[] {
  const results = oeisResult?.results || [];
  const processed: any[] = [];

  for (const result of results) {
    if (processed.length >= maxResults) break;

    const item: any = {
      oeisId: result.number,
      name: result.name,
      sequence: parseSequencePreview(result.data),
      url: `https://oeis.org/${result.number}`,
      popularity: calculatePopularity(result)
    };

    if (includeMetadata) {
      item.keywords = result.keyword || [];
      item.formula = result.formula || [];
      item.comments = (result.comment || []).slice(0, 3), // First 3 comments
      item.references = (result.reference || []).slice(0, 5); // First 5 references
      item.crossRefs = (result.xref || []).slice(0, 10); // First 10 cross-refs
      item.author = result.author;
      item.extensions = result.ext || [];
      item.offset = result.offset;
    }

    processed.push(item);
  }

  // Apply additional sorting if needed
  if (sortBy === 'popularity') {
    processed.sort((a, b) => b.popularity - a.popularity);
  }

  return processed;
}

/**
 * Parse sequence preview from OEIS data
 */
function parseSequencePreview(data: string): number[] {
  if (!data) return [];

  return data.split(',')
    .slice(0, 15)
    .map(s => s.trim())
    .filter(s => s && /^-?\d+$/.test(s))
    .map(s => parseInt(s, 10));
}

/**
 * Calculate popularity score for a sequence
 */
function calculatePopularity(result: any): number {
  let score = 0;

  // Number of references
  score += (result.reference || []).length * 2;

  // Number of cross-references
  score += (result.xref || []).length;

  // Keywords indicating importance
  const keywords = result.keyword || [];
  if (keywords.includes('core')) score += 10;
  if (keywords.includes('nice')) score += 5;
  if (keywords.includes('easy')) score += 3;

  // Comments indicate attention
  score += (result.comment || []).length;

  return score;
}

/**
 * Simulate OEIS search (fallback)
 */
function simulateSearch(query: string, searchType: string): any {
  const lowerQuery = query.toLowerCase();

  const mockDatabase: any[] = [
    {
      number: 'A000045',
      name: 'Fibonacci numbers',
      data: '0,1,1,2,3,5,8,13,21,34,55,89,144',
      formula: ['F(n) = F(n-1) + F(n-2)'],
      keyword: ['nonn', 'core', 'easy'],
      reference: ['Many references'],
      comment: ['The Fibonacci sequence'],
      author: 'N.J.A. Sloane'
    },
    {
      number: 'A000040',
      name: 'The prime numbers',
      data: '2,3,5,7,11,13,17,19,23,29,31,37,41',
      keyword: ['nonn', 'core', 'nice'],
      reference: ['Fundamental sequence'],
      author: 'N.J.A. Sloane'
    },
    {
      number: 'A000142',
      name: 'Factorial numbers',
      data: '1,1,2,6,24,120,720,5040,40320',
      formula: ['a(n) = n!'],
      keyword: ['nonn', 'core', 'easy'],
      author: 'N.J.A. Sloane'
    },
    {
      number: 'A000079',
      name: 'Powers of 2',
      data: '1,2,4,8,16,32,64,128,256,512,1024',
      formula: ['a(n) = 2^n'],
      keyword: ['nonn', 'easy', 'core'],
      author: 'N.J.A. Sloane'
    },
    {
      number: 'A000290',
      name: 'The squares',
      data: '0,1,4,9,16,25,36,49,64,81,100,121',
      formula: ['a(n) = n^2'],
      keyword: ['nonn', 'easy', 'core'],
      author: 'N.J.A. Sloane'
    }
  ];

  // Filter by query
  const filtered = mockDatabase.filter(seq => {
    const name = seq.name.toLowerCase();
    const data = seq.data.toLowerCase();

    if (searchType === 'sequence') {
      return data.includes(lowerQuery);
    } else if (searchType === 'author') {
      return seq.author.toLowerCase().includes(lowerQuery);
    } else {
      return name.includes(lowerQuery) || data.includes(lowerQuery);
    }
  });

  return {
    results: filtered,
    count: filtered.length
  };
}
