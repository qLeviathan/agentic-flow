# Setup Guide - AgentDB Legal Assistant
**Castillo v. Schwab & Sedgwick**

Complete installation and configuration guide for the AgentDB Legal Assistant system.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Database Initialization](#database-initialization)
5. [Evidence Processing](#evidence-processing)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware

- **CPU**: 2+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ for evidence files
- **Network**: Internet connection for Claude API

### Software

- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (for production) or SQLite (for development)
- **Git**: For version control

### Optional Tools

- **pdftotext**: For PDF content extraction (`sudo apt install poppler-utils`)
- **tesseract**: For OCR on images (`sudo apt install tesseract-ocr`)

---

## Installation Steps

### Step 1: Clone Repository

```bash
cd /home/user/agentic-flow
git pull origin main
```

### Step 2: Navigate to System Directory

```bash
cd docs/pro-se-platform/system
```

### Step 3: Install Node.js Dependencies

```bash
npm install
```

This will install:
- `@anthropic-ai/sdk` - Claude API client
- `commander` - CLI framework
- `chalk` - Terminal styling
- `dotenv` - Environment variable management
- `table` - Table formatting
- `better-sqlite3` - SQLite database driver

### Step 4: Install AgentDB

```bash
npm install -g agentdb
```

Verify installation:
```bash
agentdb --version
# Expected: agentdb/1.x.x
```

### Step 5: Install PDF Tools (Optional)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install poppler-utils tesseract-ocr
```

**macOS:**
```bash
brew install poppler tesseract
```

**Windows (WSL2):**
```bash
sudo apt update
sudo apt install poppler-utils tesseract-ocr
```

### Step 6: Verify Installation

```bash
node --version   # Should be v18+
npm --version    # Should be v9+
agentdb --version  # Should be v1.x.x
pdftotext -v     # Should show version (if installed)
```

---

## Configuration

### Step 1: Create Environment File

Create `.env` file in `/home/user/agentic-flow/docs/pro-se-platform/system/`:

```bash
cd /home/user/agentic-flow/docs/pro-se-platform/system
cat > .env << 'EOF'
# AgentDB Configuration
AGENTDB_PATH=./pro-se-castillo.db
AGENTDB_DATABASE=pro-se-castillo

# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Evidence Configuration
EVIDENCE_DIR=../evidence
BATES_PREFIX=CAST
BATES_START=1
BATES_PADDING=4

# Security
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true
EOF
```

### Step 2: Set Claude API Key

Get your API key from https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# Or add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

### Step 3: Set Permissions

```bash
chmod 600 .env  # Protect API key
chmod +x init-database.sh  # Make script executable
chmod +x agentdb-legal-cli.ts  # Make CLI executable
```

---

## Database Initialization

### Method 1: Automated Setup (Recommended)

```bash
./init-database.sh
```

This script will:
1. Create the `pro-se-castillo` database
2. Apply the schema from `agentdb-schema.sql`
3. Create vector collections
4. Set up indexes
5. Load initial data (parties, filing checklist)
6. Verify installation

**Expected Output:**
```
============================================================================
  AgentDB Legal Database Initialization
  Castillo v. Schwab & Sedgwick
============================================================================

✓ AgentDB found
✓ Schema file found: ./agentdb-schema.sql

📦 Step 1: Creating database 'pro-se-castillo'...
✓ Database created

📝 Step 2: Applying schema...
✓ Schema applied

🔍 Step 3: Creating vector collections...
  Creating collection: evidence
  Creating collection: timeline
  Creating collection: claims
  Creating collection: medical
  Creating collection: sedgwick
  Creating collection: audio
✓ Collections created

📊 Step 4: Creating indexes...
✓ Indexes created (via schema)

🔬 Step 5: Verifying installation...
  Checking tables...
✓ Tables verified
  Checking initial data...
✓ Initial data loaded

============================================================================
  ✅ Database initialization complete!
============================================================================

Database: pro-se-castillo
Location: /home/user/agentic-flow/docs/pro-se-platform/system/pro-se-castillo.db

Next steps:
  1. Process evidence: node evidence-processor.ts
  2. Search evidence: agentdb-legal search 'keyword'
  3. Query timeline: agentdb-legal timeline --from 2024-01-01
  4. Interactive mode: agentdb-legal chat
```

### Method 2: Manual Setup

```bash
# Initialize database
npx agentdb init --database pro-se-castillo

# Apply schema
npx agentdb schema apply ./agentdb-schema.sql --database pro-se-castillo

# Create collections
npx agentdb collection create --name evidence --description "Evidence documents" --database pro-se-castillo
npx agentdb collection create --name timeline --description "Timeline events" --database pro-se-castillo
npx agentdb collection create --name claims --description "Legal claims" --database pro-se-castillo
npx agentdb collection create --name medical --description "Medical records" --database pro-se-castillo
npx agentdb collection create --name sedgwick --description "Sedgwick metadata" --database pro-se-castillo
npx agentdb collection create --name audio --description "Audio transcripts" --database pro-se-castillo
```

### Verify Database

```bash
# Check tables
npx agentdb query --database pro-se-castillo --sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"

# Check parties
npx agentdb query --database pro-se-castillo --sql "SELECT party_name, party_role FROM parties"

# Expected output:
# Marc Castillo | plaintiff
# Jennifer Babchuk | defendant_manager
# Kay Bristow | defendant_hr
# ...
```

---

## Evidence Processing

### Step 1: Organize Evidence Files

Place evidence files in `/home/user/agentic-flow/docs/pro-se-platform/evidence/`:

```
evidence/
├── emails/
│   ├── Email_Castillo_to_Bristow_2024-12-15.eml
│   └── HR_Response_2024-12-20.eml
├── documents/
│   ├── Accommodation_Request_2024-12-05.pdf
│   └── Medical_Letter_Dr_Tapia_2024-11-10.pdf
├── audio/
│   ├── Meeting_Recording_2025-01-10.mp3
│   └── transcript.txt
└── images/
    ├── BP_Reading_2024-12-18.png
    └── Screenshot_Sedgwick_Portal.png
```

### Step 2: Process Evidence

```bash
node evidence-processor.ts /home/user/agentic-flow/docs/pro-se-platform/evidence
```

**Expected Output:**
```
🏛️  Pro Se Evidence Processor - Castillo v. Schwab & Sedgwick
======================================================================
Processing directory: /home/user/agentic-flow/docs/pro-se-platform/evidence

✓ CAST-0001: Email_Castillo_to_Bristow_2024-12-15.eml
✓ CAST-0002: HR_Response_2024-12-20.eml
✓ CAST-0003: Accommodation_Request_2024-12-05.pdf
✓ CAST-0004: Medical_Letter_Dr_Tapia_2024-11-10.pdf
...

📊 Processing Statistics:
   Total Items: 437
   Total Size: 2.47 GB
   File Types: {
     ".eml": 152,
     ".pdf": 178,
     ".png": 87,
     ".mp3": 20
   }
   Bates Range: CAST-0001 → CAST-0437

Catalog exported to /home/user/agentic-flow/docs/pro-se-platform/evidence/catalog.json
Markdown catalog exported to /home/user/agentic-flow/docs/pro-se-platform/evidence/BATES-CATALOG.md

Storing evidence in AgentDB...
✓ Stored CAST-0001 in AgentDB
✓ Stored CAST-0002 in AgentDB
...
✓ Stored 437 items in AgentDB

✅ Evidence processing complete!
```

### Step 3: Verify Evidence

```bash
agentdb-legal stats
```

**Expected Output:**
```
📊 Database Statistics

Overview:
  Total Evidence Items: 437
  Total Timeline Events: 0
  Total Legal Claims: 0

Evidence by Type:
  .eml: 152
  .pdf: 178
  .png: 87
  .mp3: 20

Date Range:
  Earliest: 03/15/2024
  Latest: 11/10/2025
```

---

## Verification

### Test 1: Search Evidence

```bash
agentdb-legal search "accommodation request"
```

**Expected**: Should return evidence items with Bates numbers, filenames, dates, and parties.

### Test 2: Query Timeline

```bash
agentdb-legal timeline --from 2024-12-01 --to 2024-12-31
```

**Expected**: Should return timeline events (if any have been added).

### Test 3: Find Bates Number

```bash
agentdb-legal find-bates CAST-0001
```

**Expected**: Should return details for CAST-0001.

### Test 4: Interactive Chat (Requires API Key)

```bash
agentdb-legal chat
```

**Expected**: Should enter interactive mode. Type "Show all evidence" to test.

### Test 5: Database Statistics

```bash
agentdb-legal stats
```

**Expected**: Should show overview of database contents.

---

## Troubleshooting

### Issue 1: "AgentDB not found"

**Solution:**
```bash
npm install -g agentdb
# Or use npx
npx agentdb --version
```

### Issue 2: "Database not found: pro-se-castillo"

**Solution:**
```bash
./init-database.sh
# Or manually
npx agentdb init --database pro-se-castillo
```

### Issue 3: "ANTHROPIC_API_KEY required"

**Solution:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# Or add to .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

### Issue 4: "pdftotext: command not found"

**Solution:**
```bash
# Linux
sudo apt install poppler-utils

# macOS
brew install poppler
```

### Issue 5: "Permission denied: ./init-database.sh"

**Solution:**
```bash
chmod +x init-database.sh
```

### Issue 6: TypeScript Compilation Errors

**Solution:**
```bash
npm install --save-dev typescript @types/node
npm run build
```

### Issue 7: "Cannot find module '@anthropic-ai/sdk'"

**Solution:**
```bash
npm install @anthropic-ai/sdk commander chalk dotenv table
```

### Issue 8: Evidence Processing Fails

**Check:**
1. Evidence directory exists: `ls -la ../evidence`
2. Files are readable: `ls -lh ../evidence`
3. Sufficient disk space: `df -h`

**Solution:**
```bash
# Verify evidence directory
mkdir -p /home/user/agentic-flow/docs/pro-se-platform/evidence

# Check permissions
chmod 755 /home/user/agentic-flow/docs/pro-se-platform/evidence
```

---

## Next Steps

After successful installation:

1. **Process Evidence**: Run `node evidence-processor.ts` to ingest all evidence
2. **Build Timeline**: Manually add timeline events via SQL or CSV import
3. **Define Claims**: Add legal claims with supporting evidence
4. **Start Querying**: Use `agentdb-legal search`, `timeline`, `validate-claim`
5. **Interactive Mode**: Use `agentdb-legal chat` for natural language queries

---

## Support

For issues or questions:

- **User Guide**: See `USER-GUIDE.md` for command reference
- **Architecture**: See `ARCHITECTURE.md` for system design
- **Repository**: https://github.com/ruvnet/agentic-flow
- **AgentDB Docs**: https://github.com/ruvnet/agentdb

---

**Setup Guide v1.0.0**
Castillo v. Schwab & Sedgwick
November 16, 2025
