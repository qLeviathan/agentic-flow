/**
 * Bates Numbering Specialist - Evidence Coordinator
 * Castillo v. Schwab & Sedgwick
 *
 * Monitors extraction completion and orchestrates Bates numbering for all evidence
 * 2-day deadline: Process all extracted files immediately after extraction agent completion
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import EvidenceProcessor from './evidence-processor';

interface BatesCoordinationConfig {
  evidenceRawDir: string;
  evidenceProcDir: string;
  catalogJsonPath: string;
  catalogMarkdownPath: string;
  maxRetries: number;
  retryIntervalMs: number;
  enableOCR: boolean;
  prefix: string;
  paddingLength: number;
}

class BatesCoordinator {
  private config: BatesCoordinationConfig;
  private monitoringActive: boolean = false;
  private startTime: Date;

  constructor(config: Partial<BatesCoordinationConfig> = {}) {
    this.config = {
      evidenceRawDir: config.evidenceRawDir || './docs/pro-se-platform/evidence-raw',
      evidenceProcDir: config.evidenceProcDir || './docs/pro-se-platform/evidence',
      catalogJsonPath: config.catalogJsonPath || './docs/pro-se-platform/evidence/catalog.json',
      catalogMarkdownPath: config.catalogMarkdownPath || './docs/pro-se-platform/evidence/BATES-CATALOG.md',
      maxRetries: config.maxRetries || 1440, // 24 hours with 1-minute intervals
      retryIntervalMs: config.retryIntervalMs || 60000,
      enableOCR: config.enableOCR !== false,
      prefix: config.prefix || 'CAST',
      paddingLength: config.paddingLength || 4
    };
    this.startTime = new Date();
  }

  /**
   * Check if extraction is complete via memory signal
   */
  private async checkExtractionStatus(): Promise<boolean> {
    try {
      const result = execSync('npx claude-flow@alpha memory retrieve --key "evidence/extraction-status" --namespace "evidence"', {
        encoding: 'utf-8'
      });

      if (result && result.includes('complete') || result.includes('success') || result.includes('done')) {
        return true;
      }
    } catch (error) {
      // Memory key might not exist yet
    }
    return false;
  }

  /**
   * Check if raw evidence files exist
   */
  private hasExtractedFiles(): boolean {
    try {
      const files = fs.readdirSync(this.config.evidenceRawDir, { withFileTypes: true });
      const fileCount = files.filter(f => f.isFile()).length;
      return fileCount > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitor for extraction completion
   */
  async monitorExtraction(timeoutMinutes: number = 1440): Promise<boolean> {
    this.monitoringActive = true;
    const maxWaitMs = timeoutMinutes * 60 * 1000;
    const startMs = Date.now();

    console.log('\n📊 BATES NUMBERING SPECIALIST - MONITORING EXTRACTION');
    console.log('=' .repeat(70));
    console.log(`Case: Castillo v. Schwab & Sedgwick`);
    console.log(`Prefix: ${this.config.prefix}`);
    console.log(`Monitoring Directory: ${this.config.evidenceRawDir}`);
    console.log(`Timeout: ${timeoutMinutes} minutes (${Math.floor(timeoutMinutes / 60)} hours)`);
    console.log(`Listening for completion signal...\n`);

    let retryCount = 0;

    while (retryCount < this.config.maxRetries && !this.monitoringActive === false) {
      const elapsedMs = Date.now() - startMs;

      // Check for extraction completion
      const extractionComplete = await this.checkExtractionStatus();
      const filesExtracted = this.hasExtractedFiles();

      if (extractionComplete || filesExtracted) {
        console.log('\n✅ EXTRACTION COMPLETE - BATES PROCESSING INITIATED');
        console.log('-' .repeat(70));
        return true;
      }

      // Log status every 5 minutes
      if (retryCount % 5 === 0) {
        const elapsedMin = Math.floor(elapsedMs / 60000);
        console.log(`⏳ Monitoring... [${elapsedMin}m elapsed | Attempt ${retryCount + 1}/${this.config.maxRetries}]`);
      }

      // Check timeout
      if (elapsedMs > maxWaitMs) {
        console.log(`\n⚠️  TIMEOUT REACHED - ${timeoutMinutes} minutes`);
        return false;
      }

      retryCount++;
      await this.sleep(this.config.retryIntervalMs);
    }

    return false;
  }

  /**
   * Process all extracted evidence and assign Bates numbers
   */
  async processBatesNumbers(): Promise<any> {
    console.log('\n🏛️  PROCESSING BATES NUMBERS');
    console.log('=' .repeat(70));

    const processor = new EvidenceProcessor({
      prefix: this.config.prefix,
      startNumber: 1,
      paddingLength: this.config.paddingLength
    });

    // Process all files in evidence-raw directory
    console.log(`\n📁 Scanning: ${this.config.evidenceRawDir}`);
    const items = await processor.processDirectory(this.config.evidenceRawDir);

    if (items.length === 0) {
      console.log('\n⚠️  NO FILES FOUND - Evidence extraction may still be in progress');
      return null;
    }

    console.log(`\n✓ Processed ${items.length} files`);

    // Export catalogs
    console.log('\n📋 GENERATING CATALOGS');
    console.log('-' .repeat(70));
    processor.exportCatalog(this.config.catalogJsonPath);
    processor.exportMarkdownCatalog(this.config.catalogMarkdownPath);

    // Get statistics
    const stats = processor.getStats();
    return stats;
  }

  /**
   * Store Bates processing completion in memory
   */
  async storeCompletionStatus(stats: any): Promise<void> {
    if (!stats) {
      console.log('\n⚠️  No statistics to store (no files processed)');
      return;
    }

    console.log('\n💾 STORING COMPLETION STATUS IN MEMORY');
    console.log('-' .repeat(70));

    const completionData = {
      timestamp: new Date().toISOString(),
      batesRange: {
        first: stats.batesRange.first,
        last: stats.batesRange.last,
        total: stats.totalItems
      },
      totalSize: stats.totalSize,
      fileTypes: stats.fileTypes,
      parties: stats.parties,
      catalogJsonPath: this.config.catalogJsonPath,
      catalogMarkdownPath: this.config.catalogMarkdownPath,
      status: 'complete'
    };

    try {
      const jsonString = JSON.stringify(completionData).replace(/"/g, '\\"');
      execSync(`npx claude-flow@alpha memory store --key "evidence/bates-complete" --namespace "evidence" --value "${jsonString}"`, {
        encoding: 'utf-8'
      });
      console.log('✓ Stored: evidence/bates-complete');
    } catch (error) {
      console.error('Failed to store completion status:', error);
    }
  }

  /**
   * Generate completion report
   */
  generateReport(stats: any): string {
    if (!stats) {
      return 'No Bates numbering completed - waiting for extraction.';
    }

    const report = `
╔════════════════════════════════════════════════════════════════════╗
║            BATES NUMBERING COMPLETION REPORT                       ║
║          Castillo v. Schwab & Sedgwick                             ║
╚════════════════════════════════════════════════════════════════════╝

BATES RANGE: ${stats.batesRange.first} → ${stats.batesRange.last}
TOTAL ITEMS: ${stats.totalItems}

STATISTICS:
  • Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB
  • File Types: ${Object.keys(stats.fileTypes).length}
  • Parties Identified: ${Object.keys(stats.parties).length}

FILE TYPES BREAKDOWN:
${Object.entries(stats.fileTypes).map(([type, count]: any) => `  • ${type}: ${count} files`).join('\n')}

PARTIES IDENTIFIED:
${Object.entries(stats.parties).map(([party, count]: any) => `  • ${party}: ${count} occurrences`).join('\n')}

OUTPUT FILES:
  ✓ ${this.config.catalogJsonPath}
  ✓ ${this.config.catalogMarkdownPath}

NEXT STEPS:
  1. Review Bates catalog for accuracy
  2. Verify party identification
  3. Validate hash integrity for all items
  4. Coordinate with fact-checker for evidence verification
  5. Prepare for litigation filing
`;

    return report;
  }

  /**
   * Initialize Bates numbering system
   */
  async initialize(): Promise<void> {
    console.log('\n🚀 INITIALIZING BATES NUMBERING SPECIALIST');
    console.log('=' .repeat(70));
    console.log('Case: Castillo v. Schwab & Sedgwick');
    console.log('Prefix: CAST');
    console.log('Padding: 4 digits (CAST-0001, CAST-0002, etc.)');
    console.log('Deadline: 2 days');
    console.log('');

    // Ensure directories exist
    if (!fs.existsSync(this.config.evidenceRawDir)) {
      fs.mkdirSync(this.config.evidenceRawDir, { recursive: true });
      console.log(`✓ Created: ${this.config.evidenceRawDir}`);
    }

    if (!fs.existsSync(this.config.evidenceProcDir)) {
      fs.mkdirSync(this.config.evidenceProcDir, { recursive: true });
      console.log(`✓ Created: ${this.config.evidenceProcDir}`);
    }

    console.log('✓ System initialized and ready');
  }

  /**
   * Run complete pipeline
   */
  async runPipeline(timeoutMinutes?: number): Promise<void> {
    await this.initialize();

    // Monitor for extraction
    const extracted = await this.monitorExtraction(timeoutMinutes);

    if (!extracted) {
      console.log('\n⚠️  EXTRACTION NOT COMPLETED - Pipeline paused');
      console.log('Waiting for extraction agent to complete and signal completion.');
      return;
    }

    // Process Bates numbers
    const stats = await this.processBatesNumbers();

    // Store completion status
    if (stats) {
      await this.storeCompletionStatus(stats);
    }

    // Generate and display report
    const report = this.generateReport(stats);
    console.log(report);

    // Write report to file
    const reportPath = path.join(this.config.evidenceProcDir, 'BATES-PROCESSING-REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  /**
   * Helper sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function main() {
  const coordinator = new BatesCoordinator({
    evidenceRawDir: './docs/pro-se-platform/evidence-raw',
    evidenceProcDir: './docs/pro-se-platform/evidence',
    catalogJsonPath: './docs/pro-se-platform/evidence/catalog.json',
    catalogMarkdownPath: './docs/pro-se-platform/evidence/BATES-CATALOG.md',
    maxRetries: 1440, // 24 hours
    retryIntervalMs: 60000, // 1 minute
    enableOCR: true
  });

  const timeoutMinutes = parseInt(process.argv[2]) || 1440; // Default 24 hours
  await coordinator.runPipeline(timeoutMinutes);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default BatesCoordinator;
