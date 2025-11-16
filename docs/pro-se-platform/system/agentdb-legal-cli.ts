#!/usr/bin/env node

/**
 * Pro Se Platform - AgentDB Legal CLI
 * Castillo v. Schwab & Sedgwick
 *
 * Command-line interface for legal evidence database
 */

import { Command } from 'commander';
import * as readline from 'readline';
import * as chalk from 'chalk';
import { LegalQueryInterface } from './query-interface';
import * as dotenv from 'dotenv';
import { table } from 'table';

dotenv.config();

// ============================================================================
// CLI PROGRAM
// ============================================================================

const program = new Command();

program
  .name('agentdb-legal')
  .description('AgentDB Legal Assistant - Castillo v. Schwab & Sedgwick')
  .version('1.0.0');

// Database path
const DB_PATH = process.env.AGENTDB_PATH || './pro-se-castillo.db';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

// Initialize query interface
const queryInterface = new LegalQueryInterface(DB_PATH, CLAUDE_API_KEY);

// ============================================================================
// SEARCH COMMAND
// ============================================================================

program
  .command('search')
  .description('Search evidence by keyword')
  .argument('<keyword>', 'Search term')
  .option('-l, --limit <number>', 'Maximum results', '20')
  .option('-s, --semantic', 'Use semantic search (requires API key)')
  .option('-c, --content', 'Include content preview')
  .action(async (keyword, options) => {
    try {
      console.log(chalk.blue(`\n🔍 Searching for: "${keyword}"\n`));

      let results;
      if (options.semantic) {
        results = await queryInterface.semanticSearch(keyword, {
          limit: parseInt(options.limit),
          includeContent: options.content
        });
      } else {
        results = await queryInterface.searchEvidence(keyword, {
          limit: parseInt(options.limit),
          includeContent: options.content
        });
      }

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      console.log(chalk.green(`Found ${results.length} results:\n`));

      for (const result of results) {
        console.log(chalk.bold(`${result.bates_id}`) + ` - ${result.original_filename}`);
        console.log(`  Date: ${new Date(result.date_modified).toLocaleDateString()}`);
        console.log(`  Type: ${result.file_type}`);
        console.log(`  Parties: ${result.parties.join(', ')}`);
        console.log(`  Relevance: ${result.legal_relevance?.join(', ') || 'N/A'}`);

        if (result.relevance_score) {
          console.log(`  Score: ${(result.relevance_score * 100).toFixed(1)}%`);
        }

        if (options.content && result.content_text) {
          const preview = result.content_text.substring(0, 200);
          console.log(chalk.dim(`  Preview: ${preview}...`));
        }

        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('Search failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// TIMELINE COMMAND
// ============================================================================

program
  .command('timeline')
  .description('Query timeline events')
  .option('-f, --from <date>', 'Start date (YYYY-MM-DD)')
  .option('-t, --to <date>', 'End date (YYYY-MM-DD)')
  .option('-p, --phase <phase>', 'Filter by phase')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (options) => {
    try {
      const fromDate = options.from ? new Date(options.from) : new Date('2024-01-01');
      const toDate = options.to ? new Date(options.to) : new Date();

      console.log(chalk.blue(`\n📅 Timeline: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}\n`));

      const events = await queryInterface.timelineQuery(fromDate, toDate);

      if (events.length === 0) {
        console.log(chalk.yellow('No events found in date range.'));
        return;
      }

      // Filter by phase/category if specified
      let filtered = events;
      if (options.phase) {
        filtered = filtered.filter(e => e.phase === options.phase);
      }
      if (options.category) {
        filtered = filtered.filter(e => e.category === options.category);
      }

      console.log(chalk.green(`Found ${filtered.length} events:\n`));

      for (const event of filtered) {
        const date = new Date(event.event_date).toLocaleDateString();
        const time = event.event_time || '';

        console.log(chalk.bold(`[${date} ${time}]`) + ` ${event.event_title}`);
        console.log(`  Phase: ${event.phase} | Category: ${event.category}`);
        console.log(`  Claims: ${event.claim_types?.join(', ') || 'N/A'}`);
        console.log(`  Parties: ${event.parties.join(', ')}`);

        if (event.evidence_bates?.length > 0) {
          console.log(`  Evidence: ${event.evidence_bates.join(', ')}`);
        }

        if (event.description) {
          console.log(chalk.dim(`  ${event.description}`));
        }

        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('Timeline query failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// VALIDATE-CLAIM COMMAND
// ============================================================================

program
  .command('validate-claim')
  .description('Validate a legal claim')
  .argument('<claim-type>', 'Claim type (e.g., "ADA Retaliation")')
  .action(async (claimType) => {
    try {
      console.log(chalk.blue(`\n⚖️  Validating claim: ${claimType}\n`));

      const validation = await queryInterface.validateClaim(claimType);

      console.log(chalk.bold('Claim Details:'));
      console.log(`  Type: ${validation.claim.claim_type}`);
      console.log(`  Statute: ${validation.claim.statute}`);
      console.log(`  Status: ${validation.claim.status}`);
      console.log(`  Strength Score: ${(validation.claim.strength_score * 100).toFixed(1)}%`);
      console.log(`  Fact Checked: ${validation.claim.fact_checked ? 'Yes' : 'No'}`);
      console.log('');

      console.log(chalk.bold('Evidence Analysis:'));
      console.log(`  Supporting Evidence: ${validation.evidence_count} items`);

      if (validation.claim.supporting_evidence?.length > 0) {
        console.log(`  Bates Numbers: ${validation.claim.supporting_evidence.join(', ')}`);
      }
      console.log('');

      if (validation.missing_elements.length > 0) {
        console.log(chalk.yellow('Missing Elements:'));
        validation.missing_elements.forEach(elem => {
          console.log(`  ❌ ${elem}`);
        });
        console.log('');
      }

      // Recommendation with color coding
      const recColor = validation.recommendation.startsWith('STRONG')
        ? chalk.green
        : validation.recommendation.startsWith('WEAK')
        ? chalk.yellow
        : chalk.red;

      console.log(chalk.bold('Recommendation:'));
      console.log(recColor(`  ${validation.recommendation}`));
      console.log('');

    } catch (error) {
      console.error(chalk.red('Claim validation failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// FIND-BATES COMMAND
// ============================================================================

program
  .command('find-bates')
  .description('Find evidence by Bates number')
  .argument('<bates-id>', 'Bates number (e.g., CAST-0042)')
  .option('-r, --related', 'Show related evidence')
  .action(async (batesId, options) => {
    try {
      console.log(chalk.blue(`\n🔎 Looking up: ${batesId}\n`));

      const evidence = await queryInterface.findByBates(batesId);

      if (!evidence) {
        console.log(chalk.red(`Evidence not found: ${batesId}`));
        return;
      }

      console.log(chalk.bold('Evidence Details:'));
      console.log(`  Bates Number: ${evidence.bates_id}`);
      console.log(`  Filename: ${evidence.original_filename}`);
      console.log(`  File Type: ${evidence.file_type}`);
      console.log(`  Date Modified: ${new Date(evidence.date_modified).toLocaleDateString()}`);
      console.log(`  Parties: ${evidence.parties.join(', ')}`);
      console.log(`  Legal Relevance: ${evidence.legal_relevance?.join(', ') || 'N/A'}`);
      console.log('');

      if (evidence.content_text) {
        console.log(chalk.bold('Content Preview:'));
        console.log(chalk.dim(evidence.content_text.substring(0, 500)));
        console.log('');
      }

      if (options.related) {
        console.log(chalk.bold('Related Evidence:'));
        const related = await queryInterface.findRelatedEvidence(batesId);

        if (related.length === 0) {
          console.log(chalk.dim('  No related evidence found.'));
        } else {
          related.forEach(rel => {
            console.log(`  ${rel.bates_id} - ${rel.original_filename}`);
            console.log(chalk.dim(`    Parties: ${rel.parties.join(', ')}`));
          });
        }
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('Bates lookup failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// CORRELATE COMMAND
// ============================================================================

program
  .command('correlate')
  .description('Correlate medical events with employer actions')
  .argument('<type>', 'Correlation type: medical-events, sedgwick-anomalies')
  .option('-f, --from <date>', 'Start date (YYYY-MM-DD)')
  .option('-t, --to <date>', 'End date (YYYY-MM-DD)')
  .action(async (type, options) => {
    try {
      if (type === 'medical-events') {
        console.log(chalk.blue('\n🏥 Medical Event Correlation Analysis\n'));

        const dateRange = options.from && options.to ? {
          from: new Date(options.from),
          to: new Date(options.to)
        } : undefined;

        const correlations = await queryInterface.correlateMedicalEvents({ dateRange });

        if (correlations.length === 0) {
          console.log(chalk.yellow('No correlations found.'));
          return;
        }

        console.log(chalk.green(`Found ${correlations.length} correlations:\n`));

        for (const corr of correlations) {
          const date = new Date(corr.medical.record_date).toLocaleDateString();

          console.log(chalk.bold(`${date} - ${corr.medical.provider}`));
          console.log(`  Type: ${corr.medical.record_type}`);
          console.log(`  Diagnosis: ${corr.medical.diagnosis.join(', ')}`);

          if (corr.medical.bp_reading) {
            console.log(`  BP Reading: ${corr.medical.bp_reading}`);
          }

          console.log(`  Correlation Score: ${corr.correlation_score}`);
          console.log(chalk.dim('  Concurrent Work Events:'));

          corr.workEvents.forEach(event => {
            console.log(chalk.dim(`    - ${event.event_title} (${event.category})`));
          });

          console.log('');
        }
      } else {
        console.log(chalk.red(`Unknown correlation type: ${type}`));
      }

    } catch (error) {
      console.error(chalk.red('Correlation analysis failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// SEDGWICK-ANOMALIES COMMAND
// ============================================================================

program
  .command('sedgwick-anomalies')
  .description('Find Sedgwick metadata anomalies')
  .option('-t, --type <type>', 'Filter by anomaly type')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🚨 Sedgwick Metadata Anomalies\n'));

      const anomalies = await queryInterface.sedgwickAnomalies(options.type);

      if (anomalies.length === 0) {
        console.log(chalk.green('No anomalies found.'));
        return;
      }

      console.log(chalk.red(`Found ${anomalies.length} anomalies:\n`));

      // Group by anomaly type
      const grouped = new Map<string, typeof anomalies>();

      for (const anomaly of anomalies) {
        for (const flag of anomaly.anomaly_flags) {
          if (!grouped.has(flag)) {
            grouped.set(flag, []);
          }
          grouped.get(flag)!.push(anomaly);
        }
      }

      for (const [type, items] of grouped) {
        console.log(chalk.bold.red(`\n${type.toUpperCase()} (${items.length} occurrences)`));

        for (const item of items.slice(0, 5)) { // Show first 5
          const date = new Date(item.dcn_date).toLocaleDateString();
          console.log(`  ${item.dcn} - ${date}`);
          console.log(`    User: ${item.user_id}`);
          console.log(`    Action: ${item.action_type}`);
          console.log(`    Bates: ${item.bates_id}`);
        }

        if (items.length > 5) {
          console.log(chalk.dim(`  ... and ${items.length - 5} more`));
        }
      }

      console.log('');

    } catch (error) {
      console.error(chalk.red('Sedgwick anomaly search failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// STATS COMMAND
// ============================================================================

program
  .command('stats')
  .description('Show database statistics')
  .action(async () => {
    try {
      console.log(chalk.blue('\n📊 Database Statistics\n'));

      const stats = await queryInterface.getStatistics();

      console.log(chalk.bold('Overview:'));
      console.log(`  Total Evidence Items: ${stats.total_evidence}`);
      console.log(`  Total Timeline Events: ${stats.total_events}`);
      console.log(`  Total Legal Claims: ${stats.total_claims}`);
      console.log('');

      console.log(chalk.bold('Evidence by Type:'));
      Object.entries(stats.evidence_by_type).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      console.log('');

      console.log(chalk.bold('Claims by Status:'));
      Object.entries(stats.claims_by_status).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      console.log('');

      console.log(chalk.bold('Date Range:'));
      console.log(`  Earliest: ${stats.date_range.earliest.toLocaleDateString()}`);
      console.log(`  Latest: ${stats.date_range.latest.toLocaleDateString()}`);
      console.log('');

    } catch (error) {
      console.error(chalk.red('Stats retrieval failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// CHAT COMMAND (Interactive Mode)
// ============================================================================

program
  .command('chat')
  .description('Interactive chat mode for natural language queries')
  .action(async () => {
    if (!CLAUDE_API_KEY) {
      console.log(chalk.red('Error: ANTHROPIC_API_KEY required for chat mode'));
      console.log(chalk.yellow('Set environment variable: export ANTHROPIC_API_KEY=your-key'));
      process.exit(1);
    }

    console.log(chalk.blue('\n💬 Interactive Chat Mode'));
    console.log(chalk.dim('Ask questions in natural language. Type "exit" to quit.\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('legal> ')
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const query = line.trim();

      if (query === 'exit' || query === 'quit') {
        console.log(chalk.blue('\nGoodbye!'));
        rl.close();
        process.exit(0);
      }

      if (!query) {
        rl.prompt();
        return;
      }

      try {
        console.log(chalk.dim('\nProcessing query...\n'));

        const result = await queryInterface.naturalLanguageQuery(query);

        console.log(chalk.bold('Interpretation:'));
        console.log(chalk.dim(result.interpretation));
        console.log('');

        if (result.sql_generated) {
          console.log(chalk.bold('SQL Generated:'));
          console.log(chalk.dim(result.sql_generated));
          console.log('');
        }

        console.log(chalk.bold('Results:'));
        if (result.results.length === 0) {
          console.log(chalk.yellow('No results found.'));
        } else {
          console.log(JSON.stringify(result.results, null, 2));
        }
        console.log('');

      } catch (error) {
        console.error(chalk.red('Query failed:'), error);
      }

      rl.prompt();
    });

    rl.on('close', () => {
      console.log(chalk.blue('\nGoodbye!'));
      process.exit(0);
    });
  });

// ============================================================================
// INIT COMMAND
// ============================================================================

program
  .command('init')
  .description('Initialize AgentDB database with schema')
  .action(async () => {
    try {
      console.log(chalk.blue('\n🚀 Initializing AgentDB database...\n'));

      const { execSync } = require('child_process');

      // Initialize database
      console.log('Creating database...');
      execSync('npx agentdb init --database pro-se-castillo', { stdio: 'inherit' });

      // Apply schema
      console.log('\nApplying schema...');
      execSync('npx agentdb schema apply ./docs/pro-se-platform/system/agentdb-schema.sql', {
        stdio: 'inherit'
      });

      console.log(chalk.green('\n✅ Database initialized successfully!'));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('  1. Run: agentdb-legal search "keyword"'));
      console.log(chalk.dim('  2. Run: agentdb-legal timeline --from 2024-01-01'));
      console.log(chalk.dim('  3. Run: agentdb-legal chat (requires API key)'));
      console.log('');

    } catch (error) {
      console.error(chalk.red('Initialization failed:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// MAIN EXECUTION
// ============================================================================

program.parse();
