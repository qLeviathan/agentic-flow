/**
 * Google Drive Link Bates Catalog Generator
 * NO LOCAL STORAGE - Links only to Google Drive files
 *
 * Bleeding Edge: Scans Google Drive, assigns Bates, creates link catalog
 */

import * as fs from 'fs';
import * as crypto from 'crypto';

interface GoogleDriveFile {
  name: string;
  id: string;
  webViewLink: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  parents: string[];
}

interface BatesEntry {
  batesNumber: string;
  googleDriveLink: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dateModified: string;
  folderId: string;
  folderPath: string;
  inferredParties: string[];
  inferredDate?: string;
  legalRelevance: string[];
  linkHash: string; // Hash of the link for verification
}

export class GoogleDriveBatesCatalog {
  private batesCounter: number = 1;
  private entries: Map<string, BatesEntry> = new Map();
  private baseDriveUrl: string;

  constructor(baseDriveUrl: string) {
    // User's Google Drive folder URL
    this.baseDriveUrl = baseDriveUrl;
  }

  /**
   * Generate Bates number
   */
  private generateBates(): string {
    const num = String(this.batesCounter).padStart(4, '0');
    this.batesCounter++;
    return `CAST-${num}`;
  }

  /**
   * Parse Google Drive folder URL to get folder ID
   */
  private parseFolderId(url: string): string {
    // Example: https://drive.google.com/drive/folders/1kICYkmieqR84gygwZGfjiHPMnxkzLqQj?usp=sharing
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  /**
   * Create Bates entry for Google Drive file (by URL)
   */
  createEntry(fileUrl: string, fileName: string, metadata: any = {}): BatesEntry {
    const bates = this.generateBates();

    // Extract file info from name/URL
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'unknown';

    // Infer parties from filename
    const parties = this.inferParties(fileName);

    // Infer legal relevance
    const relevance = this.inferLegalRelevance(fileName);

    // Create link hash for verification
    const linkHash = crypto.createHash('sha256').update(fileUrl).digest('hex').substring(0, 16);

    const entry: BatesEntry = {
      batesNumber: bates,
      googleDriveLink: fileUrl,
      fileName: fileName,
      fileType: fileType,
      fileSize: metadata.size || 0,
      dateModified: metadata.modifiedTime || new Date().toISOString(),
      folderId: metadata.folderId || '',
      folderPath: metadata.folderPath || '',
      inferredParties: parties,
      inferredDate: this.inferDate(fileName),
      legalRelevance: relevance,
      linkHash: linkHash
    };

    this.entries.set(bates, entry);
    return entry;
  }

  /**
   * Infer parties from filename
   */
  private inferParties(fileName: string): string[] {
    const parties: Set<string> = new Set();
    const knownParties = [
      'Castillo', 'Marc', 'CP',
      'Babchuk', 'Jennifer',
      'Egorov', 'Andrei',
      'Soulis', 'Charlie',
      'Bristow', 'Kay',
      'Huffner', 'Taylor',
      'Hicks', 'Chrystal',
      'Tapia', 'Noel',
      'Beth',
      'Sedgwick', 'Sheri', 'Miriam', 'Theresa',
      'Schwab',
      'Fowler', 'Sara',
      'EEOC', 'Steuer', 'Lorna'
    ];

    const lowerName = fileName.toLowerCase();
    for (const party of knownParties) {
      if (lowerName.includes(party.toLowerCase())) {
        parties.add(party);
      }
    }

    return Array.from(parties);
  }

  /**
   * Infer date from filename (YYYY-MM-DD or YYYYMMDD patterns)
   */
  private inferDate(fileName: string): string | undefined {
    // Match YYYY-MM-DD
    let match = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    // Match YYYYMMDD
    match = fileName.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    return undefined;
  }

  /**
   * Infer legal relevance from filename
   */
  private inferLegalRelevance(fileName: string): string[] {
    const relevance: Set<string> = new Set();
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('ada') || lowerName.includes('disability') || lowerName.includes('accommodation')) {
      relevance.add('ADA');
    }
    if (lowerName.includes('fmla') || lowerName.includes('leave') || lowerName.includes('medical')) {
      relevance.add('FMLA');
    }
    if (lowerName.includes('erisa') || lowerName.includes('benefit') || lowerName.includes('sedgwick')) {
      relevance.add('ERISA');
    }
    if (lowerName.includes('sox') || lowerName.includes('whistleblow') || lowerName.includes('compliance')) {
      relevance.add('SOX');
    }
    if (lowerName.includes('termination') || lowerName.includes('discharge') || lowerName.includes('resign')) {
      relevance.add('Constructive Discharge');
    }
    if (lowerName.includes('metadata') || lowerName.includes('dcn') || lowerName.includes('backdat')) {
      relevance.add('Spoliation');
    }

    return Array.from(relevance);
  }

  /**
   * Bulk create from manual list
   */
  bulkCreate(files: Array<{url: string, name: string, metadata?: any}>): void {
    for (const file of files) {
      this.createEntry(file.url, file.name, file.metadata || {});
    }
  }

  /**
   * Export to Markdown catalog (court-ready)
   */
  exportMarkdown(outputPath: string): void {
    let md = '# Evidence Catalog - Castillo v. Schwab & Sedgwick\n\n';
    md += '**Bates Numbering System:** Google Drive Link References\n';
    md += `**Base Folder:** ${this.baseDriveUrl}\n`;
    md += `**Total Evidence Items:** ${this.entries.size}\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    md += '---\n\n';
    md += '## Exhibits Index\n\n';
    md += '| Bates No. | File Name | Type | Date | Parties | Relevance | Google Drive Link |\n';
    md += '|-----------|-----------|------|------|---------|-----------|-------------------|\n';

    for (const [bates, entry] of this.entries) {
      const parties = entry.inferredParties.join(', ') || 'Unknown';
      const relevance = entry.legalRelevance.join(', ') || 'General';
      const date = entry.inferredDate || entry.dateModified.split('T')[0];
      const link = `[View](${entry.googleDriveLink})`;

      md += `| ${bates} | ${entry.fileName} | ${entry.fileType} | ${date} | ${parties} | ${relevance} | ${link} |\n`;
    }

    md += '\n---\n\n';
    md += '## Evidence by Legal Claim\n\n';

    // Group by claim type
    const byClaim = new Map<string, BatesEntry[]>();
    for (const entry of this.entries.values()) {
      for (const claim of entry.legalRelevance) {
        if (!byClaim.has(claim)) byClaim.set(claim, []);
        byClaim.get(claim)!.push(entry);
      }
    }

    for (const [claim, entries] of byClaim) {
      md += `### ${claim} (${entries.length} documents)\n\n`;
      for (const entry of entries) {
        md += `- **${entry.batesNumber}**: [${entry.fileName}](${entry.googleDriveLink})\n`;
      }
      md += '\n';
    }

    md += '---\n\n';
    md += '## Authentication Protocol\n\n';
    md += 'All exhibits referenced via Google Drive links with the following verification:\n\n';
    md += '1. **Link Hash:** Each Google Drive URL has SHA-256 hash (first 16 chars) for verification\n';
    md += '2. **Video Authentication:** Plaintiff has video recording of all emails sent to self at Starbucks\n';
    md += '3. **Chain of Custody:** Original files remain in Google Drive with modification timestamps\n';
    md += '4. **Expert Testimony:** Digital forensics expert can authenticate Google Drive metadata\n';
    md += '5. **Business Records:** Emails are business records exception to hearsay (Fed. R. Evid. 803(6))\n\n';

    fs.writeFileSync(outputPath, md);
    console.log(`✓ Markdown catalog: ${outputPath}`);
  }

  /**
   * Export to JSON (machine-readable)
   */
  exportJSON(outputPath: string): void {
    const catalog = {
      metadata: {
        baseDriveUrl: this.baseDriveUrl,
        totalItems: this.entries.size,
        batesRange: {
          first: this.entries.size > 0 ? Array.from(this.entries.keys())[0] : null,
          last: this.entries.size > 0 ? Array.from(this.entries.keys())[this.entries.size - 1] : null
        },
        generated: new Date().toISOString()
      },
      entries: Array.from(this.entries.values())
    };

    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
    console.log(`✓ JSON catalog: ${outputPath}`);
  }

  /**
   * Generate witness authentication affidavit template
   */
  generateAuthenticationAffidavit(outputPath: string): void {
    const affidavit = `# AFFIDAVIT OF AUTHENTICATION
## Evidence Exhibits via Google Drive

**Case:** Castillo v. Charles Schwab & Co., Inc., et al.

---

### I. AFFIANT'S QUALIFICATIONS

I, Marc Castillo, being duly sworn, depose and state as follows:

1. I am the Plaintiff in this matter and have personal knowledge of the facts set forth herein.

2. I am over the age of 18 and competent to testify to the matters stated herein.

3. I make this affidavit based upon my personal knowledge and in support of the authenticity of evidence exhibits referenced herein via Google Drive links.

---

### II. EVIDENCE AUTHENTICATION

4. The evidence exhibits referenced in this case via Google Drive links (Bates numbered CAST-0001 through CAST-${String(this.batesCounter - 1).padStart(4, '0')}) are true and accurate copies of documents and records created, received, or maintained by me in the ordinary course of this employment dispute.

5. **Video Authentication:** On [DATE], at a Starbucks location, I created a video recording of myself sending all relevant email evidence to my personal email account. This video recording, approximately 10 minutes in duration, shows:
   - My face and identity
   - The computer screen displaying each email
   - The act of forwarding/sending each email to myself
   - Verbatim reading of key portions of emails
   - Timestamp visible on screen and in video metadata

6. **Email Self-Authentication:** All email exhibits were sent from my Schwab corporate email address to my personal email account in real-time as events occurred, creating contemporaneous records independent of the subsequent litigation.

7. **Google Drive Chain of Custody:**
   - All evidence files uploaded to Google Drive folder: ${this.baseDriveUrl}
   - Original file modification timestamps preserved by Google Drive
   - No files have been altered since original upload
   - Google Drive metadata available for forensic examination

8. **Business Records Foundation (Fed. R. Evid. 803(6)):** The email and employment records were:
   - Made at or near the time of the events described
   - By persons with knowledge of the events
   - Kept in the course of a regularly conducted business activity
   - As a regular practice of Schwab's business operations

---

### III. SPECIFIC AUTHENTICATIONS

${this.generateSpecificAuthentications()}

---

### IV. EXPERT AVAILABILITY

9. Should the Court require additional authentication, I am prepared to provide:
   - The video recording described in paragraph 5
   - Testimony regarding creation and maintenance of these records
   - Digital forensics expert to examine Google Drive metadata
   - Google Drive access logs showing no post-litigation modifications

10. I declare under penalty of perjury under the laws of the United States that the foregoing is true and correct.

Executed this _____ day of ________________, 2025.

_________________________________
Marc Castillo, Plaintiff

---

### NOTARY

State of _________________
County of ________________

Subscribed and sworn to before me this _____ day of ________________, 2025.

_________________________________
Notary Public

My commission expires: ___________
`;

    fs.writeFileSync(outputPath, affidavit);
    console.log(`✓ Authentication affidavit: ${outputPath}`);
  }

  /**
   * Generate specific authentications for key exhibits
   */
  private generateSpecificAuthentications(): string {
    let auth = '';
    let count = 1;

    // Group by claim type for organized authentication
    const byClaim = new Map<string, BatesEntry[]>();
    for (const entry of this.entries.values()) {
      for (const claim of entry.legalRelevance) {
        if (!byClaim.has(claim)) byClaim.set(claim, []);
        byClaim.get(claim)!.push(entry);
      }
    }

    for (const [claim, entries] of byClaim) {
      auth += `**${claim} Evidence (${entries.length} exhibits):**\n\n`;
      for (const entry of entries.slice(0, 3)) { // Show first 3 per claim
        auth += `${count}. **${entry.batesNumber}** (${entry.fileName}): `;
        auth += `I personally created/received this ${entry.fileType} file on or about ${entry.inferredDate || 'the date shown'}. `;
        auth += `It is a true and accurate copy of the original ${entry.fileType} `;
        auth += `and has not been altered since creation. [Google Drive Link: ${entry.googleDriveLink}]\n\n`;
        count++;
      }
      if (entries.length > 3) {
        auth += `[Additional ${entries.length - 3} ${claim} exhibits authenticated by same foundation]\n\n`;
      }
    }

    return auth;
  }
}

// Export for use in other modules
export default GoogleDriveBatesCatalog;

// CLI usage
if (require.main === module) {
  console.log('📎 Google Drive Bates Catalog Generator');
  console.log('Usage: node google-drive-bates.ts <drive-url> <files-list.json>');
  console.log('');
  console.log('Example files-list.json:');
  console.log(JSON.stringify([
    {
      url: 'https://drive.google.com/file/d/ABC123/view',
      name: '2024-12-02-babchuk-rework-demand.pdf',
      metadata: { size: 123456, modifiedTime: '2024-12-02T10:30:00Z' }
    }
  ], null, 2));
}
