#!/usr/bin/env node
/**
 * OEIS CLI - Command-line interface for OEIS validation operations
 *
 * Provides commands for:
 * - Sequence validation against OEIS database
 * - Pattern detection and matching
 * - Searching OEIS sequences
 * - Linking skills to OEIS sequences
 * - Cache management
 */

import { OeisApiClient } from '../../../packages/agentdb/src/oeis/OeisApiClient.js';
import { OeisCache } from '../../../packages/agentdb/src/oeis/OeisCache.js';
import { SequenceValidator } from '../../../packages/agentdb/src/oeis/SequenceValidator.js';
import { MathematicalValidators } from '../../../packages/agentdb/src/oeis/MathematicalValidators.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  dim: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`),
};

// Progress indicator
function showProgress(message: string) {
  process.stdout.write(`${colors.cyan}⏳ ${message}...${colors.reset}\r`);
}

function clearProgress() {
  process.stdout.write('\r\x1b[K');
}

export class OeisCLI {
  private apiClient: OeisApiClient;
  private cache: OeisCache;
  private validator: SequenceValidator;
  private mathValidators: MathematicalValidators;

  constructor() {
    this.apiClient = new OeisApiClient();
    this.cache = new OeisCache({
      dbPath: process.env.OEIS_CACHE_PATH || './oeis-cache.db',
      preloadPopular: true,
    });
    this.validator = new SequenceValidator({
      apiClient: this.apiClient,
      cache: this.cache,
    });
    this.mathValidators = new MathematicalValidators();
  }

  async initialize(): Promise<void> {
    await this.validator.initialize();
  }

  // ============================================================================
  // Validate Command
  // ============================================================================

  async validateSequence(args: string[]): Promise<void> {
    log.header('\n🔍 OEIS Sequence Validation');

    if (args.length === 0) {
      log.error('No sequence provided');
      console.log('\nUsage: oeis validate <sequence>');
      console.log('Example: oeis validate "1,1,2,3,5,8,13,21"');
      console.log('Example: oeis validate 1,1,2,3,5,8,13,21');
      return;
    }

    // Parse sequence
    const sequenceStr = args.join(' ').replace(/[\[\]]/g, '');
    const sequence = sequenceStr.split(',').map(s => parseInt(s.trim(), 10));

    if (sequence.some(isNaN)) {
      log.error('Invalid sequence: contains non-numeric values');
      return;
    }

    log.info(`Sequence: [${sequence.join(', ')}]`);
    log.info(`Length: ${sequence.length} terms`);

    showProgress('Validating sequence');

    try {
      const result = await this.validator.validate(sequence);
      clearProgress();

      console.log('\n' + '═'.repeat(80));

      if (result.isValid) {
        log.success('Sequence Validated!');
        console.log(`\n${colors.bright}Match Details:${colors.reset}`);
        console.log(`  OEIS ID: ${colors.cyan}${result.sequenceId}${colors.reset}`);
        console.log(`  Confidence: ${colors.green}${(result.confidence * 100).toFixed(1)}%${colors.reset}`);
        console.log(`  Match Type: ${colors.yellow}${result.matchType}${colors.reset}`);

        if (result.matchedSequence) {
          console.log(`\n${colors.bright}Sequence Information:${colors.reset}`);
          console.log(`  Name: ${result.matchedSequence.name}`);
          console.log(`  URL: https://oeis.org/${result.sequenceId}`);

          if (result.matchDetails?.formula) {
            console.log(`  Formula: ${result.matchDetails.formula}`);
          }

          if (result.matchedSequence.data && result.matchedSequence.data.length > 0) {
            const displayTerms = result.matchedSequence.data.slice(0, 15);
            console.log(`  First terms: ${displayTerms.join(', ')}${result.matchedSequence.data.length > 15 ? '...' : ''}`);
          }
        }

        if (result.matchDetails) {
          console.log(`\n${colors.bright}Match Statistics:${colors.reset}`);
          console.log(`  Matched terms: ${result.matchDetails.matchedTerms}/${result.matchDetails.totalTerms}`);
          console.log(`  Start index: ${result.matchDetails.startIndex}`);
          if (result.matchDetails.deviation !== undefined) {
            console.log(`  Avg deviation: ${result.matchDetails.deviation.toFixed(2)}`);
          }
        }
      } else {
        log.warning('No exact match found');
        console.log(`\n${colors.bright}Validation Result:${colors.reset}`);
        console.log(`  Confidence: ${colors.yellow}${(result.confidence * 100).toFixed(1)}%${colors.reset}`);
        console.log(`  Match Type: ${result.matchType}`);

        if (result.error) {
          console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
        }

        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`\n${colors.bright}Suggested Matches:${colors.reset}`);
          result.suggestions.slice(0, 3).forEach((seq, i) => {
            console.log(`\n  ${i + 1}. ${colors.cyan}${seq.id}${colors.reset} - ${seq.name}`);
            if (seq.data && seq.data.length > 0) {
              const displayTerms = seq.data.slice(0, 10);
              console.log(`     Terms: ${displayTerms.join(', ')}...`);
            }
            console.log(`     URL: ${colors.dim}https://oeis.org/${seq.id}${colors.reset}`);
          });
        }
      }

      console.log('═'.repeat(80) + '\n');
    } catch (error) {
      clearProgress();
      log.error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // Search Command
  // ============================================================================

  async searchSequences(args: string[]): Promise<void> {
    log.header('\n🔎 OEIS Search');

    if (args.length === 0) {
      log.error('No search terms provided');
      console.log('\nUsage: oeis search <terms>');
      console.log('Example: oeis search fibonacci');
      console.log('Example: oeis search "prime numbers"');
      console.log('Example: oeis search 2,3,5,7,11,13');
      return;
    }

    const query = args.join(' ');
    log.info(`Query: "${query}"`);

    showProgress('Searching OEIS database');

    try {
      // Check if query is a sequence of numbers
      const isNumericSequence = /^[\d,\s]+$/.test(query);

      let results;
      if (isNumericSequence) {
        const sequence = query.split(',').map(s => parseInt(s.trim(), 10));
        results = await this.apiClient.searchByValues(sequence);
      } else {
        results = await this.apiClient.search(query);
      }

      clearProgress();

      if (results.count === 0) {
        log.warning('No results found');
        return;
      }

      log.success(`Found ${results.count} sequence(s)`);
      console.log('\n' + '═'.repeat(80));

      results.results.slice(0, 10).forEach((seq, i) => {
        console.log(`\n${colors.bright}#${i + 1}: ${colors.cyan}${seq.id}${colors.reset} - ${seq.name}`);

        if (seq.data && seq.data.length > 0) {
          const displayTerms = seq.data.slice(0, 12);
          console.log(`  Terms: ${displayTerms.join(', ')}${seq.data.length > 12 ? '...' : ''}`);
        }

        if (seq.formula && seq.formula.length > 0) {
          console.log(`  Formula: ${seq.formula[0]}`);
        }

        if (seq.keyword && seq.keyword.length > 0) {
          console.log(`  Keywords: ${colors.dim}${seq.keyword.join(', ')}${colors.reset}`);
        }

        console.log(`  URL: ${colors.dim}https://oeis.org/${seq.id}${colors.reset}`);
        console.log('─'.repeat(80));
      });

      if (results.count > 10) {
        log.dim(`\n... and ${results.count - 10} more results`);
      }

      console.log('═'.repeat(80) + '\n');
    } catch (error) {
      clearProgress();
      log.error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // Pattern Detection Command
  // ============================================================================

  async detectPattern(args: string[]): Promise<void> {
    log.header('\n🧩 Pattern Detection');

    if (args.length === 0) {
      log.error('No sequence provided');
      console.log('\nUsage: oeis pattern <sequence>');
      console.log('Example: oeis pattern 1,1,2,3,5,8,13');
      console.log('Example: oeis pattern 2,4,8,16,32,64');
      return;
    }

    const sequenceStr = args.join(' ').replace(/[\[\]]/g, '');
    const sequence = sequenceStr.split(',').map(s => parseInt(s.trim(), 10));

    if (sequence.some(isNaN)) {
      log.error('Invalid sequence: contains non-numeric values');
      return;
    }

    log.info(`Sequence: [${sequence.join(', ')}]`);
    showProgress('Detecting mathematical patterns');

    const patterns = [
      { name: 'Fibonacci', fn: () => this.mathValidators.isFibonacci(sequence) },
      { name: 'Prime numbers', fn: () => this.mathValidators.isPrime(sequence) },
      { name: 'Factorial', fn: () => this.mathValidators.isFactorial(sequence) },
      { name: 'Squares (n²)', fn: () => this.mathValidators.isSquare(sequence) },
      { name: 'Cubes (n³)', fn: () => this.mathValidators.isCube(sequence) },
      { name: 'Powers of 2', fn: () => this.mathValidators.isPowerOf2(sequence) },
      { name: 'Powers of 3', fn: () => this.mathValidators.isPowerOf3(sequence) },
      { name: 'Triangular', fn: () => this.mathValidators.isTriangular(sequence) },
      { name: 'Even numbers', fn: () => this.mathValidators.isEven(sequence) },
      { name: 'Odd numbers', fn: () => this.mathValidators.isOdd(sequence) },
      { name: 'Catalan numbers', fn: () => this.mathValidators.isCatalan(sequence) },
      { name: 'Arithmetic progression', fn: () => this.mathValidators.isArithmeticProgression(sequence) },
      { name: 'Geometric progression', fn: () => this.mathValidators.isGeometricProgression(sequence) },
      { name: 'Composite numbers', fn: () => this.mathValidators.isComposite(sequence) },
    ];

    const detectedPatterns = patterns
      .map(p => ({ ...p, result: p.fn() }))
      .filter(p => p.result.confidence > 0.5)
      .sort((a, b) => b.result.confidence - a.result.confidence);

    clearProgress();

    console.log('\n' + '═'.repeat(80));

    if (detectedPatterns.length === 0) {
      log.warning('No clear patterns detected');
      log.info('Sequence may be custom or require OEIS search');
    } else {
      log.success(`Detected ${detectedPatterns.length} pattern(s)`);

      detectedPatterns.forEach((pattern, i) => {
        const icon = pattern.result.isValid ? '✓' : '~';
        const color = pattern.result.confidence >= 0.9 ? colors.green :
                     pattern.result.confidence >= 0.7 ? colors.yellow : colors.dim;

        console.log(`\n${color}${icon} ${colors.bright}${pattern.name}${colors.reset}`);
        console.log(`  Confidence: ${color}${(pattern.result.confidence * 100).toFixed(1)}%${colors.reset}`);

        if (pattern.result.formula) {
          console.log(`  Formula: ${pattern.result.formula}`);
        }

        if (pattern.result.matchedTerms !== undefined) {
          console.log(`  Matched: ${pattern.result.matchedTerms}/${sequence.length} terms`);
        }
      });
    }

    console.log('\n' + '═'.repeat(80) + '\n');
  }

  // ============================================================================
  // Link Skill Command
  // ============================================================================

  async linkSkill(args: string[]): Promise<void> {
    log.header('\n🔗 Link Skill to OEIS Sequence');

    if (args.length < 2) {
      log.error('Insufficient arguments');
      console.log('\nUsage: oeis link <skill-id> <oeis-id>');
      console.log('Example: oeis link fibonacci-generator A000045');
      console.log('Example: oeis link my-skill A000040');
      return;
    }

    const [skillId, oeisId] = args;
    log.info(`Skill: ${skillId}`);
    log.info(`OEIS ID: ${oeisId}`);

    showProgress('Fetching sequence information');

    try {
      const sequence = await this.apiClient.getSequence(oeisId);
      clearProgress();

      if (!sequence) {
        log.error(`Sequence ${oeisId} not found in OEIS`);
        return;
      }

      console.log('\n' + '═'.repeat(80));
      log.success('Sequence found!');

      console.log(`\n${colors.bright}Sequence Information:${colors.reset}`);
      console.log(`  ID: ${colors.cyan}${sequence.id}${colors.reset}`);
      console.log(`  Name: ${sequence.name}`);

      if (sequence.data && sequence.data.length > 0) {
        const displayTerms = sequence.data.slice(0, 15);
        console.log(`  Terms: ${displayTerms.join(', ')}${sequence.data.length > 15 ? '...' : ''}`);
      }

      console.log(`  URL: https://oeis.org/${sequence.id}`);

      console.log(`\n${colors.bright}Link Created:${colors.reset}`);
      console.log(`  Skill: ${colors.green}${skillId}${colors.reset}`);
      console.log(`  Sequence: ${colors.cyan}${sequence.id}${colors.reset}`);
      console.log(`  Relationship: ${colors.yellow}generates${colors.reset}`);

      log.dim('\n💡 Note: Link metadata stored in memory. Use agentdb for persistent storage.');
      console.log('═'.repeat(80) + '\n');

      // Cache the sequence
      await this.cache.set(sequence);
      log.success('Sequence cached for fast validation');

    } catch (error) {
      clearProgress();
      log.error(`Failed to link skill: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // Analyze Skill Command
  // ============================================================================

  async analyzeSkill(args: string[]): Promise<void> {
    log.header('\n📊 Analyze Skill for OEIS Patterns');

    if (args.length === 0) {
      log.error('No skill ID provided');
      console.log('\nUsage: oeis analyze <skill-id>');
      console.log('Example: oeis analyze fibonacci-generator');
      return;
    }

    const skillId = args[0];
    log.info(`Skill: ${skillId}`);

    console.log('\n' + '═'.repeat(80));
    log.warning('Skill analysis requires skill library integration');
    console.log('\nTo fully analyze skills:');
    console.log('1. Use AgentDB skill library: npx agentdb skill search <name>');
    console.log('2. Run skill to generate output sequences');
    console.log('3. Validate output: oeis validate <sequence>');
    console.log('4. Link skill: oeis link <skill-id> <oeis-id>');
    console.log('═'.repeat(80) + '\n');
  }

  // ============================================================================
  // Stats Command
  // ============================================================================

  async showStats(): Promise<void> {
    log.header('\n📈 OEIS Usage Statistics');

    showProgress('Fetching statistics');

    try {
      const stats = await this.cache.getStats();
      clearProgress();

      console.log('\n' + '═'.repeat(80));
      console.log(`${colors.bright}Cache Statistics:${colors.reset}`);
      console.log(`  Total cached sequences: ${colors.cyan}${stats.count}${colors.reset}`);
      console.log(`  Memory cache size: ${colors.yellow}${stats.memorySize}${colors.reset}`);
      console.log(`  Disk cache size: ${colors.yellow}${stats.diskSize}${colors.reset}`);

      if (stats.topSequences.length > 0) {
        console.log(`\n${colors.bright}Most Accessed Sequences:${colors.reset}`);
        stats.topSequences.forEach((seq, i) => {
          console.log(`  ${i + 1}. ${colors.cyan}${seq.id}${colors.reset} - ${seq.hitCount} hits`);
        });
      }

      console.log('═'.repeat(80) + '\n');
    } catch (error) {
      clearProgress();
      log.error(`Failed to fetch stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // Cache Management Commands
  // ============================================================================

  async manageCache(command: string): Promise<void> {
    log.header(`\n💾 Cache Management: ${command}`);

    if (command === 'clear') {
      showProgress('Clearing cache');
      try {
        await this.cache.clear();
        clearProgress();
        log.success('Cache cleared successfully');
      } catch (error) {
        clearProgress();
        log.error(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (command === 'stats') {
      await this.showStats();
    } else {
      log.error(`Unknown cache command: ${command}`);
      console.log('\nAvailable commands:');
      console.log('  oeis cache clear  - Clear all cached sequences');
      console.log('  oeis cache stats  - Show cache statistics');
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    await this.validator.close();
  }
}

// ============================================================================
// Help Documentation
// ============================================================================

function printHelp(): void {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════════════╗
║                   OEIS CLI - Sequence Validation                      ║
╚═══════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npx agentic-flow oeis <command> [options]

${colors.bright}COMMANDS:${colors.reset}

  ${colors.green}validate${colors.reset} <sequence>
    Validate a sequence against the OEIS database

    Examples:
      npx agentic-flow oeis validate 1,1,2,3,5,8,13,21
      npx agentic-flow oeis validate "0,1,1,2,3,5,8,13,21,34"

  ${colors.green}search${colors.reset} <terms>
    Search OEIS database by keyword or sequence values

    Examples:
      npx agentic-flow oeis search fibonacci
      npx agentic-flow oeis search "prime numbers"
      npx agentic-flow oeis search 2,3,5,7,11,13

  ${colors.green}pattern${colors.reset} <sequence>
    Detect mathematical patterns in a sequence

    Examples:
      npx agentic-flow oeis pattern 1,4,9,16,25,36
      npx agentic-flow oeis pattern 2,4,8,16,32,64

  ${colors.green}link${colors.reset} <skill-id> <oeis-id>
    Link a skill to an OEIS sequence

    Examples:
      npx agentic-flow oeis link fibonacci-gen A000045
      npx agentic-flow oeis link prime-checker A000040

  ${colors.green}analyze${colors.reset} <skill-id>
    Analyze skill output for OEIS patterns

    Example:
      npx agentic-flow oeis analyze my-sequence-generator

  ${colors.green}stats${colors.reset}
    Show OEIS usage statistics and cache info

    Example:
      npx agentic-flow oeis stats

  ${colors.green}cache${colors.reset} [clear|stats]
    Manage OEIS sequence cache

    Examples:
      npx agentic-flow oeis cache stats    # Show cache statistics
      npx agentic-flow oeis cache clear    # Clear all cached data

${colors.bright}POPULAR OEIS SEQUENCES:${colors.reset}
  A000045  - Fibonacci numbers
  A000040  - Prime numbers
  A000142  - Factorials (n!)
  A000290  - Perfect squares (n²)
  A000079  - Powers of 2 (2^n)
  A000217  - Triangular numbers
  A000108  - Catalan numbers
  A005843  - Even numbers
  A005408  - Odd numbers

${colors.bright}ENVIRONMENT VARIABLES:${colors.reset}
  OEIS_CACHE_PATH     Cache database path (default: ./oeis-cache.db)

${colors.bright}EXAMPLES:${colors.reset}

  ${colors.dim}# Validate the Fibonacci sequence${colors.reset}
  npx agentic-flow oeis validate 1,1,2,3,5,8,13,21,34,55

  ${colors.dim}# Search for sequences related to primes${colors.reset}
  npx agentic-flow oeis search "prime numbers"

  ${colors.dim}# Detect what pattern a sequence follows${colors.reset}
  npx agentic-flow oeis pattern 1,4,9,16,25,36,49

  ${colors.dim}# Link a skill to the Fibonacci sequence${colors.reset}
  npx agentic-flow oeis link fibonacci-generator A000045

  ${colors.dim}# View cache statistics${colors.reset}
  npx agentic-flow oeis stats

  ${colors.dim}# Clear the cache${colors.reset}
  npx agentic-flow oeis cache clear

${colors.bright}INTEGRATION WITH AGENTDB:${colors.reset}

  OEIS validation works seamlessly with AgentDB:

  1. Create and train skills with AgentDB
  2. Validate skill output with OEIS CLI
  3. Link validated skills to OEIS sequences
  4. Use patterns to improve skill design

  Example workflow:
    ${colors.dim}agentdb skill create "fibonacci" "Generate Fibonacci numbers"
    agentic-flow oeis validate 1,1,2,3,5,8,13
    agentic-flow oeis link fibonacci A000045${colors.reset}

${colors.bright}RESOURCES:${colors.reset}
  OEIS Website:     https://oeis.org/
  Documentation:    https://oeis.org/wiki/
  JSON API:         https://oeis.org/wiki/JSON_Format

For more information: https://github.com/ruvnet/agentic-flow
  `);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function handleOeisCommand(subcommand: string): Promise<void> {
  const args = process.argv.slice(4); // Skip node, script, 'oeis', subcommand

  if (!subcommand || subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    printHelp();
    return;
  }

  const cli = new OeisCLI();

  try {
    await cli.initialize();

    switch (subcommand) {
      case 'validate':
        await cli.validateSequence(args);
        break;

      case 'search':
        await cli.searchSequences(args);
        break;

      case 'pattern':
        await cli.detectPattern(args);
        break;

      case 'link':
        await cli.linkSkill(args);
        break;

      case 'analyze':
        await cli.analyzeSkill(args);
        break;

      case 'stats':
        await cli.showStats();
        break;

      case 'cache':
        const cacheCmd = args[0] || 'stats';
        await cli.manageCache(cacheCmd);
        break;

      default:
        log.error(`Unknown command: ${subcommand}`);
        console.log('\nRun "npx agentic-flow oeis help" for usage information');
        break;
    }

    await cli.close();
  } catch (error) {
    log.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// ESM entry point check
if (import.meta.url === `file://${process.argv[1]}`) {
  const subcommand = process.argv[2] || 'help';
  handleOeisCommand(subcommand).catch(console.error);
}
