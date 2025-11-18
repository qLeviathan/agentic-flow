# BATES NUMBERING WORKFLOW
## Castillo v. Schwab & Sedgwick

**Case:** Castillo v. Schwab & Sedgwick
**Specialist:** Bates Numbering Coordinator
**Deadline:** 2 days
**Prefix:** CAST (e.g., CAST-0001, CAST-0002)
**Padding:** 4 digits

---

## MISSION OVERVIEW

Assign sequential Bates numbers to ALL extracted evidence immediately after extraction agent completion. The Bates numbering specialist:

1. **Monitors** extraction completion via memory signals
2. **Processes** all extracted files from evidence-raw directory
3. **Assigns** sequential Bates numbers (CAST-0001, CAST-0002, etc.)
4. **Computes** SHA-256 hashes for authenticity verification
5. **Extracts** text content from all files (PDF, email, images with OCR)
6. **Identifies** parties from filenames and document content
7. **Generates** complete Bates catalog (JSON and Markdown formats)
8. **Stores** completion status for downstream agents

---

## WORKFLOW STAGES

### Stage 1: Initialization
```bash
# Start the Bates coordinator
cd /home/user/agentic-flow/docs/pro-se-platform/system
bash run-bates-coordinator.sh [timeout-minutes]

# Or with npm script
npm run bates:process [timeout-minutes]
```

**Timeline:** Immediate (< 1 minute)
**Action:** Creates directories, validates system, ready for extraction

### Stage 2: Extraction Monitoring
```
Status: WAITING FOR EXTRACTION AGENT
Signal Key: evidence/extraction-status
Poll Interval: Every 60 seconds
Timeout: 24 hours (1440 minutes) - configurable
```

**Timeline:** Triggered by extraction agent completion
**Action:** Continuously monitors for:
- Memory signal: "evidence/extraction-status" = complete
- File system: Files appear in `/docs/pro-se-platform/evidence-raw/`

### Stage 3: Evidence Processing

Once extraction completes, immediately begins:

#### 3a. File Scanning
```
Source: /docs/pro-se-platform/evidence-raw/**/*
Process: Recursive directory traversal
Actions:
  - Identify all files (documents, emails, images)
  - Skip system/hidden files
  - Group by file type
```

#### 3b. Bates Number Assignment
```
Format: CAST-0001, CAST-0002, ..., CAST-XXXX
Pattern: [PREFIX]-[4-digit-number]
Uniqueness: Sequential, guaranteed unique
Immutable: Hash-based verification
```

#### 3c. File Analysis
For each file:

**SHA-256 Hash Computation**
```
Purpose: Authenticity, prevent spoliation, detect tampering
Method: Cryptographic hash of entire file
Output: Hex string (64 characters)
Use: Cross-reference during verification
```

**Content Extraction**
```
.txt, .md:      Direct text reading
.pdf:          Extract via pdftotext tool
.eml, .msg:    Email text extraction
.png, .jpg:    OCR via tesseract (if available)
Binary files:  [Binary content marked]
```

**Party Identification**
```
Method: Pattern matching (filename + content)
Known Parties:
  - Marc Castillo, Castillo, CP
  - Jennifer Babchuk, Babchuk
  - Andrei Egorov, Egorov
  - Charlie Soulis, Soulis
  - Kay Bristow, Bristow
  - Taylor Huffner, Huffner
  - Chrystal Hicks, Hicks
  - Noel Tapia, Tapia
  - Beth, Beth Cappeli
  - Sedgwick, Sheri, Miriam, Theresa
  - Schwab, Charles Schwab
  - Sara Fowler, Fowler, Seyfarth
  - EEOC, Lorna Steuer

Output: List of parties mentioned in file
```

### Stage 4: Catalog Generation

#### 4a. JSON Catalog
**File:** `/docs/pro-se-platform/evidence/catalog.json`

```json
[
  {
    "batesNumber": "CAST-0001",
    "filename": "email-march-2024.eml",
    "fileType": ".eml",
    "hash": "a1b2c3d4e5f6...[56 more chars]",
    "size": 45231,
    "parties": ["Marc Castillo", "Jennifer Babchuk"],
    "dateCreated": "2024-03-15T10:30:00Z",
    "dateModified": "2024-03-15T10:30:00Z",
    "content": "Email content excerpt...",
    "metadata": {
      "processed": "2025-11-16T20:22:00Z",
      "sourceFolder": "2024/march"
    }
  },
  ...
]
```

**Use Cases:**
- AgentDB storage and indexing
- Programmatic verification
- Automated fact-checking
- Cross-reference validation

#### 4b. Markdown Catalog
**File:** `/docs/pro-se-platform/evidence/BATES-CATALOG.md`

```markdown
# Evidence Catalog - Castillo v. Schwab & Sedgwick

**Generated:** 2025-11-16T20:22:00Z
**Total Items:** 1542

| Bates No. | Filename | Type | Date Modified | Parties | Hash |
|-----------|----------|------|---------------|---------|------|
| CAST-0001 | email-march-2024.eml | .eml | 2024-03-15 | Marc Castillo, Jennifer Babchuk | a1b2c3d4... |
| CAST-0002 | sedgwick-denial-april.pdf | .pdf | 2024-04-02 | Sedgwick, Castillo | e5f6a7b8... |
...
```

**Use Cases:**
- Litigation filing exhibits
- Court submissions
- Discovery disclosures
- Manual review by counsel

### Stage 5: Completion Reporting

#### 5a. Processing Report
**File:** `/docs/pro-se-platform/evidence/BATES-PROCESSING-REPORT.md`

```
BATES RANGE: CAST-0001 → CAST-1542
TOTAL ITEMS: 1542
TOTAL SIZE: 1,234.56 MB

STATISTICS:
  • PDF: 456 files
  • Email (.eml): 678 files
  • Text: 234 files
  • Images: 123 files
  • Other: 51 files

PARTIES IDENTIFIED:
  • Marc Castillo: 892 occurrences
  • Sedgwick: 567 occurrences
  • Schwab: 445 occurrences
  • Jennifer Babchuk: 234 occurrences
  ... (full list)

NEXT STEPS:
  1. Review Bates catalog for accuracy
  2. Verify party identification
  3. Validate hash integrity
  4. Coordinate with fact-checker
  5. Prepare litigation filing
```

#### 5b. Memory Storage
**Key:** `evidence/bates-complete`
**Namespace:** `evidence`

```json
{
  "timestamp": "2025-11-16T20:22:00Z",
  "batesRange": {
    "first": "CAST-0001",
    "last": "CAST-1542",
    "total": 1542
  },
  "totalSize": 1291845632,
  "fileTypes": {
    ".pdf": 456,
    ".eml": 678,
    ".txt": 234,
    ".png": 123,
    ".jpg": 45
  },
  "parties": {
    "Marc Castillo": 892,
    "Sedgwick": 567,
    ...
  },
  "catalogJsonPath": "/docs/pro-se-platform/evidence/catalog.json",
  "catalogMarkdownPath": "/docs/pro-se-platform/evidence/BATES-CATALOG.md",
  "status": "complete"
}
```

**Used By:**
- Fact-checker for evidence verification
- Timeline generator for reference
- Query interface for document lookup
- AgentDB for semantic search

---

## COORDINATION PROTOCOL

### Memory Signals

**Extraction Agent → Bates Coordinator**
```bash
# Extraction agent sets this when complete:
npx claude-flow@alpha memory store \
  --key "evidence/extraction-status" \
  --namespace "evidence" \
  --value "complete"
```

**Bates Coordinator → Downstream Agents**
```bash
# Bates coordinator stores completion when done:
npx claude-flow@alpha memory store \
  --key "evidence/bates-complete" \
  --namespace "evidence" \
  --value '[completion_data_json]'
```

### Agent Dependencies

```
EXTRACTION AGENT
        ↓
   (signals completion)
        ↓
BATES COORDINATOR (THIS SYSTEM)
        ↓
   (produces catalogs)
        ↓
FACT-CHECKER / QUERY INTERFACE / AGENTDB
```

---

## EXECUTION COMMANDS

### Run with Default Settings (24-hour timeout)
```bash
cd /home/user/agentic-flow/docs/pro-se-platform/system
bash run-bates-coordinator.sh
```

### Run with Custom Timeout (in minutes)
```bash
# 1-hour timeout
bash run-bates-coordinator.sh 60

# 2-day timeout
bash run-bates-coordinator.sh 2880

# 5-minute timeout (testing)
bash run-bates-coordinator.sh 5
```

### Using npm Scripts
```bash
cd /home/user/agentic-flow/docs/pro-se-platform/system
npm install  # First time only
npm run bates:process
npm run bates:process 60  # Custom timeout
```

### Direct TypeScript Execution
```bash
npx ts-node bates-coordinator.ts [timeout-minutes]
npx ts-node evidence-processor.ts
```

---

## VERIFICATION PROCESS

### Hash Validation
```bash
# Verify file authenticity
shasum -a 256 file.pdf | grep -f catalog.json

# Batch verification
for file in evidence-raw/*; do
  hash=$(sha256sum "$file" | awk '{print $1}')
  echo "$file: $hash"
done
```

### Catalog Verification
```bash
# Validate JSON syntax
jq . /docs/pro-se-platform/evidence/catalog.json

# Count items
jq 'length' /docs/pro-se-platform/evidence/catalog.json

# Extract Bates range
jq -r '.[0].batesNumber, .[-1].batesNumber' catalog.json
```

### Content Verification
```bash
# Validate text extraction (PDF example)
pdftotext /docs/pro-se-platform/evidence-raw/document.pdf -

# Validate OCR (image example)
tesseract /docs/pro-se-platform/evidence-raw/image.png stdout
```

---

## TIMELINE & DEADLINE

**Task Deadline:** 2 days
**Start:** Immediately when extraction agent completes
**Target Completion:** < 1 hour after extraction completion

**Timeline Breakdown:**
- Extraction monitoring: Continuous (up to 24 hours)
- File processing: 1-5 minutes (depending on volume)
- Hash computation: 1-10 minutes (I/O bound)
- Text extraction: 5-30 minutes (OCR intensive)
- Catalog generation: < 1 minute
- Total: < 1 hour (after extraction)

---

## ERROR HANDLING & RECOVERY

### Common Issues

**Issue:** "No extraction status found"
```
Status: NORMAL during initial monitoring
Action: Continue monitoring
Timeout: 24 hours
```

**Issue:** "No files found in evidence-raw"
```
Cause: Extraction not yet complete
Action: Continue monitoring
Status: Reported every 5 minutes
```

**Issue:** "PDF extraction failed"
```
Cause: pdftotext tool missing
Action: Install with: apt-get install poppler-utils
Fallback: Mark as binary file
```

**Issue:** "OCR not available"
```
Cause: tesseract missing (non-critical)
Action: Install with: apt-get install tesseract-ocr
Impact: Images won't have extracted text
```

### Recovery Actions

```bash
# Resume from interruption
bash run-bates-coordinator.sh 1440

# Force reprocess files
rm /docs/pro-se-platform/evidence/catalog.json
rm /docs/pro-se-platform/evidence/BATES-CATALOG.md
npx ts-node bates-coordinator.ts

# Check memory status
npx claude-flow@alpha memory list --namespace "evidence"

# Verify outputs
ls -lah /docs/pro-se-platform/evidence/
```

---

## SECURITY CONSIDERATIONS

### Hash Integrity
- All files hashed with SHA-256 (cryptographically secure)
- Hashes computed at source (prevent tampering)
- Hash verification available for document authenticity

### Confidentiality
- All evidence stored locally
- No external API calls for document processing
- File permissions: Read-only after catalog generation

### Spoliation Prevention
- Immutable Bates numbers
- Hash-based authenticity verification
- Audit trail in memory/reports
- Timestamp documentation

---

## NEXT INTEGRATION POINTS

After Bates numbering completes:

1. **Fact Checker** - Uses Bates numbers for evidence verification
2. **Query Interface** - Searches evidence by Bates number
3. **AgentDB** - Stores evidence for vector search
4. **Timeline Generator** - References evidence with Bates numbers
5. **Litigation Filing** - Includes Bates catalog as exhibit

---

## CONTACT & SUPPORT

**System:** Bates Numbering Coordinator v1.0
**Case:** Castillo v. Schwab & Sedgwick
**Deadline:** 2 days
**Status:** READY FOR DEPLOYMENT

For issues or questions, check:
- `/docs/pro-se-platform/system/bates-coordinator.ts` - Main implementation
- `/docs/pro-se-platform/system/evidence-processor.ts` - Evidence processing logic
- Memory: `evidence/bates-complete` - Completion status
