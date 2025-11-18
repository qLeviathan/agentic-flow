# BATES NUMBERING SPECIALIST - QUICK START GUIDE

**Status:** READY FOR DEPLOYMENT
**Deadline:** 2 days
**Prefix:** CAST (CAST-0001, CAST-0002, etc.)

---

## ONE-LINE START

```bash
bash /home/user/agentic-flow/docs/pro-se-platform/system/run-bates-coordinator.sh
```

---

## WHAT IT DOES

Automatically processes all extracted evidence and assigns sequential Bates numbers:

1. Waits for extraction agent to complete (monitors memory signal)
2. Scans evidence-raw/ directory for extracted files
3. Assigns Bates numbers: CAST-0001, CAST-0002, etc.
4. Computes SHA-256 hashes for authenticity
5. Extracts text content from all files
6. Identifies parties mentioned in documents
7. Generates two catalogs:
   - **catalog.json** - For programmatic use (AgentDB, fact-checker, etc.)
   - **BATES-CATALOG.md** - For court filings and discovery

---

## FILES

### Input Directory
```
/home/user/agentic-flow/docs/pro-se-platform/evidence-raw/
```
(Populated by extraction agent)

### Output Directory
```
/home/user/agentic-flow/docs/pro-se-platform/evidence/
```

### Output Files
```
catalog.json              - Machine-readable Bates catalog
BATES-CATALOG.md         - Court-ready evidence table
BATES-PROCESSING-REPORT.md - Processing status and results
```

---

## HOW TO RUN

### Default (24-hour monitoring)
```bash
cd /home/user/agentic-flow/docs/pro-se-platform/system
bash run-bates-coordinator.sh
```

### Custom Timeout (in minutes)
```bash
# 1-hour timeout
bash run-bates-coordinator.sh 60

# 2-day timeout
bash run-bates-coordinator.sh 2880
```

### Quick Test (5 minutes)
```bash
bash run-bates-coordinator.sh 5
```

---

## MONITORING

System waits for extraction agent to signal completion via memory:

```bash
# Check if waiting for extraction
npx claude-flow@alpha memory retrieve --key "evidence/extraction-status"

# Manual trigger (if needed)
npx claude-flow@alpha memory store \
  --key "evidence/extraction-status" \
  --value "complete"
```

---

## VERIFICATION

### Check Bates Catalog
```bash
cat /home/user/agentic-flow/docs/pro-se-platform/evidence/BATES-CATALOG.md
```

### Validate JSON
```bash
jq '.' /home/user/agentic-flow/docs/pro-se-platform/evidence/catalog.json
```

### Count Items
```bash
jq 'length' /home/user/agentic-flow/docs/pro-se-platform/evidence/catalog.json
```

### Check Hashes
```bash
jq '.[].hash' /home/user/agentic-flow/docs/pro-se-platform/evidence/catalog.json
```

---

## RECOGNIZED PARTIES

System automatically identifies:
- Marc Castillo
- Jennifer Babchuk
- Andrei Egorov
- Charlie Soulis
- Kay Bristow
- Taylor Huffner
- Chrystal Hicks
- Noel Tapia
- Beth Cappeli
- Sedgwick
- Charles Schwab
- Sara Fowler
- EEOC
- Lorna Steuer

---

## SUPPORTED FILE TYPES

| Type | Extraction |
|------|-----------|
| .txt | ✓ Full text |
| .md | ✓ Full text |
| .eml | ✓ Email text |
| .msg | ✓ Email text |
| .pdf | ✓ pdftotext |
| .png | ✓ tesseract OCR |
| .jpg | ✓ tesseract OCR |
| Binary | ✓ Hash only |

---

## EXPECTED OUTPUT

```
BATES RANGE: CAST-0001 → CAST-XXXX
TOTAL ITEMS: [number]

FILE TYPES BREAKDOWN:
  • .txt: [count]
  • .pdf: [count]
  • .eml: [count]
  ...

PARTIES IDENTIFIED:
  • Marc Castillo: [count]
  • Sedgwick: [count]
  • Schwab: [count]
  ...
```

---

## TROUBLESHOOTING

**Issue:** "Waiting for extraction..."
- **Status:** Normal - monitoring for completion signal
- **Action:** Wait for extraction agent to complete
- **Timeout:** 24 hours (configurable)

**Issue:** "No files found"
- **Cause:** Files not yet extracted to evidence-raw/
- **Action:** Verify extraction agent has completed
- **Check:** `ls /path/to/evidence-raw/`

**Issue:** "PDF extraction failed"
- **Cause:** pdftotext not installed
- **Fix:** `apt-get install poppler-utils`
- **Impact:** PDFs still processed, text won't be extracted

---

## DOWNSTREAM INTEGRATION

After processing complete, results available for:

```
Fact-Checker         - Verify evidence authenticity
Query Interface      - Search by Bates number
AgentDB             - Store for semantic search
Timeline Generator   - Reference evidence in timeline
```

Memory signal available: `evidence/bates-complete`

---

## QUICK REFERENCE

| Command | Purpose |
|---------|---------|
| `bash run-bates-coordinator.sh` | Start monitoring and processing |
| `bash create-test-evidence.sh` | Generate 8 test files |
| `npx ts-node evidence-processor.ts [dir]` | Direct processing |
| `jq '.' catalog.json` | View JSON catalog |
| `cat BATES-CATALOG.md` | View court-ready catalog |

---

## DEADLINE STATUS

**2-Day Deadline:** ON TRACK
**Processing Time:** < 1 hour (after extraction)
**Test Status:** SUCCESSFUL (8/8 files processed)
**Production Status:** READY

---

**For detailed documentation, see:** `BATES-NUMBERING-WORKFLOW.md`
**For test results, see:** `BATES-PROCESSING-REPORT.md`
