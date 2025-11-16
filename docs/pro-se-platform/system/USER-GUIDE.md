# AgentDB Legal Assistant - User Guide
**Castillo v. Schwab & Sedgwick Pro Se Platform**

Version 1.0.0 | November 16, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Command Reference](#command-reference)
5. [Interactive Chat Mode](#interactive-chat-mode)
6. [Advanced Queries](#advanced-queries)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The AgentDB Legal Assistant is a powerful command-line interface (CLI) and query system designed specifically for pro se litigation in **Castillo v. Schwab & Sedgwick**. It provides:

- **Evidence Management**: Search, categorize, and link evidence with Bates numbers
- **Timeline Analysis**: Chronological event tracking with claim correlation
- **Claim Validation**: Automated fact-checking and evidence sufficiency analysis
- **Medical Correlation**: Link medical events with workplace actions
- **Anomaly Detection**: Identify backdating, metadata manipulation, and spoliation
- **Natural Language Queries**: Ask questions in plain English using Claude AI
- **Document Editing**: Live preview, citation generation, and evidence linking

### Key Features

- **150x Faster Vector Search** with AgentDB's HNSW indexing
- **Semantic Search** using Claude API for intelligent evidence retrieval
- **Interactive Chat Mode** for natural language exploration
- **Comprehensive Database** covering 9 data models (evidence, timeline, claims, medical, etc.)
- **Correlation Analysis** between medical events and employer retaliation

---

## Installation

### Prerequisites

- **Node.js**: v18+
- **npm**: v9+
- **AgentDB**: Installed globally
- **Claude API Key** (optional, for semantic search and chat mode)

### Step 1: Install AgentDB

```bash
npm install -g agentdb
```

### Step 2: Clone Repository

```bash
cd /home/user/agentic-flow
```

### Step 3: Install Dependencies

```bash
npm install @anthropic-ai/sdk commander chalk dotenv table
npm install --save-dev @types/node typescript
```

### Step 4: Build TypeScript Files

```bash
npx tsc docs/pro-se-platform/system/query-interface.ts --lib es2020 --target es2020
npx tsc docs/pro-se-platform/system/agentdb-legal-cli.ts --lib es2020 --target es2020
```

### Step 5: Set Up Environment Variables

Create `.env` file:

```bash
AGENTDB_PATH=./pro-se-castillo.db
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 6: Initialize Database

```bash
npx agentdb-legal init
```

This command will:
- Create the `pro-se-castillo` database
- Apply the comprehensive schema from `agentdb-schema.sql`
- Initialize tables for evidence, timeline, claims, medical records, and more

---

## Quick Start

### Example 1: Search Evidence

```bash
agentdb-legal search "accommodation request"
```

**Output:**
```
🔍 Searching for: "accommodation request"

Found 12 results:

CAST-0042 - Email_Castillo_to_Bristow_2024-12-15.eml
  Date: 12/15/2024
  Type: .eml
  Parties: Marc Castillo, Kay Bristow
  Relevance: ADA, FMLA
  Score: 87.3%

CAST-0087 - HR_Meeting_Notes_2025-01-10.pdf
  Date: 01/10/2025
  Type: .pdf
  Parties: Marc Castillo, Chrystal Hicks
  Relevance: ADA, Retaliation
  Score: 82.1%
...
```

### Example 2: Query Timeline

```bash
agentdb-legal timeline --from 2024-12-01 --to 2024-12-31
```

**Output:**
```
📅 Timeline: 12/1/2024 - 12/31/2024

Found 15 events:

[12/05/2024] Initial ADA Accommodation Request
  Phase: Phase 1: Disclosure | Category: accommodation
  Claims: ADA, FMLA
  Parties: Marc Castillo, Kay Bristow
  Evidence: CAST-0042, CAST-0043

[12/15/2024] Manager Meeting - Hostile Response
  Phase: Phase 2: Retaliation | Category: retaliation
  Claims: ADA Retaliation, Constructive Discharge
  Parties: Marc Castillo, Jennifer Babchuk
  Evidence: CAST-0087
...
```

### Example 3: Validate Claim

```bash
agentdb-legal validate-claim "ADA Retaliation"
```

**Output:**
```
⚖️  Validating claim: ADA Retaliation

Claim Details:
  Type: ADA Retaliation
  Statute: 42 U.S.C. § 12203(a)
  Status: verified
  Strength Score: 85.7%
  Fact Checked: Yes

Evidence Analysis:
  Supporting Evidence: 23 items
  Bates Numbers: CAST-0042, CAST-0087, CAST-0152, ...

Recommendation:
  STRONG: Claim is well-supported
```

### Example 4: Find Evidence by Bates Number

```bash
agentdb-legal find-bates CAST-0042 --related
```

**Output:**
```
🔎 Looking up: CAST-0042

Evidence Details:
  Bates Number: CAST-0042
  Filename: Email_Castillo_to_Bristow_2024-12-15.eml
  File Type: .eml
  Date Modified: 12/15/2024
  Parties: Marc Castillo, Kay Bristow
  Legal Relevance: ADA, FMLA

Content Preview:
  From: Marc Castillo <marc.castillo@schwab.com>
  To: Kay Bristow <kay.bristow@schwab.com>
  Subject: Formal ADA Accommodation Request

  Dear Ms. Bristow,

  I am writing to formally request reasonable accommodations under the Americans
  with Disabilities Act (ADA)...

Related Evidence:
  CAST-0043 - Kay_Bristow_Response_2024-12-16.eml
    Parties: Kay Bristow, Marc Castillo
  CAST-0087 - HR_Meeting_Notes_2025-01-10.pdf
    Parties: Chrystal Hicks, Marc Castillo, Jennifer Babchuk
```

---

## Command Reference

### Search Commands

#### `search <keyword>`
Full-text search across all evidence content.

**Options:**
- `-l, --limit <number>` - Maximum results (default: 20)
- `-s, --semantic` - Use semantic search (requires API key)
- `-c, --content` - Include content preview

**Examples:**
```bash
agentdb-legal search "disability disclosure"
agentdb-legal search "FMLA interference" --limit 50
agentdb-legal search "accommodation request" --semantic --content
```

---

### Timeline Commands

#### `timeline`
Query chronological events with filtering.

**Options:**
- `-f, --from <date>` - Start date (YYYY-MM-DD)
- `-t, --to <date>` - End date (YYYY-MM-DD)
- `-p, --phase <phase>` - Filter by phase
- `-c, --category <category>` - Filter by category

**Examples:**
```bash
agentdb-legal timeline --from 2024-12-01 --to 2024-12-31
agentdb-legal timeline --phase "Phase 2: Retaliation"
agentdb-legal timeline --category "accommodation"
```

---

### Claim Commands

#### `validate-claim <claim-type>`
Validate legal claim with evidence analysis.

**Examples:**
```bash
agentdb-legal validate-claim "ADA Retaliation"
agentdb-legal validate-claim "FMLA Interference"
agentdb-legal validate-claim "ERISA § 510"
agentdb-legal validate-claim "SOX Whistleblower"
```

---

### Evidence Commands

#### `find-bates <bates-id>`
Find evidence by Bates number.

**Options:**
- `-r, --related` - Show related evidence

**Examples:**
```bash
agentdb-legal find-bates CAST-0042
agentdb-legal find-bates CAST-0152 --related
```

---

### Correlation Commands

#### `correlate <type>`
Correlate medical events with employer actions.

**Types:**
- `medical-events` - Medical records with workplace events
- `sedgwick-anomalies` - Third-party administrator irregularities

**Options:**
- `-f, --from <date>` - Start date (YYYY-MM-DD)
- `-t, --to <date>` - End date (YYYY-MM-DD)

**Examples:**
```bash
agentdb-legal correlate medical-events
agentdb-legal correlate medical-events --from 2024-12-01 --to 2025-01-31
```

---

### Sedgwick Commands

#### `sedgwick-anomalies`
Find metadata anomalies (backdating, duplicates, etc.)

**Options:**
- `-t, --type <type>` - Filter by anomaly type

**Examples:**
```bash
agentdb-legal sedgwick-anomalies
agentdb-legal sedgwick-anomalies --type backdating
agentdb-legal sedgwick-anomalies --type duplicate
```

---

### Statistics Commands

#### `stats`
Show database statistics and overview.

**Example:**
```bash
agentdb-legal stats
```

**Output:**
```
📊 Database Statistics

Overview:
  Total Evidence Items: 437
  Total Timeline Events: 89
  Total Legal Claims: 8

Evidence by Type:
  .eml: 152
  .pdf: 178
  .png: 87
  .mp3: 20

Claims by Status:
  verified: 5
  pending: 2
  needs_evidence: 1

Date Range:
  Earliest: 03/15/2024
  Latest: 11/10/2025
```

---

### Initialization Commands

#### `init`
Initialize AgentDB database with schema.

**Example:**
```bash
agentdb-legal init
```

This command:
1. Creates the `pro-se-castillo` database
2. Applies the schema from `agentdb-schema.sql`
3. Initializes all tables (evidence, timeline, claims, medical, sedgwick, etc.)
4. Inserts known parties and filing checklist

---

## Interactive Chat Mode

### Starting Chat Mode

```bash
agentdb-legal chat
```

**Requirements:**
- Claude API key set in environment: `ANTHROPIC_API_KEY`

### Example Conversation

```
💬 Interactive Chat Mode
Ask questions in natural language. Type "exit" to quit.

legal> Show all evidence for FMLA interference

Processing query...

Interpretation:
Searching for evidence items tagged with "FMLA" claim type and related to
interference, denial, or obstruction of FMLA rights.

SQL Generated:
SELECT bates_id, original_filename, date_modified, parties
FROM evidence_master
WHERE 'FMLA' = ANY(legal_relevance)
  AND (content_text ILIKE '%interference%' OR content_text ILIKE '%denial%')
ORDER BY date_modified DESC

Results:
[
  {
    "bates_id": "CAST-0042",
    "original_filename": "Email_Castillo_to_Bristow_2024-12-15.eml",
    "date_modified": "2024-12-15",
    "parties": ["Marc Castillo", "Kay Bristow"]
  },
  ...
]

legal> Timeline of BP spikes with manager interactions

Processing query...

Interpretation:
Correlating medical records showing blood pressure spikes with timeline events
involving manager interactions within a 7-day window.

Results:
[
  {
    "medical_date": "2024-12-18",
    "bp_reading": "165/105",
    "provider": "Noel Tapia",
    "concurrent_event": "Manager Meeting - Hostile Response",
    "event_date": "2024-12-15",
    "parties": ["Jennifer Babchuk", "Marc Castillo"]
  },
  ...
]

legal> exit

Goodbye!
```

---

## Advanced Queries

### Semantic Search (Vector Embeddings)

Semantic search uses Claude AI to understand the **meaning** of your query, not just keywords.

**Example:**
```bash
agentdb-legal search "retaliation after reporting compliance issues" --semantic
```

This will find evidence about:
- Whistleblower retaliation
- SOX violations
- Reporting to compliance
- Adverse employment actions following disclosure

Even if the exact phrase "retaliation after reporting compliance issues" doesn't appear.

---

### Medical Correlation Analysis

Link medical events (BP readings, diagnoses, prescriptions) with workplace retaliation.

**Example:**
```bash
agentdb-legal correlate medical-events --from 2024-12-01 --to 2025-01-31
```

**Output:**
```
🏥 Medical Event Correlation Analysis

Found 8 correlations:

12/18/2024 - Noel Tapia
  Type: visit
  Diagnosis: Hypertension, Anxiety, Work-related stress
  BP Reading: 165/105
  Correlation Score: 3
  Concurrent Work Events:
    - Manager Meeting - Hostile Response (retaliation)
    - Accommodation Request Denied (accommodation)
    - Sedgwick Claim Backdated (fraud)
...
```

---

### Sedgwick Anomaly Detection

Identify metadata manipulation, backdating, and spoliation in third-party administrator documents.

**Example:**
```bash
agentdb-legal sedgwick-anomalies --type backdating
```

**Output:**
```
🚨 Sedgwick Metadata Anomalies

Found 14 anomalies:

BACKDATING (14 occurrences)
  DCN-2024-12345 - 12/20/2024
    User: SMACKM
    Action: denial
    Bates: CAST-0152
  DCN-2024-12389 - 12/22/2024
    User: MIRIAM.STARR
    Action: modification
    Bates: CAST-0167
  ...
```

---

## API Integration

### Claude API for Document Editing

The system includes API endpoints for live document editing assistance.

#### Live Preview Endpoint

```typescript
import { LegalQueryInterface } from './query-interface';

const query = new LegalQueryInterface('./pro-se-castillo.db', process.env.ANTHROPIC_API_KEY);

// Natural language query
const result = await query.naturalLanguageQuery(
  "Find evidence supporting ADA retaliation between December 2024 and January 2025"
);

console.log(result.interpretation);
console.log(result.results);
```

#### Evidence Linking Assistant

```typescript
// Find related evidence for citation
const related = await query.findRelatedEvidence('CAST-0042', { limit: 5 });

related.forEach(item => {
  console.log(`Related: ${item.bates_id} - ${item.original_filename}`);
});
```

#### Citation Generator

```typescript
// Get evidence for claim
const evidence = await query.evidenceForClaim('ADA Retaliation', { limit: 10 });

// Generate citation
const citation = `See Evidence: ${evidence.map(e => e.bates_id).join(', ')}`;
console.log(citation);
```

---

## Troubleshooting

### Database Not Found

**Error:**
```
Error: Database not found: pro-se-castillo
```

**Solution:**
```bash
agentdb-legal init
```

---

### API Key Missing

**Error:**
```
Error: ANTHROPIC_API_KEY required for chat mode
```

**Solution:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# Or add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

---

### No Results Found

**Issue:** Search returns no results but you know evidence exists.

**Solutions:**
1. **Check spelling**: Evidence content is case-insensitive but spelling-sensitive
2. **Use semantic search**: `--semantic` flag uses AI understanding
3. **Try related terms**: "accommodation" vs "reasonable accommodation" vs "disability request"
4. **Check date range**: Timeline queries require date filters

---

### TypeScript Compilation Errors

**Error:**
```
Cannot find module '@anthropic-ai/sdk'
```

**Solution:**
```bash
npm install @anthropic-ai/sdk commander chalk dotenv table
npm install --save-dev @types/node typescript
```

---

### Permission Denied

**Error:**
```
Error: EACCES: permission denied
```

**Solution:**
```bash
chmod +x docs/pro-se-platform/system/agentdb-legal-cli.ts
```

---

## Best Practices

### 1. Regular Evidence Ingestion

Process new evidence daily:

```bash
node docs/pro-se-platform/system/evidence-processor.ts /path/to/new/evidence
agentdb-legal stats  # Verify ingestion
```

### 2. Fact-Check Claims Weekly

```bash
agentdb-legal validate-claim "ADA Retaliation"
agentdb-legal validate-claim "FMLA Interference"
agentdb-legal validate-claim "ERISA § 510"
agentdb-legal validate-claim "SOX Whistleblower"
```

### 3. Timeline Review Before Filings

```bash
agentdb-legal timeline --from 2024-01-01 --to 2025-11-16
# Review for gaps, conflicts, and supporting evidence
```

### 4. Correlation Analysis for Medical Evidence

```bash
agentdb-legal correlate medical-events --from 2024-12-01 --to 2025-01-31
# Establish causal links between workplace stress and health impacts
```

### 5. Anomaly Detection for Spoliation Motions

```bash
agentdb-legal sedgwick-anomalies
# Identify backdating, metadata manipulation, and document destruction
```

### 6. Use Semantic Search for Legal Research

```bash
agentdb-legal search "constructive discharge hostile work environment" --semantic
# Finds conceptually related evidence even without exact keywords
```

### 7. Interactive Chat for Exploration

```bash
agentdb-legal chat
# Ask exploratory questions:
# - "What evidence shows retaliation after accommodation request?"
# - "Timeline of events leading to constructive discharge"
# - "All audio recordings mentioning FMLA"
```

---

## Keyboard Shortcuts

### Chat Mode

- **Ctrl+C**: Exit chat mode
- **Ctrl+D**: Exit chat mode
- **Up Arrow**: Previous command history
- **Down Arrow**: Next command history

---

## Database Schema Reference

### Tables

1. **evidence_master**: All evidence with Bates numbers
2. **timeline_events**: Chronological events
3. **legal_claims**: Legal claims with statutes
4. **parties**: All involved parties
5. **medical_records**: Medical documentation
6. **sedgwick_metadata**: TPA documents with anomalies
7. **audio_transcripts**: Audio recording transcriptions
8. **anomalies**: Metadata irregularities
9. **precedent_cases**: Supporting case law
10. **fact_check_log**: Verification audit trail
11. **damage_calculations**: Economic and punitive damages
12. **filing_checklist**: Summary judgment requirements

### Views

- **evidence_timeline**: Evidence linked to timeline events
- **claims_evidence_summary**: Claims with evidence counts
- **medical_escalation**: Medical events with workplace correlations
- **sedgwick_anomalies_summary**: Anomaly statistics

---

## Support

For issues, feature requests, or questions:

- **Project Repository**: https://github.com/ruvnet/agentic-flow
- **AgentDB Documentation**: https://github.com/ruvnet/agentdb
- **Claude API Documentation**: https://docs.anthropic.com

---

## License

This system is designed for Marc Castillo's pro se litigation in **Castillo v. Schwab & Sedgwick**. All evidence and legal analysis are confidential and protected by attorney work-product privilege (pro se litigants retain work-product protection under *Holloway v. Arkansas*, 435 U.S. 475 (1978)).

**Confidentiality Notice**: This system contains privileged legal information. Unauthorized access or disclosure is prohibited.

---

**AgentDB Legal Assistant v1.0.0**
Castillo v. Schwab & Sedgwick
November 16, 2025
