/**
 * Pro Se Platform - Evidence Processing System
 * Castillo v. Schwab & Sedgwick
 *
 * Processes evidence from Google Drive into AgentDB with Bates numbering
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

interface EvidenceItem {
  batesNumber: string;
  originalPath: string;
  filename: string;
  fileType: string;
  dateCreated: Date;
  dateModified: Date;
  hash: string;
  size: number;
  parties: string[];
  content?: string;
  metadata: Record<string, any>;
}

interface BatesConfig {
  prefix: string; // "CAST"
  startNumber: number; // 1
  paddingLength: number; // 4 (e.g., CAST-0001)
}

export class EvidenceProcessor {
  private batesCounter: number = 1;
  private config: BatesConfig;
  private evidence: Map<string, EvidenceItem> = new Map();

  constructor(config: Partial<BatesConfig> = {}) {
    this.config = {
      prefix: config.prefix || 'CAST',
      startNumber: config.startNumber || 1,
      paddingLength: config.paddingLength || 4
    };
    this.batesCounter = this.config.startNumber;
  }

  /**
   * Generate next Bates number
   */
  private generateBatesNumber(): string {
    const number = String(this.batesCounter).padStart(this.config.paddingLength, '0');
    this.batesCounter++;
    return `${this.config.prefix}-${number}`;
  }

  /**
   * Compute SHA-256 hash of file
   */
  private computeHash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Extract text content based on file type
   */
  private async extractContent(filePath: string, fileType: string): Promise<string | undefined> {
    try {
      switch (fileType.toLowerCase()) {
        case '.txt':
        case '.md':
        case '.log':
          return fs.readFileSync(filePath, 'utf-8');

        case '.pdf':
          // Use pdftotext if available
          try {
            return execSync(`pdftotext "${filePath}" -`, { encoding: 'utf-8' });
          } catch {
            console.warn(`PDF extraction failed for ${filePath}`);
            return undefined;
          }

        case '.eml':
        case '.msg':
          // Email parsing - basic text extraction
          return fs.readFileSync(filePath, 'utf-8');

        case '.png':
        case '.jpg':
        case '.jpeg':
          // OCR would go here (tesseract)
          console.log(`OCR not implemented for ${filePath}`);
          return undefined;

        default:
          return undefined;
      }
    } catch (error) {
      console.error(`Content extraction failed for ${filePath}:`, error);
      return undefined;
    }
  }

  /**
   * Infer parties involved from filename and content
   */
  private inferParties(filename: string, content?: string): string[] {
    const parties: Set<string> = new Set();

    // Known parties from case
    const knownParties = [
      'Marc Castillo', 'Castillo', 'CP',
      'Jennifer Babchuk', 'Babchuk',
      'Andrei Egorov', 'Egorov',
      'Charlie Soulis', 'Soulis',
      'Kay Bristow', 'Bristow',
      'Taylor Huffner', 'Huffner',
      'Chrystal Hicks', 'Hicks',
      'Noel Tapia', 'Tapia',
      'Beth', 'Beth Cappeli',
      'Sedgwick', 'Sheri', 'Miriam', 'Theresa',
      'Schwab', 'Charles Schwab',
      'Sara Fowler', 'Fowler', 'Seyfarth',
      'EEOC', 'Lorna Steuer'
    ];

    // Check filename
    for (const party of knownParties) {
      if (filename.toLowerCase().includes(party.toLowerCase())) {
        parties.add(party);
      }
    }

    // Check content (basic search)
    if (content) {
      for (const party of knownParties) {
        const regex = new RegExp(party, 'gi');
        if (regex.test(content)) {
          parties.add(party);
        }
      }
    }

    return Array.from(parties);
  }

  /**
   * Process a single file
   */
  async processFile(filePath: string, relativePath: string): Promise<EvidenceItem> {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const fileType = path.extname(filePath);
    const hash = this.computeHash(filePath);
    const batesNumber = this.generateBatesNumber();

    // Extract content
    const content = await this.extractContent(filePath, fileType);

    // Infer parties
    const parties = this.inferParties(filename, content);

    const item: EvidenceItem = {
      batesNumber,
      originalPath: relativePath,
      filename,
      fileType,
      dateCreated: stats.birthtime,
      dateModified: stats.mtime,
      hash,
      size: stats.size,
      parties,
      content,
      metadata: {
        processed: new Date().toISOString(),
        sourceFolder: path.dirname(relativePath)
      }
    };

    this.evidence.set(batesNumber, item);
    return item;
  }

  /**
   * Recursively process directory
   */
  async processDirectory(dirPath: string, basePath: string = dirPath): Promise<EvidenceItem[]> {
    const results: EvidenceItem[] = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        // Recurse into subdirectory
        const subResults = await this.processDirectory(fullPath, basePath);
        results.push(...subResults);
      } else if (entry.isFile()) {
        // Process file
        const item = await this.processFile(fullPath, relativePath);
        results.push(item);
        console.log(`✓ ${item.batesNumber}: ${item.filename}`);
      }
    }

    return results;
  }

  /**
   * Export catalog to JSON
   */
  exportCatalog(outputPath: string): void {
    const catalog = Array.from(this.evidence.values()).map(item => ({
      ...item,
      // Truncate content for catalog
      content: item.content ? `${item.content.substring(0, 200)}...` : undefined
    }));

    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
    console.log(`Catalog exported to ${outputPath}`);
  }

  /**
   * Export catalog to Markdown table
   */
  exportMarkdownCatalog(outputPath: string): void {
    let markdown = '# Evidence Catalog - Castillo v. Schwab & Sedgwick\n\n';
    markdown += `**Generated:** ${new Date().toISOString()}\n`;
    markdown += `**Total Items:** ${this.evidence.size}\n\n`;
    markdown += '| Bates No. | Filename | Type | Date Modified | Parties | Hash |\n';
    markdown += '|-----------|----------|------|---------------|---------|------|\n';

    for (const item of this.evidence.values()) {
      const dateStr = item.dateModified.toISOString().split('T')[0];
      const parties = item.parties.join(', ') || 'Unknown';
      const hashShort = item.hash.substring(0, 8);
      markdown += `| ${item.batesNumber} | ${item.filename} | ${item.fileType} | ${dateStr} | ${parties} | ${hashShort}... |\n`;
    }

    fs.writeFileSync(outputPath, markdown);
    console.log(`Markdown catalog exported to ${outputPath}`);
  }

  /**
   * Store in AgentDB
   */
  async storeInAgentDB(): Promise<void> {
    console.log('Storing evidence in AgentDB...');

    for (const item of this.evidence.values()) {
      const agentdbData = {
        id: item.batesNumber,
        title: item.filename,
        description: `Evidence item from ${item.metadata.sourceFolder}`,
        content: item.content || `Binary file: ${item.fileType}`,
        metadata: {
          ...item.metadata,
          hash: item.hash,
          parties: item.parties,
          dateModified: item.dateModified.toISOString(),
          fileType: item.fileType,
          size: item.size
        },
        tags: [
          'evidence',
          item.fileType.replace('.', ''),
          ...item.parties.map(p => p.toLowerCase().replace(/\s+/g, '-'))
        ]
      };

      // Use AgentDB CLI to store
      const cmd = `npx agentdb store --id "${agentdbData.id}" --title "${agentdbData.title}" --content "${agentdbData.content.replace(/"/g, '\\"')}" --metadata '${JSON.stringify(agentdbData.metadata)}' --tags '${JSON.stringify(agentdbData.tags)}'`;

      try {
        execSync(cmd, { encoding: 'utf-8' });
        console.log(`✓ Stored ${item.batesNumber} in AgentDB`);
      } catch (error) {
        console.error(`✗ Failed to store ${item.batesNumber}:`, error);
      }
    }

    console.log(`\n✓ Stored ${this.evidence.size} items in AgentDB`);
  }

  /**
   * Get statistics
   */
  getStats(): Record<string, any> {
    const fileTypes = new Map<string, number>();
    const parties = new Map<string, number>();
    let totalSize = 0;

    for (const item of this.evidence.values()) {
      // Count file types
      const count = fileTypes.get(item.fileType) || 0;
      fileTypes.set(item.fileType, count + 1);

      // Count parties
      for (const party of item.parties) {
        const pCount = parties.get(party) || 0;
        parties.set(party, pCount + 1);
      }

      totalSize += item.size;
    }

    return {
      totalItems: this.evidence.size,
      totalSize,
      fileTypes: Object.fromEntries(fileTypes),
      parties: Object.fromEntries(parties),
      batesRange: {
        first: this.evidence.size > 0 ? Array.from(this.evidence.keys())[0] : null,
        last: this.evidence.size > 0 ? Array.from(this.evidence.keys())[this.evidence.size - 1] : null
      }
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const evidenceDir = process.argv[2] || './docs/pro-se-platform/evidence';

  console.log('🏛️  Pro Se Evidence Processor - Castillo v. Schwab & Sedgwick');
  console.log('=' .repeat(70));
  console.log(`Processing directory: ${evidenceDir}\n`);

  const processor = new EvidenceProcessor({
    prefix: 'CAST',
    startNumber: 1,
    paddingLength: 4
  });

  // Process all files
  await processor.processDirectory(evidenceDir);

  // Get stats
  const stats = processor.getStats();
  console.log('\n📊 Processing Statistics:');
  console.log(`   Total Items: ${stats.totalItems}`);
  console.log(`   Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   File Types: ${JSON.stringify(stats.fileTypes, null, 2)}`);
  console.log(`   Bates Range: ${stats.batesRange.first} → ${stats.batesRange.last}`);

  // Export catalogs
  const outputDir = './docs/pro-se-platform/evidence';
  processor.exportCatalog(path.join(outputDir, 'catalog.json'));
  processor.exportMarkdownCatalog(path.join(outputDir, 'BATES-CATALOG.md'));

  // Store in AgentDB
  await processor.storeInAgentDB();

  console.log('\n✅ Evidence processing complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default EvidenceProcessor;
