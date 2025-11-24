/**
 * Raw Evidence Processor
 * Processes raw evidence files from evidence-raw/ directory and adds them to catalog
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface RawEvidenceItem {
  batesNumber: string;
  originalPath: string;
  filename: string;
  fileType: string;
  dateCreated: Date;
  dateModified: Date;
  hash: string;
  size: number;
  parties: string[];
  content: string;
  metadata: Record<string, any>;
}

export class RawEvidenceProcessor {
  private baseDir = '/home/user/agentic-flow/docs/pro-se-platform';
  private batesCounter = 0;
  private knownParties = [
    'Castillo', 'Marc Castillo',
    'Babchuk', 'Jennifer Babchuk',
    'Egorov', 'Andrei Egorov',
    'Soulis', 'Daphne Soulis',
    'Bristow', 'John Bristow',
    'Huffner', 'Jackie Huffner',
    'Hicks', 'Jennifer Hicks',
    'Tapia', 'Anthony Tapia',
    'Sedgwick', 'Sedgwick Claims',
    'Schwab', 'Charles Schwab',
    'Fowler', 'Sara Fowler'
  ];

  /**
   * Process all raw evidence files
   */
  processRawEvidence(): RawEvidenceItem[] {
    console.log('🔄 Processing raw evidence files...\n');

    const rawDir = path.join(this.baseDir, 'evidence-raw');
    const catalogPath = path.join(this.baseDir, 'evidence/catalog.json');

    // Load existing catalog to determine next Bates number
    let existingCatalog: RawEvidenceItem[] = [];
    if (fs.existsSync(catalogPath)) {
      existingCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      this.batesCounter = this.getNextBatesNumber(existingCatalog);
      console.log(`📋 Existing catalog has ${existingCatalog.length} items`);
      console.log(`   Next Bates number: CAST-${String(this.batesCounter).padStart(4, '0')}\n`);
    }

    // Process raw files
    const files = fs.readdirSync(rawDir);
    const newItems: RawEvidenceItem[] = [];

    for (const file of files) {
      const filePath = path.join(rawDir, file);
      const stats = fs.statSync(filePath);

      // Skip directories
      if (stats.isDirectory()) continue;

      console.log(`Processing: ${file}`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // Check if already in catalog (by hash)
      const existingItem = existingCatalog.find(item => item.hash === hash);
      if (existingItem) {
        console.log(`  ⏭️  Already in catalog as ${existingItem.batesNumber}\n`);
        continue;
      }

      // Create new evidence item
      const batesNumber = `CAST-${String(this.batesCounter++).padStart(4, '0')}`;
      const item: RawEvidenceItem = {
        batesNumber,
        originalPath: file,
        filename: file,
        fileType: path.extname(file),
        dateCreated: stats.birthtime,
        dateModified: stats.mtime,
        hash,
        size: stats.size,
        parties: this.extractParties(content),
        content,
        metadata: {
          processed: new Date().toISOString(),
          sourceFolder: 'evidence-raw',
          fileType: this.inferFileType(file, content)
        }
      };

      newItems.push(item);
      console.log(`  ✓ Created ${batesNumber}`);
      console.log(`    Parties: ${item.parties.join(', ')}`);
      console.log(`    Type: ${item.metadata.fileType}\n`);
    }

    if (newItems.length > 0) {
      // Merge with existing catalog
      const updatedCatalog = [...existingCatalog, ...newItems];

      // Sort by Bates number
      updatedCatalog.sort((a, b) => a.batesNumber.localeCompare(b.batesNumber));

      // Write updated catalog
      fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2));
      console.log(`\n✅ Processed ${newItems.length} new evidence items`);
      console.log(`📁 Updated catalog: ${catalogPath}`);
      console.log(`📊 Total items in catalog: ${updatedCatalog.length}`);

      // Generate processing report
      this.generateProcessingReport(newItems, updatedCatalog.length);
    } else {
      console.log('\n✓ No new evidence to process (all files already in catalog)');
    }

    return newItems;
  }

  /**
   * Extract party names from content
   */
  private extractParties(content: string): string[] {
    const parties: Set<string> = new Set();

    for (const party of this.knownParties) {
      // Case-insensitive search
      const regex = new RegExp(party, 'gi');
      if (regex.test(content)) {
        parties.add(party);
      }
    }

    return Array.from(parties);
  }

  /**
   * Infer file type from filename and content
   */
  private inferFileType(filename: string, content: string): string {
    const lower = filename.toLowerCase();
    const contentLower = content.toLowerCase();

    if (lower.includes('email') || contentLower.includes('from:') && contentLower.includes('to:')) {
      return 'email';
    }
    if (lower.includes('medical') || lower.includes('doctor') || contentLower.includes('diagnosis')) {
      return 'medical';
    }
    if (lower.includes('sedgwick') || contentLower.includes('sedgwick')) {
      return 'sedgwick_document';
    }
    if (lower.includes('eeoc') || contentLower.includes('equal employment')) {
      return 'eeoc_filing';
    }
    if (lower.includes('fmla') || contentLower.includes('family and medical leave')) {
      return 'fmla_document';
    }
    if (lower.includes('policy') || contentLower.includes('company policy')) {
      return 'policy_document';
    }
    if (lower.includes('timeline') || lower.includes('events')) {
      return 'timeline';
    }
    if (lower.includes('denial') || contentLower.includes('denied')) {
      return 'denial_letter';
    }

    return 'general_document';
  }

  /**
   * Get next Bates number from existing catalog
   */
  private getNextBatesNumber(catalog: RawEvidenceItem[]): number {
    if (catalog.length === 0) return 1;

    const lastBates = catalog[catalog.length - 1].batesNumber;
    const match = lastBates.match(/CAST-(\d+)/);
    if (match) {
      return parseInt(match[1], 10) + 1;
    }

    return 1;
  }

  /**
   * Generate processing report
   */
  private generateProcessingReport(newItems: RawEvidenceItem[], totalCount: number): void {
    const reportPath = path.join(this.baseDir, 'evidence/RAW-EVIDENCE-PROCESSING-REPORT.md');

    let report = '# Raw Evidence Processing Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**New Items Processed:** ${newItems.length}\n`;
    report += `**Total Catalog Items:** ${totalCount}\n\n`;

    report += '## Newly Processed Evidence\n\n';
    report += '| Bates Number | Filename | Type | Parties | Size |\n';
    report += '|--------------|----------|------|---------|------|\n';

    for (const item of newItems) {
      const parties = item.parties.length > 0 ? item.parties.join(', ') : 'None detected';
      const sizeKB = (item.size / 1024).toFixed(2);

      report += `| ${item.batesNumber} | ${item.filename} | ${item.metadata.fileType} | ${parties} | ${sizeKB} KB |\n`;
    }

    report += '\n## Processing Summary\n\n';

    // Count by type
    const typeCount = new Map<string, number>();
    for (const item of newItems) {
      const type = item.metadata.fileType;
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    }

    report += '### Documents by Type\n\n';
    for (const [type, count] of typeCount) {
      report += `- **${type}:** ${count} document(s)\n`;
    }

    report += '\n### Party Involvement\n\n';

    // Count party mentions
    const partyCount = new Map<string, number>();
    for (const item of newItems) {
      for (const party of item.parties) {
        partyCount.set(party, (partyCount.get(party) || 0) + 1);
      }
    }

    // Sort by count
    const sortedParties = Array.from(partyCount.entries())
      .sort((a, b) => b[1] - a[1]);

    for (const [party, count] of sortedParties) {
      report += `- **${party}:** ${count} document(s)\n`;
    }

    report += '\n## Details\n\n';

    for (const item of newItems) {
      report += `### ${item.batesNumber}: ${item.filename}\n\n`;
      report += `- **Type:** ${item.metadata.fileType}\n`;
      report += `- **Hash:** ${item.hash}\n`;
      report += `- **Size:** ${item.size} bytes\n`;
      report += `- **Date Modified:** ${item.dateModified.toISOString()}\n`;
      report += `- **Parties:** ${item.parties.join(', ') || 'None detected'}\n`;
      report += `- **Content Preview:**\n\n`;
      report += '```\n';
      report += item.content.substring(0, 300);
      if (item.content.length > 300) report += '...';
      report += '\n```\n\n';
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Processing report saved: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  console.log('⚖️  Raw Evidence Processor');
  console.log('='.repeat(70));
  console.log();

  const processor = new RawEvidenceProcessor();
  processor.processRawEvidence();

  console.log('\n' + '='.repeat(70));
  console.log('✅ Processing complete!');
}

export default RawEvidenceProcessor;
