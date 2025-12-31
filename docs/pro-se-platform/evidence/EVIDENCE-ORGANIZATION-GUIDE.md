# Evidence Organization Guide
## Castillo v. Charles Schwab & Sedgwick - EEOC Charge No. 440-2025-07355

---

## Directory Structure

Create this folder hierarchy in your Google Drive or local storage:

```
Evidence/
├── 01-Employment/
│   └── [CAST-EMP-####] Offer letters, employment docs
├── 02-Medical/
│   └── [CAST-MED-####] Provider records, prescriptions, BP logs
│   └── ⚠️ HIPAA-PRIVILEGED - Mark for protective order
├── 03-Accommodation/
│   └── [CAST-ACC-####] HRC cases, ADA requests, forms
├── 04-Manager-Communications/
│   └── [CAST-MGR-####] Babchuk emails, texts, meeting notes
├── 05-HR-Communications/
│   └── [CAST-HR-####] Chrystal, Robert Kilgore, Workday logs
├── 06-Sedgwick/
│   ├── Approvals/
│   ├── Denials/
│   ├── Metadata-DCN/
│   └── [CAST-SED-####] All Sedgwick correspondence
├── 07-Recordings/
│   └── [CAST-REC-####] April 11, April 16 recordings + transcripts
├── 08-Cyber-Evidence/
│   └── [CAST-CYBER-####] Login logs, Zscaler, email bounce
├── 09-Return-To-Work/
│   └── [CAST-RTW-####] April 2025 RTW documentation
├── 10-Termination/
│   └── [CAST-TRM-####] Threat letters, termination notices
├── 11-EEOC/
│   └── [CAST-EEOC-####] Charge, mediation, position statements
└── 12-Exhibits-Production/
    └── [Final Bates-stamped PDFs for production]
```

---

## File Naming Convention

```
CAST-[CAT]-[####]_[YYYY-MM-DD]_[short-description].pdf

Examples:
CAST-MGR-0017_2024-12-03_coaching-memo.pdf
CAST-REC-0002_2025-04-16_taylor-huffner-call.mp3
CAST-SED-0025_2025-04-16_DCN-simultaneous-approval-denial.pdf
```

---

## Category Codes

| Code | Category | Description |
|------|----------|-------------|
| EMP | Employment | Offer letters, employment agreements, policies |
| MED | Medical | Provider records, prescriptions, BP readings |
| ACC | Accommodation | ADA requests, HRC cases, accommodation forms |
| MGR | Manager | Babchuk communications, Egorov escalations |
| HR | Human Resources | Chrystal Hicks, Robert Kilgore, Workday metadata |
| SED | Sedgwick | All TPA correspondence, approvals, denials, DCN logs |
| REC | Recordings | Audio files and transcripts |
| CYBER | Cyber/Digital | Login anomalies, email deletion evidence |
| RTW | Return to Work | April 2025 return documentation |
| TRM | Termination | Threat letters, final termination |
| EEOC | EEOC | Charge, mediation, investigation documents |

---

## Priority Evidence for Rebuttal

### TIER 1: DESTROYS SPECIFIC SEYFARTH CLAIMS

| Bates | Seyfarth Claim | Your Evidence |
|-------|----------------|---------------|
| CAST-MGR-0001 | "Babchuk denies 2023 disclosure" (fn2) | Dec 2023 time-off approval for neuro eval |
| CAST-MGR-0002 | Same | Feb 2024 written disclosure email |
| CAST-SED-0024 | "Castillo said he couldn't work" | Full context: "cannot perform due to need for accommodation" |
| CAST-REC-0002 | "Castillo couldn't work without different manager" | Recording shows ultimatum given |
| CAST-ACC-0013 | "No documentation for leave" | Kay Bristow acknowledges approved leave 4/17-6/30 |
| CAST-HR-0008 | "Review auto-advanced" | Robert Kilgore manually advanced at 08:26:12 |
| CAST-HR-0016 | "Review completed after leave" | Metadata: completed 11/11, refs Dec 3 memo |
| CAST-SED-0025 | N/A - Manipulation evidence | Simultaneous approval/denial same timestamp |

### TIER 2: PATTERN EVIDENCE

| Pattern | Evidence Range | Purpose |
|---------|----------------|---------|
| Medical escalation | CAST-MED-0001 → CAST-MED-0025 | Causation chain |
| Documentation provided | CAST-ACC-0001 → CAST-ACC-0014 | Rebuts "failed to engage" |
| Sedgwick manipulation | CAST-SED-0001 → CAST-SED-0042 | ERISA violations |
| Retaliation timing | CAST-SED-0001 → CAST-MGR-0017 | <24 hours FMLA to coaching memo |

### TIER 3: SPOLIATION EVIDENCE

| Bates | Event |
|-------|-------|
| CAST-MGR-0023 | Dec 16 email deletion text request |
| CAST-SED-0009 | Redacted document discovery |
| CAST-CYBER-0001 | Simultaneous unauthorized logins |
| CAST-CYBER-0002 | Email account deleted/cold storage Sept 8 |

---

## How to Populate the Index

1. **Open MASTER-BATES-INDEX.csv in Excel/Google Sheets**

2. **For each document you have:**
   - Find the matching row by DATE and DESCRIPTION
   - Add the SHA-256 HASH (use: `shasum -a 256 filename.pdf`)
   - Update FILE_PATH to your actual location
   - Mark PRIVILEGED if medical/attorney-client

3. **For documents not in the index:**
   - Add new row with next sequential BATES_NO in category
   - Follow naming convention

4. **Export production copies:**
   - Convert all native files to PDF
   - Apply Bates stamp to each page
   - Save to `12-Exhibits-Production/`

---

## Hash Verification Command

```bash
# Single file
shasum -a 256 document.pdf

# All files in folder
find . -type f -name "*.pdf" -exec shasum -a 256 {} \;
```

---

## Production Checklist

- [ ] All 150 entries have FILE_PATH populated
- [ ] All non-privileged docs have HASH computed
- [ ] HIPAA docs marked for protective order
- [ ] Recordings transcribed
- [ ] Metadata screenshots captured for manipulation evidence
- [ ] Bates stamps applied to production copies

---

## Next Steps

1. **YOU DO:** Organize physical/digital files into directory structure
2. **YOU DO:** Populate FILE_PATH and HASH columns
3. **SYSTEM DOES:** Generate attack matrix linking evidence to Seyfarth claims
4. **SYSTEM DOES:** Draft rebuttal using evidence citations
5. **YOU REVIEW:** Verify accuracy before filing

---

## Critical Questions Before Proceeding

1. Do you have the **April 16 Taylor Huffner recording** transcribed?
2. Do you have the **Schwab→Sedgwick April 16 email** captured?
3. What did **Nia Moore say Dec 30**? (Needed for charge update)
4. Do you have **Kay Bristow's July 31 letter** showing approved leave?

These four items are your nuclear weapons. Confirm you have them secured.
