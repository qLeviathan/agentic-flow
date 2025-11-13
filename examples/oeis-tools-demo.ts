/**
 * OEIS MCP Tools Demo
 * Demonstrates usage of all four OEIS validation tools
 */

import {
  validateSequenceTool,
  matchPatternTool,
  linkSkillTool,
  searchSequencesTool
} from '../agentic-flow/src/mcp/fastmcp/tools/oeis/index.js';

/**
 * Demo 1: Validate Fibonacci Sequence
 */
async function demoValidateSequence() {
  console.log('\n=== Demo 1: Validate Fibonacci Sequence ===\n');

  const result = await validateSequenceTool.execute({
    sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34],
    minConfidence: 0.9,
    maxResults: 3,
    includeExtended: true
  }, {
    onProgress: (update) => {
      console.log(`[${Math.round(update.progress * 100)}%] ${update.message}`);
    }
  });

  console.log('\nValidation Result:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Matches found: ${result.matchCount}`);

  if (result.bestMatch) {
    console.log(`\nBest Match:`);
    console.log(`  - OEIS ID: ${result.bestMatch.oeisId}`);
    console.log(`  - Name: ${result.bestMatch.name}`);
    console.log(`  - Confidence: ${result.bestMatch.confidence}`);
    console.log(`  - URL: ${result.bestMatch.url}`);
  }

  return result;
}

/**
 * Demo 2: Match Patterns for Square Numbers
 */
async function demoMatchPattern() {
  console.log('\n=== Demo 2: Match Pattern (Square Numbers) ===\n');

  const result = await matchPatternTool.execute({
    pattern: 'n^2',
    patternType: 'formula',
    maxResults: 5,
    includeMetadata: true
  }, {
    onProgress: (update) => {
      console.log(`[${Math.round(update.progress * 100)}%] ${update.message}`);
    }
  });

  console.log('\nPattern Match Result:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Matches found: ${result.matchCount}`);

  result.matches.slice(0, 3).forEach((match, idx) => {
    console.log(`\nMatch ${idx + 1}:`);
    console.log(`  - OEIS ID: ${match.oeisId}`);
    console.log(`  - Name: ${match.name}`);
    console.log(`  - Relevance: ${match.relevance}`);
    console.log(`  - Sequence: ${match.sequence.slice(0, 10).join(', ')}`);
  });

  return result;
}

/**
 * Demo 3: Search for Prime-Related Sequences
 */
async function demoSearchSequences() {
  console.log('\n=== Demo 3: Search OEIS (Prime Numbers) ===\n');

  const result = await searchSequencesTool.execute({
    query: 'prime',
    searchType: 'keyword',
    maxResults: 5,
    sortBy: 'popularity',
    includeMetadata: true
  }, {
    onProgress: (update) => {
      console.log(`[${Math.round(update.progress * 100)}%] ${update.message}`);
    }
  });

  console.log('\nSearch Result:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Results: ${result.resultCount}`);
  console.log(`- Total matches: ${result.totalMatches}`);

  result.results.slice(0, 3).forEach((seq, idx) => {
    console.log(`\nResult ${idx + 1}:`);
    console.log(`  - OEIS ID: ${seq.oeisId}`);
    console.log(`  - Name: ${seq.name}`);
    console.log(`  - Sequence: ${seq.sequence.slice(0, 10).join(', ')}`);
    console.log(`  - Popularity: ${seq.popularity}`);
  });

  return result;
}

/**
 * Demo 4: Link a Skill to OEIS Sequence
 */
async function demoLinkSkill() {
  console.log('\n=== Demo 4: Link Skill to OEIS Sequence ===\n');

  const result = await linkSkillTool.execute({
    skillName: 'fibonacci-generator',
    oeisId: 'A000045',
    relationship: 'generates',
    metadata: {
      confidence: 0.98,
      description: 'Generates Fibonacci numbers efficiently using dynamic programming',
      examples: ['fib(10) = 55', 'fib(20) = 6765'],
      tags: ['recursive', 'dynamic-programming', 'memoization']
    },
    updateSkillFile: false // Don't actually update file in demo
  }, {
    onProgress: (update) => {
      console.log(`[${Math.round(update.progress * 100)}%] ${update.message}`);
    }
  });

  console.log('\nLink Result:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Skill: ${result.link.skillName}`);
  console.log(`- OEIS ID: ${result.link.oeisId}`);
  console.log(`- Relationship: ${result.link.relationship}`);
  console.log(`- File Updated: ${result.skillFileUpdated}`);

  console.log(`\nOEIS Data:`);
  console.log(`  - ID: ${result.oeisData.id}`);
  console.log(`  - Name: ${result.oeisData.name}`);
  console.log(`  - URL: ${result.oeisData.url}`);
  console.log(`  - First terms: ${result.oeisData.sequence?.slice(0, 10).join(', ')}`);

  return result;
}

/**
 * Demo 5: Complete Workflow - Validate, Search, and Link
 */
async function demoCompleteWorkflow() {
  console.log('\n=== Demo 5: Complete Workflow ===\n');
  console.log('Scenario: Analyze an unknown sequence and link it to a skill\n');

  // Step 1: Validate the sequence
  console.log('Step 1: Validate sequence [2, 3, 5, 7, 11, 13, 17]...');
  const validation = await validateSequenceTool.execute({
    sequence: [2, 3, 5, 7, 11, 13, 17],
    minConfidence: 0.9,
    includeExtended: true
  }, {});

  if (!validation.bestMatch) {
    console.log('No match found with sufficient confidence.');
    return;
  }

  console.log(`✓ Match found: ${validation.bestMatch.oeisId} - ${validation.bestMatch.name}`);
  console.log(`  Confidence: ${validation.bestMatch.confidence}`);

  // Step 2: Search for related sequences
  console.log(`\nStep 2: Search for related sequences...`);
  const search = await searchSequencesTool.execute({
    query: validation.bestMatch.name,
    searchType: 'keyword',
    maxResults: 3
  }, {});

  console.log(`✓ Found ${search.resultCount} related sequences`);
  search.results.forEach((seq, idx) => {
    console.log(`  ${idx + 1}. ${seq.oeisId} - ${seq.name}`);
  });

  // Step 3: Link to skill (simulated)
  console.log(`\nStep 3: Link to skill...`);
  const link = await linkSkillTool.execute({
    skillName: 'prime-validator',
    oeisId: validation.bestMatch.oeisId,
    relationship: 'validates',
    metadata: {
      confidence: validation.bestMatch.confidence,
      description: `Validates prime number sequences based on ${validation.bestMatch.oeisId}`
    },
    updateSkillFile: false
  }, {});

  console.log(`✓ Skill linked successfully`);
  console.log(`  Skill: ${link.link.skillName}`);
  console.log(`  Sequence: ${link.oeisData.id} - ${link.oeisData.name}`);
  console.log(`  Relationship: ${link.link.relationship}`);

  console.log('\n✅ Complete workflow finished successfully!\n');
}

/**
 * Demo 6: Pattern Matching with Different Types
 */
async function demoPatternTypes() {
  console.log('\n=== Demo 6: Pattern Matching Types ===\n');

  const patterns = [
    { pattern: 'fibonacci', type: 'keyword' as const },
    { pattern: '2^n', type: 'formula' as const },
    { pattern: 'a(n)=a(n-1)+a(n-2)', type: 'recurrence' as const }
  ];

  for (const { pattern, type } of patterns) {
    console.log(`\nPattern: "${pattern}" (type: ${type})`);

    const result = await matchPatternTool.execute({
      pattern,
      patternType: type,
      maxResults: 2,
      includeMetadata: false
    }, {});

    if (result.matches.length > 0) {
      const match = result.matches[0];
      console.log(`  ✓ ${match.oeisId} - ${match.name}`);
      console.log(`    Relevance: ${match.relevance}`);
      console.log(`    Sequence: ${match.sequence.slice(0, 8).join(', ')}...`);
    } else {
      console.log(`  ✗ No matches found`);
    }
  }
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  OEIS MCP Tools - Comprehensive Demo     ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await demoValidateSequence();
    await demoMatchPattern();
    await demoSearchSequences();
    await demoLinkSkill();
    await demoCompleteWorkflow();
    await demoPatternTypes();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  All Demos Completed Successfully! 🎉    ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    throw error;
  }
}

/**
 * Run individual demo
 */
async function main() {
  const demoName = process.argv[2];

  const demos: Record<string, () => Promise<any>> = {
    'validate': demoValidateSequence,
    'pattern': demoMatchPattern,
    'search': demoSearchSequences,
    'link': demoLinkSkill,
    'workflow': demoCompleteWorkflow,
    'patterns': demoPatternTypes,
    'all': runAllDemos
  };

  if (!demoName || !demos[demoName]) {
    console.log('Usage: node oeis-tools-demo.js [demo]');
    console.log('\nAvailable demos:');
    console.log('  validate  - Validate a sequence');
    console.log('  pattern   - Match mathematical patterns');
    console.log('  search    - Search OEIS database');
    console.log('  link      - Link skill to sequence');
    console.log('  workflow  - Complete workflow example');
    console.log('  patterns  - Different pattern types');
    console.log('  all       - Run all demos');
    process.exit(1);
  }

  await demos[demoName]();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use as module
export {
  demoValidateSequence,
  demoMatchPattern,
  demoSearchSequences,
  demoLinkSkill,
  demoCompleteWorkflow,
  demoPatternTypes,
  runAllDemos
};
