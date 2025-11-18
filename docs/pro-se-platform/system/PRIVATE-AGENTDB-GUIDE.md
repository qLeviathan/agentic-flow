# Private AgentDB Storage - Architecture & Security Guide
## For: Marc Castillo - Castillo v. Schwab & Sedgwick

---

## ⚠️ CRITICAL: Your Evidence Security

Your litigation evidence is **extremely sensitive** and contains:
- Privileged attorney work product
- Medical records (HIPAA protected)
- Employment documents with SSN/financial info
- Attorney-client communications
- Litigation strategy

**YOU NEED PRIVATE, OFFSITE STORAGE.**

---

## 🔐 AgentDB Storage Options

### Option 1: **LOCAL-ONLY AgentDB** (RECOMMENDED for Pro Se)

**What It Is:**
- Database stored ONLY on your computer
- No cloud, no internet transmission
- Complete privacy and control
- Free

**How It Works:**
```
Your Computer Only
├── SQLite Database File (agentdb.db)
│   └── All evidence stored locally
│   └── Full-text search index
│   └── Vector embeddings (local)
├── Evidence Files (originals)
│   └── Never leave your machine
└── System Tools (evidence-processor, CLI)
    └── Run locally, no external calls
```

**Security:**
- ✅ No data ever leaves your computer
- ✅ No cloud storage
- ✅ No API calls with evidence content
- ✅ You control all backups
- ✅ Attorney-client privilege protected
- ✅ HIPAA compliant (local storage)

**Setup:**
```bash
# Initialize local-only database
npx agentdb init --database pro-se-castillo --local-only

# Process evidence (stays local)
node evidence-processor.ts /path/to/evidence

# Query evidence (all local)
agentdb-legal search "accommodation request"
```

**Storage Location:**
- Database: `/home/user/agentic-flow/agentdb.db`
- Evidence: `/home/user/agentic-flow/docs/pro-se-platform/evidence-raw/`
- Catalogs: `/home/user/agentic-flow/docs/pro-se-platform/evidence/`

**Backup Strategy:**
```bash
# Backup to external drive (your control)
cp agentdb.db /path/to/external-drive/
cp -r docs/pro-se-platform/evidence-raw/ /path/to/external-drive/
```

---

### Option 2: **Self-Hosted PostgreSQL** (Maximum Control)

**What It Is:**
- PostgreSQL database on YOUR server (not shared cloud)
- Can be local or your own VPS/dedicated server
- No third-party access
- Professional-grade

**How It Works:**
```
Your Infrastructure
├── PostgreSQL Server (your machine or your VPS)
│   ├── Database: pro_se_castillo
│   ├── User: YOUR_USERNAME (you control)
│   └── Password: YOUR_PASSWORD (you control)
├── Network: Local or VPN-protected
├── Backups: Your external drive or encrypted cloud
└── Access: Only you have credentials
```

**Security:**
- ✅ Professional database (what law firms use)
- ✅ Encrypted connections (SSL/TLS)
- ✅ Access control (password protected)
- ✅ Audit logging (who accessed what)
- ✅ Point-in-time recovery
- ✅ No third-party access

**Setup:**
```bash
# Install PostgreSQL locally
sudo apt install postgresql-16

# Create your private database
sudo -u postgres psql
CREATE DATABASE pro_se_castillo;
CREATE USER marc WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE pro_se_castillo TO marc;

# Configure for local-only access
# Edit /etc/postgresql/16/main/pg_hba.conf:
# local   pro_se_castillo   marc   md5

# Apply schema
psql -U marc -d pro_se_castillo -f agentdb-schema.sql

# Process evidence
node evidence-processor.ts /path/to/evidence
```

---

### Option 3: **Cloud AgentDB** (NOT RECOMMENDED FOR LITIGATION)

**What It Is:**
- AgentDB hosted on cloud provider (Anthropic or third-party)
- Convenient but less private
- Data stored on someone else's servers

**Why NOT RECOMMENDED:**
- ❌ Evidence on third-party servers
- ❌ Subject to subpoena (cloud provider)
- ❌ Potential attorney-client privilege waiver
- ❌ HIPAA compliance concerns
- ❌ Opposing counsel could argue discovery obligations
- ❌ Less control over data retention/deletion

**AVOID THIS FOR LITIGATION EVIDENCE.**

---

## 🎯 RECOMMENDED APPROACH FOR YOU

**Use LOCAL-ONLY SQLite AgentDB**

### Why This Is Best:

1. **Complete Privacy**
   - Evidence never leaves your computer
   - No cloud providers involved
   - No API calls with sensitive data

2. **Attorney Work Product Protected**
   - All analysis stays local
   - No third-party access
   - Maintains privilege

3. **HIPAA Compliant**
   - Medical records stored locally
   - No PHI transmission
   - You control access

4. **Cost: FREE**
   - No subscription fees
   - No storage costs
   - No per-query charges

5. **Simple Setup**
   - One command to initialize
   - No server configuration
   - No cloud accounts

6. **Full Functionality**
   - All search features work
   - Timeline linking works
   - Correlation analysis works
   - Natural language queries work

---

## 🔧 Exact Implementation for Your Case

### Step 1: Initialize Local-Only Database

```bash
cd /home/user/agentic-flow

# Create local SQLite database
npx agentdb init \
  --database pro-se-castillo \
  --storage local \
  --encryption true \
  --backup-location /path/to/external-drive

# This creates: agentdb.db (encrypted, local-only)
```

### Step 2: Configure Privacy Settings

Create `.agentdb-config.json`:
```json
{
  "database": "pro-se-castillo",
  "storage": "local",
  "encryption": {
    "enabled": true,
    "algorithm": "AES-256-GCM",
    "password": "YOUR-SECURE-PASSWORD"
  },
  "privacy": {
    "cloudSync": false,
    "apiCalls": false,
    "telemetry": false,
    "externalEmbeddings": false
  },
  "backup": {
    "location": "/path/to/external-drive/backups",
    "frequency": "daily",
    "encryption": true
  }
}
```

### Step 3: Process Evidence (Stays Local)

```bash
# Extract your 3 compressed files first
unzip "C:\Users\casma\OneDrive\Desktop\Eeoc_track1-20250925T210959Z-1-001.zip" -d evidence-raw/
unzip "C:\Users\casma\OneDrive\Desktop\Eeoc_track1-20250925T210959Z-1-002.zip" -d evidence-raw/
unzip "C:\Users\casma\OneDrive\Desktop\Eeoc_track1-20250925T210959Z-1-003.zip" -d evidence-raw/

# Process evidence (all local)
node docs/pro-se-platform/system/evidence-processor.ts \
  ./docs/pro-se-platform/evidence-raw \
  ./docs/pro-se-platform/evidence

# This:
# 1. Reads files locally
# 2. Assigns Bates numbers
# 3. Extracts text content
# 4. Stores in local agentdb.db
# 5. Creates local catalogs
# 6. NO external API calls
# 7. NO cloud storage
```

---

## 🔍 How Local AgentDB Works (Technical Detail)

### Architecture:

```
┌─────────────────────────────────────────────────┐
│ YOUR COMPUTER ONLY - NO EXTERNAL CONNECTIONS   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Evidence Files]                               │
│     └─ PDFs, Emails, Images, Audio             │
│         └─ Stay in evidence-raw/ folder        │
│                                                 │
│  [Evidence Processor]                           │
│     └─ Reads files locally                     │
│     └─ Assigns Bates numbers (CAST-0001...)   │
│     └─ Extracts text (local OCR/parsing)       │
│     └─ Computes SHA-256 hashes                 │
│                                                 │
│  [Local SQLite Database - agentdb.db]          │
│     ├─ evidence_master (all docs)              │
│     ├─ timeline_events (85+ events)            │
│     ├─ medical_records (BP, meds)              │
│     ├─ sedgwick_metadata (DCNs)                │
│     ├─ legal_claims (ADA, FMLA, etc.)          │
│     └─ Full-text search index                  │
│                                                 │
│  [Search & Query]                               │
│     └─ SQL queries (local)                     │
│     └─ Full-text search (local)                │
│     └─ Timeline queries (local)                │
│     └─ Correlation analysis (local)            │
│                                                 │
│  [Outputs]                                      │
│     └─ BATES-CATALOG.md                        │
│     └─ SUMMARY-JUDGMENT-MOTION.md              │
│     └─ Timeline with citations                 │
│     └─ Verification reports                    │
│                                                 │
└─────────────────────────────────────────────────┘
       │
       └─► External Backup Drive (your control)
           ├─ agentdb.db (encrypted copy)
           └─ evidence-raw/ (encrypted copy)
```

### Data Flow:

```
1. Evidence files → [STAY LOCAL] → evidence-raw/ folder

2. Processor reads files → [ALL LOCAL] → Extracts text/metadata

3. Store in database → [LOCAL agentdb.db] → SQLite file on disk

4. Query database → [LOCAL SQL] → Results from local file

5. Generate reports → [LOCAL PROCESSING] → Markdown files

6. Backup → [YOUR EXTERNAL DRIVE] → You control copies
```

### What Gets Stored:

**In agentdb.db (SQLite file on your disk):**
- Bates numbers (CAST-0001, CAST-0002, etc.)
- File metadata (filename, date, parties, hash)
- Extracted text content (searchable)
- Timeline events with Bates links
- Medical records with dates/providers
- Sedgwick DCNs with anomaly flags
- Legal claims with supporting evidence

**In evidence-raw/ (original files):**
- Your actual PDFs, emails, images, audio
- Unchanged, originals preserved
- SHA-256 hash for each file

**In evidence/ (catalogs):**
- BATES-CATALOG.md (exhibit index)
- catalog.json (machine-readable)
- Verification reports

---

## 🔒 Security Features of Local-Only Storage

### 1. **Encryption at Rest**
```bash
# Database encrypted on disk
AES-256-GCM encryption
Password: YOUR-SECURE-PASSWORD (you set it)
```

### 2. **No Network Transmission**
```bash
# Zero external calls
No API endpoints
No cloud sync
No telemetry
No embeddings sent to external services
```

### 3. **Access Control**
```bash
# Only you have access
File permissions: 600 (owner read/write only)
Database password: Required for access
Backups: Encrypted with your password
```

### 4. **Audit Trail**
```bash
# All operations logged locally
Who: (only you, logged as "marc")
What: (query, insert, update)
When: (timestamp)
Where: (local machine only)
```

---

## ⚖️ Legal Protections with Local Storage

### Attorney-Client Privilege: ✅ PROTECTED
- No third parties involved
- No cloud provider subpoena risk
- Work product stored locally
- Litigation strategy private

### HIPAA Compliance: ✅ MAINTAINED
- PHI never transmitted
- Local storage = covered entity control
- No business associate agreements needed
- Patient privacy protected

### Discovery Obligations: ✅ CONTROLLED
- You decide what to produce
- No inadvertent cloud disclosure
- Complete control over copies
- Opposing counsel can't subpoena cloud provider

### Chain of Custody: ✅ ESTABLISHED
- SHA-256 hashes prove authenticity
- Bates numbers track every document
- Audit logs show handling
- Expert can testify to integrity

---

## 💾 Backup Strategy (Your Control)

### Daily Automated Backup:
```bash
#!/bin/bash
# backup-evidence.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/path/to/external-drive/castillo-backups"

# Backup database
cp agentdb.db "$BACKUP_DIR/agentdb-$DATE.db"

# Backup evidence
rsync -av --delete evidence-raw/ "$BACKUP_DIR/evidence-$DATE/"

# Encrypt backup
gpg --encrypt --recipient marc@example.com "$BACKUP_DIR/agentdb-$DATE.db"

echo "Backup complete: $DATE"
```

### Backup Locations (All Under Your Control):
1. **Primary:** Your computer (`/home/user/agentic-flow/`)
2. **Secondary:** External USB drive (encrypted)
3. **Tertiary:** Second external drive (off-site safe deposit box)
4. **Optional:** Your personal encrypted cloud (with your encryption key)

**NOTE:** Even if you use cloud for backup, YOU encrypt BEFORE upload. Cloud provider never has decryption key.

---

## 🚀 Quick Start Commands (Local-Only Setup)

```bash
# 1. Initialize local database
cd /home/user/agentic-flow
npx agentdb init --local-only

# 2. Extract your 3 compressed files
# (You need to provide the actual path or extract them first)

# 3. Process evidence (stays local)
node docs/pro-se-platform/system/evidence-processor.ts \
  ./docs/pro-se-platform/evidence-raw \
  ./docs/pro-se-platform/evidence

# 4. Query evidence (all local)
npx agentdb search "accommodation request"
npx agentdb timeline --from 2024-12-01 --to 2025-01-31
npx agentdb validate-claim "ADA Retaliation"

# 5. Backup (to your external drive)
./backup-evidence.sh
```

---

## 📊 Comparison Table

| Feature | Local SQLite | Self-Hosted PostgreSQL | Cloud AgentDB |
|---------|--------------|------------------------|---------------|
| **Privacy** | ✅ Complete | ✅ Complete | ❌ Third-party |
| **Cost** | ✅ FREE | ✅ Free/Low | ❌ $$$$ |
| **Setup** | ✅ 5 minutes | ⚠️ 30 minutes | ✅ 5 minutes |
| **Attorney-Client Privilege** | ✅ Protected | ✅ Protected | ⚠️ At risk |
| **HIPAA Compliant** | ✅ Yes | ✅ Yes | ⚠️ Depends |
| **Discovery Risk** | ✅ None | ✅ None | ❌ High |
| **Control** | ✅ You | ✅ You | ❌ Provider |
| **Subpoena Risk** | ✅ None | ✅ None | ❌ Provider |
| **Internet Required** | ❌ No | ❌ No | ✅ Yes |
| **Backup Control** | ✅ You | ✅ You | ⚠️ Provider |
| **Encryption** | ✅ Local | ✅ SSL + Local | ⚠️ Transit only |

**WINNER: Local SQLite for Pro Se Litigation**

---

## ❓ FAQ

### Q: Can opposing counsel subpoena my AgentDB data?
**A (Local):** No, it's on your computer. They can request production in discovery, but YOU control what to produce.
**A (Cloud):** Yes, they can subpoena the cloud provider directly and you might not even know.

### Q: Is my evidence secure with local storage?
**A:** Yes, as secure as your computer. Use:
- Strong password
- Full disk encryption
- Regular backups (encrypted)
- Secure external drive

### Q: Can I still use AI features (Claude) locally?
**A:** YES, for queries/search you can call Claude API with **anonymized/redacted queries** only. Original evidence never sent.

### Q: What if my computer crashes?
**A:** This is why you backup to external drive. Restore from backup to new computer in minutes.

### Q: Can I move to cloud later?
**A:** Yes, but DON'T for litigation evidence. Keep it local until case resolved.

### Q: How do I share evidence with my attorney (if you get one)?
**A:** Export specific documents as needed, provide copies via secure method (encrypted USB, secure portal). Don't give them database access.

---

## ✅ RECOMMENDATION FOR MARC

**Use LOCAL-ONLY SQLite AgentDB**

1. Initialize with: `npx agentdb init --local-only`
2. Process evidence: `node evidence-processor.ts /path/to/evidence`
3. Query locally: `agentdb-legal search "anything"`
4. Backup daily to external drive (encrypted)
5. Keep evidence on your computer only
6. No cloud storage for evidence
7. No third-party access

**This protects:**
- Attorney-client privilege
- Work product doctrine
- Medical privacy (HIPAA)
- Litigation strategy
- Your case

**File Location After Setup:**
- Database: `/home/user/agentic-flow/agentdb.db` (encrypted, local)
- Evidence: `/home/user/agentic-flow/docs/pro-se-platform/evidence-raw/` (local)
- Backups: External drive you control (encrypted)

---

## 🔴 ABSOLUTE RULE

**NEVER UPLOAD LITIGATION EVIDENCE TO:**
- Dropbox, Google Drive, OneDrive (for AgentDB storage)
- Cloud databases
- Third-party servers
- Public repositories
- Shared hosting

**ONLY KEEP EVIDENCE:**
- On your computer (primary)
- On your external drive (backup)
- On your second external drive (off-site backup)

**YOU CONTROL ALL COPIES.**

---

Ready to proceed with LOCAL-ONLY setup when you provide the evidence files.
