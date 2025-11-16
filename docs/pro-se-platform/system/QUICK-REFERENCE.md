# Quick Reference - AgentDB Legal Assistant
**Castillo v. Schwab & Sedgwick**

Fast command reference for daily use.

---

## Installation (One-Time)

```bash
# Navigate to system directory
cd /home/user/agentic-flow/docs/pro-se-platform/system

# Install dependencies
npm install

# Initialize database
./init-database.sh

# Set API key
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## Daily Commands

### Search Evidence

```bash
# Basic search
agentdb-legal search "accommodation request"

# Semantic search (AI-powered)
agentdb-legal search "retaliation after disability disclosure" --semantic

# With content preview
agentdb-legal search "FMLA interference" --content
```

### Query Timeline

```bash
# Last 30 days
agentdb-legal timeline --from 2024-10-15 --to 2024-11-16

# Specific phase
agentdb-legal timeline --phase "Phase 2: Retaliation"

# By category
agentdb-legal timeline --category accommodation
```

### Validate Claims

```bash
agentdb-legal validate-claim "ADA Retaliation"
agentdb-legal validate-claim "FMLA Interference"
agentdb-legal validate-claim "ERISA § 510"
agentdb-legal validate-claim "SOX Whistleblower"
```

### Find Evidence

```bash
# By Bates number
agentdb-legal find-bates CAST-0042

# With related evidence
agentdb-legal find-bates CAST-0042 --related
```

### Correlation Analysis

```bash
# Medical events with workplace actions
agentdb-legal correlate medical-events

# Sedgwick anomalies
agentdb-legal sedgwick-anomalies

# Backdating detection
agentdb-legal sedgwick-anomalies --type backdating
```

### Statistics

```bash
# Database overview
agentdb-legal stats
```

### Interactive Chat

```bash
# Start chat mode (requires API key)
agentdb-legal chat

# Example queries:
# - "Show all evidence for FMLA interference"
# - "Timeline of BP spikes with manager interactions"
# - "Audio recordings mentioning accommodation"
# - "Sedgwick DCNs with backdated timestamps"
```

---

## Evidence Processing

```bash
# Process new evidence
node evidence-processor.ts ../evidence

# Process specific directory
node evidence-processor.ts /path/to/new/evidence
```

---

## Common Queries

### Find All Evidence for a Claim

```bash
agentdb-legal search "ADA retaliation" --semantic --limit 50
```

### Timeline of Critical Period

```bash
agentdb-legal timeline --from 2024-12-01 --to 2025-01-31
```

### Medical Correlation

```bash
agentdb-legal correlate medical-events --from 2024-12-01 --to 2025-01-31
```

### Check Claim Strength

```bash
agentdb-legal validate-claim "ADA Retaliation"
```

### Find Related Evidence

```bash
agentdb-legal find-bates CAST-0042 --related
```

### Detect Spoliation

```bash
agentdb-legal sedgwick-anomalies --type backdating
agentdb-legal sedgwick-anomalies --type duplicate
```

---

## Keyboard Shortcuts (Chat Mode)

- **Ctrl+C** or **Ctrl+D**: Exit chat mode
- **Up Arrow**: Previous command
- **Down Arrow**: Next command
- Type **exit** or **quit**: Exit chat mode

---

## File Locations

- **Database**: `/home/user/agentic-flow/docs/pro-se-platform/system/pro-se-castillo.db`
- **Evidence**: `/home/user/agentic-flow/docs/pro-se-platform/evidence/`
- **Config**: `/home/user/agentic-flow/docs/pro-se-platform/system/.env`
- **Catalog**: `/home/user/agentic-flow/docs/pro-se-platform/evidence/BATES-CATALOG.md`

---

## Troubleshooting

### Database Not Found

```bash
./init-database.sh
```

### API Key Missing

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### No Results Found

```bash
# Try semantic search
agentdb-legal search "keyword" --semantic

# Check database
agentdb-legal stats
```

### Permission Denied

```bash
chmod +x init-database.sh
chmod +x agentdb-legal-cli.ts
```

---

## Support

- **User Guide**: `USER-GUIDE.md`
- **Setup Guide**: `SETUP-GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`

---

**Quick Reference v1.0.0**
Castillo v. Schwab & Sedgwick
