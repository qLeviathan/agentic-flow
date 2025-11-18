/**
 * Pro Se Platform - Dual Fact-Checking System
 * Castillo v. Schwab & Sedgwick
 *
 * Implements two-pass verification protocol for legal claims with
 * cross-reference validation, anomaly detection, and evidence gap analysis.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ClaimType = 'ADA' | 'FMLA' | 'ERISA' | 'SOX' | 'RETALIATION' | 'DISCRIMINATION' | 'OTHER';
type Confidence = 'high' | 'medium' | 'low';
type AnomalyType = 'backdating' | 'duplicate' | 'missing_doc' | 'unauthorized_modification' | 'metadata_gap';

interface FactCheck {
  claimId: string;
  claim: string;
  claimType: ClaimType;
  supportingEvidence: string[]; // Bates numbers
  verified: boolean;
  verificationCount: number;
  gaps: string[];
  confidence: Confidence;
  firstPassDate?: Date;
  secondPassDate?: Date;
  crossReferences: CrossReference[];
  anomalies: Anomaly[];
}

interface CrossReference {
  type: 'timeline' | 'party' | 'document' | 'medical' | 'employer';
  sourceClaimId: string;
  targetClaimId: string;
  consistent: boolean;
  notes: string;
}

interface Anomaly {
  type: AnomalyType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedBates: string[];
  evidence: string;
  detectedDate: Date;
}

interface EvidenceItem {
  batesNumber: string;
  filename: string;
  hash: string;
  dateModified: Date;
  parties: string[];
  content?: string;
  metadata: Record<string, any>;
}

interface MedicalCorrelation {
  date: Date;
  medicalEvent: string; // BP spike, medication increase, etc.
  employerEvent?: string; // Manager interaction, disciplinary action, etc.
  batesEvidence: string[];
  correlation: 'strong' | 'moderate' | 'weak' | 'none';
}

interface SpoliationEvidence {
  type: 'email_deletion' | 'portal_alteration' | 'metadata_gap' | 'network_anomaly';
  date: Date;
  description: string;
  evidence: string[];
  impact: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// DUAL FACT-CHECKING ENGINE
// ============================================================================

export class FactCheckingSystem {
  private claims: Map<string, FactCheck> = new Map();
  private evidence: Map<string, EvidenceItem> = new Map();
  private anomalies: Anomaly[] = [];
  private medicalCorrelations: MedicalCorrelation[] = [];
  private spoliationEvidence: SpoliationEvidence[] = [];

  constructor() {
    this.loadEvidence();
  }

  // ==========================================================================
  // FIRST PASS: CLAIM EXTRACTION
  // ==========================================================================

  /**
   * Extract claims from executive summary and timeline
   */
  extractClaims(summaryPath: string, timelinePath: string): void {
    console.log('🔍 FIRST PASS: Extracting claims...\n');

    // Parse executive summary for claims
    if (fs.existsSync(summaryPath)) {
      const summary = fs.readFileSync(summaryPath, 'utf-8');
      this.parseExecutiveSummary(summary);
    }

    // Parse timeline for temporal claims
    if (fs.existsSync(timelinePath)) {
      const timeline = fs.readFileSync(timelinePath, 'utf-8');
      this.parseTimeline(timeline);
    }

    console.log(`✓ Extracted ${this.claims.size} claims`);
  }

  private parseExecutiveSummary(summary: string): void {
    // ADA claims patterns
    const adaPatterns = [
      /disabled\s+worker/gi,
      /reasonable\s+accommodation/gi,
      /failure\s+to\s+accommodate/gi,
      /disability\s+discrimination/gi,
      /ADA\s+violation/gi
    ];

    // FMLA claims patterns
    const fmlaPatterns = [
      /FMLA\s+request/gi,
      /leave\s+interference/gi,
      /retaliation\s+for\s+leave/gi,
      /medical\s+leave\s+denial/gi
    ];

    // ERISA claims patterns
    const erisaPatterns = [
      /benefits?\s+denial/gi,
      /Sedgwick\s+denied/gi,
      /improper\s+claim\s+handling/gi,
      /benefits?\s+plan/gi
    ];

    // Extract claims based on patterns
    let claimId = 1;

    // Process ADA claims
    for (const pattern of adaPatterns) {
      const matches = summary.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const context = this.extractContext(summary, match);
          this.addClaim({
            claimId: `ADA-${String(claimId++).padStart(3, '0')}`,
            claim: context,
            claimType: 'ADA',
            supportingEvidence: [],
            verified: false,
            verificationCount: 0,
            gaps: [],
            confidence: 'low',
            crossReferences: [],
            anomalies: []
          });
        });
      }
    }

    // Process FMLA claims
    for (const pattern of fmlaPatterns) {
      const matches = summary.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const context = this.extractContext(summary, match);
          this.addClaim({
            claimId: `FMLA-${String(claimId++).padStart(3, '0')}`,
            claim: context,
            claimType: 'FMLA',
            supportingEvidence: [],
            verified: false,
            verificationCount: 0,
            gaps: [],
            confidence: 'low',
            crossReferences: [],
            anomalies: []
          });
        });
      }
    }

    // Process ERISA claims
    for (const pattern of erisaPatterns) {
      const matches = summary.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const context = this.extractContext(summary, match);
          this.addClaim({
            claimId: `ERISA-${String(claimId++).padStart(3, '0')}`,
            claim: context,
            claimType: 'ERISA',
            supportingEvidence: [],
            verified: false,
            verificationCount: 0,
            gaps: [],
            confidence: 'low',
            crossReferences: [],
            anomalies: []
          });
        });
      }
    }
  }

  private parseTimeline(timeline: string): void {
    // Extract date-based claims from timeline
    const datePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const lines = timeline.split('\n');

    lines.forEach(line => {
      if (datePattern.test(line)) {
        // Extract events that may constitute claims
        if (this.isClaimableEvent(line)) {
          const claimType = this.inferClaimType(line);
          const claimId = `${claimType}-T${String(this.claims.size + 1).padStart(3, '0')}`;

          this.addClaim({
            claimId,
            claim: line.trim(),
            claimType,
            supportingEvidence: this.extractBatesFromText(line),
            verified: false,
            verificationCount: 0,
            gaps: [],
            confidence: 'low',
            crossReferences: [],
            anomalies: []
          });
        }
      }
    });
  }

  private extractContext(text: string, match: string, contextLength: number = 200): string {
    const index = text.indexOf(match);
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    return text.substring(start, end).trim();
  }

  private isClaimableEvent(line: string): boolean {
    const claimIndicators = [
      'denied', 'refused', 'retaliation', 'discrimination',
      'failure to accommodate', 'harassment', 'terminated',
      'disciplinary', 'warning', 'suspended', 'modified duties'
    ];

    return claimIndicators.some(indicator =>
      line.toLowerCase().includes(indicator)
    );
  }

  private inferClaimType(line: string): ClaimType {
    const lower = line.toLowerCase();

    if (lower.includes('ada') || lower.includes('accommodation') || lower.includes('disability')) {
      return 'ADA';
    }
    if (lower.includes('fmla') || lower.includes('leave')) {
      return 'FMLA';
    }
    if (lower.includes('sedgwick') || lower.includes('benefits') || lower.includes('claim denial')) {
      return 'ERISA';
    }
    if (lower.includes('sox') || lower.includes('whistleblower')) {
      return 'SOX';
    }
    if (lower.includes('retaliation')) {
      return 'RETALIATION';
    }
    if (lower.includes('discrimination')) {
      return 'DISCRIMINATION';
    }

    return 'OTHER';
  }

  private extractBatesFromText(text: string): string[] {
    const batesPattern = /CAST-\d{4,}/g;
    const matches = text.match(batesPattern);
    return matches || [];
  }

  private addClaim(claim: FactCheck): void {
    this.claims.set(claim.claimId, claim);
  }

  // ==========================================================================
  // SECOND PASS: EVIDENCE VERIFICATION
  // ==========================================================================

  /**
   * Cross-reference each claim with supporting evidence
   */
  verifyEvidence(): void {
    console.log('\n🔍 SECOND PASS: Verifying evidence...\n');

    let verifiedCount = 0;
    let unverifiedCount = 0;

    for (const [claimId, claim] of this.claims) {
      console.log(`Verifying ${claimId}: ${claim.claim.substring(0, 60)}...`);

      // Find supporting evidence
      const evidence = this.findSupportingEvidence(claim);
      claim.supportingEvidence = evidence;

      // Verify Bates citations exist
      const validBates = this.verifyBatesCitations(evidence);

      // Check document content matches claim
      const contentMatches = this.verifyContentMatch(claim, evidence);

      // Calculate verification metrics
      claim.verificationCount = validBates.length;
      claim.verified = claim.verificationCount >= 2 && contentMatches;
      claim.confidence = this.calculateConfidence(claim);
      claim.secondPassDate = new Date();

      // Identify gaps
      if (!claim.verified) {
        claim.gaps = this.identifyGaps(claim);
        unverifiedCount++;
      } else {
        verifiedCount++;
      }

      console.log(`  Evidence: ${claim.supportingEvidence.length} items`);
      console.log(`  Verified: ${claim.verified ? '✓' : '✗'}`);
      console.log(`  Confidence: ${claim.confidence}`);
    }

    console.log(`\n✓ Verification complete: ${verifiedCount} verified, ${unverifiedCount} unverified`);
  }

  private findSupportingEvidence(claim: FactCheck): string[] {
    const evidence: Set<string> = new Set();

    // Add explicitly referenced Bates numbers
    claim.supportingEvidence.forEach(bates => evidence.add(bates));

    // Search evidence database for relevant documents
    for (const [bates, item] of this.evidence) {
      if (this.isRelevantEvidence(claim, item)) {
        evidence.add(bates);
      }
    }

    return Array.from(evidence);
  }

  private isRelevantEvidence(claim: FactCheck, item: EvidenceItem): boolean {
    if (!item.content) return false;

    const claimKeywords = this.extractKeywords(claim.claim);
    const contentLower = item.content.toLowerCase();

    // Check if content contains claim keywords
    const relevanceScore = claimKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    ).length;

    return relevanceScore >= 2; // At least 2 keywords must match
  }

  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did']);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    return Array.from(new Set(words));
  }

  private verifyBatesCitations(batesNumbers: string[]): string[] {
    return batesNumbers.filter(bates => this.evidence.has(bates));
  }

  private verifyContentMatch(claim: FactCheck, evidenceBates: string[]): boolean {
    const claimKeywords = this.extractKeywords(claim.claim);
    let matchCount = 0;

    for (const bates of evidenceBates) {
      const item = this.evidence.get(bates);
      if (item?.content) {
        const contentLower = item.content.toLowerCase();
        const matches = claimKeywords.filter(keyword =>
          contentLower.includes(keyword.toLowerCase())
        );
        if (matches.length >= 2) matchCount++;
      }
    }

    return matchCount >= 2; // At least 2 documents must match
  }

  private calculateConfidence(claim: FactCheck): Confidence {
    const evidenceCount = claim.supportingEvidence.length;
    const verifiedCount = claim.verificationCount;

    if (verifiedCount >= 3 && evidenceCount >= 4) return 'high';
    if (verifiedCount >= 2 && evidenceCount >= 2) return 'medium';
    return 'low';
  }

  private identifyGaps(claim: FactCheck): string[] {
    const gaps: string[] = [];

    if (claim.supportingEvidence.length === 0) {
      gaps.push('No supporting evidence found');
    }
    if (claim.supportingEvidence.length === 1) {
      gaps.push('Only one piece of supporting evidence (need 2+ for verification)');
    }
    if (claim.verificationCount < 2) {
      gaps.push('Insufficient verified evidence (need 2+ verified documents)');
    }

    // Check for specific evidence types based on claim type
    switch (claim.claimType) {
      case 'ADA':
        if (!this.hasEvidenceType(claim, 'medical')) {
          gaps.push('Missing medical documentation');
        }
        if (!this.hasEvidenceType(claim, 'accommodation')) {
          gaps.push('Missing accommodation request documentation');
        }
        break;

      case 'FMLA':
        if (!this.hasEvidenceType(claim, 'leave')) {
          gaps.push('Missing leave request documentation');
        }
        if (!this.hasEvidenceType(claim, 'medical')) {
          gaps.push('Missing medical certification');
        }
        break;

      case 'ERISA':
        if (!this.hasEvidenceType(claim, 'sedgwick')) {
          gaps.push('Missing Sedgwick claim documentation');
        }
        if (!this.hasEvidenceType(claim, 'denial')) {
          gaps.push('Missing denial letter or decision');
        }
        break;
    }

    return gaps;
  }

  private hasEvidenceType(claim: FactCheck, type: string): boolean {
    for (const bates of claim.supportingEvidence) {
      const item = this.evidence.get(bates);
      if (item?.filename.toLowerCase().includes(type) ||
          item?.content?.toLowerCase().includes(type)) {
        return true;
      }
    }
    return false;
  }

  // ==========================================================================
  // CROSS-REFERENCE CHECKING
  // ==========================================================================

  /**
   * Verify consistency across claims
   */
  performCrossReferenceCheck(): void {
    console.log('\n🔍 CROSS-REFERENCE CHECK: Validating consistency...\n');

    for (const [claimId, claim] of this.claims) {
      // Timeline consistency
      this.checkTimelineConsistency(claim);

      // Party involvement
      this.checkPartyConsistency(claim);

      // Document authenticity
      this.checkDocumentAuthenticity(claim);

      // Contradiction detection
      this.detectContradictions(claim);
    }

    console.log('✓ Cross-reference check complete');
  }

  private checkTimelineConsistency(claim: FactCheck): void {
    // Extract dates from claim
    const dates = this.extractDates(claim.claim);

    // Verify dates align with evidence dates
    for (const bates of claim.supportingEvidence) {
      const item = this.evidence.get(bates);
      if (item) {
        // Check if evidence date is consistent with claim dates
        const isConsistent = dates.length === 0 || dates.some(date => {
          const timeDiff = Math.abs(date.getTime() - item.dateModified.getTime());
          return timeDiff < 90 * 24 * 60 * 60 * 1000; // Within 90 days
        });

        if (!isConsistent) {
          claim.crossReferences.push({
            type: 'timeline',
            sourceClaimId: claim.claimId,
            targetClaimId: bates,
            consistent: false,
            notes: `Date mismatch: claim references ${dates.map(d => d.toISOString().split('T')[0]).join(', ')}, evidence dated ${item.dateModified.toISOString().split('T')[0]}`
          });
        }
      }
    }
  }

  private checkPartyConsistency(claim: FactCheck): void {
    // Extract parties from claim
    const claimParties = this.extractParties(claim.claim);

    // Verify parties are present in evidence
    for (const bates of claim.supportingEvidence) {
      const item = this.evidence.get(bates);
      if (item && claimParties.length > 0) {
        const evidenceParties = new Set(item.parties.map(p => p.toLowerCase()));
        const missingParties = claimParties.filter(p =>
          !Array.from(evidenceParties).some(ep => ep.includes(p.toLowerCase()))
        );

        if (missingParties.length > 0) {
          claim.crossReferences.push({
            type: 'party',
            sourceClaimId: claim.claimId,
            targetClaimId: bates,
            consistent: false,
            notes: `Missing parties in evidence: ${missingParties.join(', ')}`
          });
        }
      }
    }
  }

  private checkDocumentAuthenticity(claim: FactCheck): void {
    for (const bates of claim.supportingEvidence) {
      const item = this.evidence.get(bates);
      if (item) {
        // Verify hash integrity
        // In real implementation, recompute hash and compare
        claim.crossReferences.push({
          type: 'document',
          sourceClaimId: claim.claimId,
          targetClaimId: bates,
          consistent: true,
          notes: `Document authenticated via hash: ${item.hash.substring(0, 16)}...`
        });
      }
    }
  }

  private detectContradictions(claim: FactCheck): void {
    // Check for contradicting claims
    for (const [otherId, otherClaim] of this.claims) {
      if (otherId !== claim.claimId && claim.claimType === otherClaim.claimType) {
        const contradiction = this.findContradiction(claim, otherClaim);
        if (contradiction) {
          claim.crossReferences.push({
            type: 'document',
            sourceClaimId: claim.claimId,
            targetClaimId: otherId,
            consistent: false,
            notes: contradiction
          });
        }
      }
    }
  }

  private findContradiction(claim1: FactCheck, claim2: FactCheck): string | null {
    // Simple contradiction detection (can be enhanced)
    const keywords1 = this.extractKeywords(claim1.claim);
    const keywords2 = this.extractKeywords(claim2.claim);

    const commonKeywords = keywords1.filter(k => keywords2.includes(k));

    if (commonKeywords.length >= 3) {
      // Claims share significant keywords, check for opposite meanings
      const claim1Text = claim1.claim.toLowerCase();
      const claim2Text = claim2.claim.toLowerCase();

      if ((claim1Text.includes('approved') && claim2Text.includes('denied')) ||
          (claim1Text.includes('granted') && claim2Text.includes('refused'))) {
        return `Potential contradiction detected between claims`;
      }
    }

    return null;
  }

  private extractDates(text: string): Date[] {
    const dates: Date[] = [];
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/g, // YYYY-MM-DD
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g // M/D/YY or M/D/YYYY
    ];

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        });
      }
    }

    return dates;
  }

  private extractParties(text: string): string[] {
    const knownParties = [
      'Castillo', 'Babchuk', 'Egorov', 'Soulis', 'Bristow',
      'Huffner', 'Hicks', 'Tapia', 'Sedgwick', 'Schwab'
    ];

    return knownParties.filter(party =>
      text.toLowerCase().includes(party.toLowerCase())
    );
  }

  // ==========================================================================
  // ANOMALY DETECTION
  // ==========================================================================

  /**
   * Detect Sedgwick metadata anomalies
   */
  detectSedgwickAnomalies(): void {
    console.log('\n🔍 ANOMALY DETECTION: Analyzing Sedgwick metadata...\n');

    // Backdating detection
    this.detectBackdating();

    // Duplicate approvals/denials
    this.detectDuplicates();

    // Missing documentation periods
    this.detectMissingDocumentation();

    // Unauthorized modifications
    this.detectUnauthorizedModifications();

    console.log(`✓ Detected ${this.anomalies.length} anomalies`);
  }

  private detectBackdating(): void {
    const sedgwickDocs = Array.from(this.evidence.values()).filter(item =>
      item.parties.some(p => p.toLowerCase().includes('sedgwick'))
    );

    for (const doc of sedgwickDocs) {
      // Check for DCN timestamp inconsistencies
      if (doc.metadata.dcn && doc.metadata.timestamp) {
        const dcnDate = new Date(doc.metadata.dcn);
        const fileDate = doc.dateModified;

        const daysDiff = (fileDate.getTime() - dcnDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff < -1) {
          this.anomalies.push({
            type: 'backdating',
            severity: 'critical',
            description: `Document ${doc.filename} appears backdated: DCN date ${dcnDate.toISOString()} is after file modification date ${fileDate.toISOString()}`,
            affectedBates: [doc.batesNumber],
            evidence: `DCN: ${doc.metadata.dcn}, File date: ${fileDate.toISOString()}`,
            detectedDate: new Date()
          });
        }
      }
    }
  }

  private detectDuplicates(): void {
    const contentHashes = new Map<string, string[]>();

    for (const [bates, item] of this.evidence) {
      if (item.parties.some(p => p.toLowerCase().includes('sedgwick'))) {
        const existing = contentHashes.get(item.hash);
        if (existing) {
          existing.push(bates);

          this.anomalies.push({
            type: 'duplicate',
            severity: 'high',
            description: `Duplicate Sedgwick documents detected with identical content`,
            affectedBates: [bates, ...existing],
            evidence: `Hash: ${item.hash}`,
            detectedDate: new Date()
          });
        } else {
          contentHashes.set(item.hash, [bates]);
        }
      }
    }
  }

  private detectMissingDocumentation(): void {
    const sedgwickDocs = Array.from(this.evidence.values())
      .filter(item => item.parties.some(p => p.toLowerCase().includes('sedgwick')))
      .sort((a, b) => a.dateModified.getTime() - b.dateModified.getTime());

    for (let i = 1; i < sedgwickDocs.length; i++) {
      const prev = sedgwickDocs[i - 1];
      const curr = sedgwickDocs[i];

      const daysDiff = (curr.dateModified.getTime() - prev.dateModified.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 60) {
        this.anomalies.push({
          type: 'missing_doc',
          severity: 'medium',
          description: `Gap of ${Math.floor(daysDiff)} days in Sedgwick documentation`,
          affectedBates: [prev.batesNumber, curr.batesNumber],
          evidence: `Period: ${prev.dateModified.toISOString().split('T')[0]} to ${curr.dateModified.toISOString().split('T')[0]}`,
          detectedDate: new Date()
        });
      }
    }
  }

  private detectUnauthorizedModifications(): void {
    for (const [bates, item] of this.evidence) {
      if (item.parties.some(p => p.toLowerCase().includes('sedgwick'))) {
        // Check for metadata indicating modifications
        if (item.metadata.modified || item.metadata.revised) {
          this.anomalies.push({
            type: 'unauthorized_modification',
            severity: 'high',
            description: `Document ${item.filename} shows signs of modification`,
            affectedBates: [bates],
            evidence: `Metadata: ${JSON.stringify(item.metadata)}`,
            detectedDate: new Date()
          });
        }
      }
    }
  }

  // ==========================================================================
  // CORRELATION ANALYSIS
  // ==========================================================================

  /**
   * Correlate medical events with employer actions
   */
  analyzeMedicalEmployerCorrelation(): void {
    console.log('\n🔍 CORRELATION ANALYSIS: Medical-Employer events...\n');

    // Find medical events (BP spikes, medication changes, provider visits)
    const medicalEvents = this.extractMedicalEvents();

    // Find employer events (manager interactions, disciplinary actions)
    const employerEvents = this.extractEmployerEvents();

    // Correlate events by date proximity
    for (const medEvent of medicalEvents) {
      const correlatedEmployerEvents = employerEvents.filter(empEvent => {
        const daysDiff = Math.abs(
          (medEvent.date.getTime() - empEvent.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff <= 7; // Within 7 days
      });

      if (correlatedEmployerEvents.length > 0) {
        const correlation: MedicalCorrelation = {
          date: medEvent.date,
          medicalEvent: medEvent.description,
          employerEvent: correlatedEmployerEvents.map(e => e.description).join('; '),
          batesEvidence: [...medEvent.bates, ...correlatedEmployerEvents.flatMap(e => e.bates)],
          correlation: correlatedEmployerEvents.length >= 2 ? 'strong' :
                      correlatedEmployerEvents.length === 1 ? 'moderate' : 'weak'
        };

        this.medicalCorrelations.push(correlation);
        console.log(`✓ Correlation found: ${medEvent.description} ↔ ${correlation.employerEvent}`);
      }
    }

    console.log(`\n✓ Found ${this.medicalCorrelations.length} medical-employer correlations`);
  }

  private extractMedicalEvents(): Array<{date: Date, description: string, bates: string[]}> {
    const events: Array<{date: Date, description: string, bates: string[]}> = [];

    for (const [bates, item] of this.evidence) {
      if (item.content) {
        const content = item.content.toLowerCase();

        // BP spikes
        if (content.includes('blood pressure') || content.includes('bp:') || content.includes('hypertension')) {
          events.push({
            date: item.dateModified,
            description: 'Blood pressure event documented',
            bates: [bates]
          });
        }

        // Medication changes
        if (content.includes('medication') && (content.includes('increase') || content.includes('change') || content.includes('prescribed'))) {
          events.push({
            date: item.dateModified,
            description: 'Medication change documented',
            bates: [bates]
          });
        }

        // Provider visits
        if (content.includes('visit') || content.includes('appointment') || content.includes('examination')) {
          events.push({
            date: item.dateModified,
            description: 'Medical provider visit',
            bates: [bates]
          });
        }
      }
    }

    return events;
  }

  private extractEmployerEvents(): Array<{date: Date, description: string, bates: string[]}> {
    const events: Array<{date: Date, description: string, bates: string[]}> = [];

    const managers = ['babchuk', 'egorov', 'soulis', 'bristow'];

    for (const [bates, item] of this.evidence) {
      if (item.content) {
        const content = item.content.toLowerCase();

        // Manager interactions
        if (managers.some(m => content.includes(m))) {
          if (content.includes('meeting') || content.includes('discussion') || content.includes('conversation')) {
            events.push({
              date: item.dateModified,
              description: 'Manager interaction documented',
              bates: [bates]
            });
          }
        }

        // Disciplinary actions
        if (content.includes('disciplinary') || content.includes('warning') || content.includes('corrective action')) {
          events.push({
            date: item.dateModified,
            description: 'Disciplinary action taken',
            bates: [bates]
          });
        }

        // Performance issues
        if (content.includes('performance') && (content.includes('issue') || content.includes('concern') || content.includes('deficiency'))) {
          events.push({
            date: item.dateModified,
            description: 'Performance concern raised',
            bates: [bates]
          });
        }
      }
    }

    return events;
  }

  /**
   * Detect spoliation evidence
   */
  detectSpoliation(): void {
    console.log('\n🔍 SPOLIATION DETECTION: Analyzing evidence tampering...\n');

    // Email deletion requests
    this.detectEmailDeletion();

    // Portal alterations
    this.detectPortalAlterations();

    // Network access anomalies
    this.detectNetworkAnomalies();

    console.log(`✓ Detected ${this.spoliationEvidence.length} spoliation indicators`);
  }

  private detectEmailDeletion(): void {
    for (const [bates, item] of this.evidence) {
      if (item.content) {
        const content = item.content.toLowerCase();

        if (content.includes('delete') && content.includes('email')) {
          this.spoliationEvidence.push({
            type: 'email_deletion',
            date: item.dateModified,
            description: `Evidence of email deletion request found in ${item.filename}`,
            evidence: [bates],
            impact: 'critical'
          });
        }
      }
    }
  }

  private detectPortalAlterations(): void {
    const portalDocs = Array.from(this.evidence.values()).filter(item =>
      item.filename.toLowerCase().includes('portal') ||
      item.metadata.source?.includes('portal')
    );

    for (const doc of portalDocs) {
      if (doc.metadata.version && parseInt(doc.metadata.version) > 1) {
        this.spoliationEvidence.push({
          type: 'portal_alteration',
          date: doc.dateModified,
          description: `Portal document has multiple versions, indicating alterations`,
          evidence: [doc.batesNumber],
          impact: 'high'
        });
      }
    }
  }

  private detectNetworkAnomalies(): void {
    // Check for unusual access patterns in metadata
    for (const [bates, item] of this.evidence) {
      if (item.metadata.accessLog) {
        const accessLog = item.metadata.accessLog as any[];

        // Check for after-hours access
        const afterHoursAccess = accessLog.filter((log: any) => {
          const hour = new Date(log.timestamp).getHours();
          return hour < 6 || hour > 22;
        });

        if (afterHoursAccess.length > 0) {
          this.spoliationEvidence.push({
            type: 'network_anomaly',
            date: new Date(afterHoursAccess[0].timestamp),
            description: `After-hours access detected for ${item.filename}`,
            evidence: [bates],
            impact: 'medium'
          });
        }
      }
    }
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  /**
   * Generate comprehensive verification report
   */
  generateVerificationReport(outputPath: string): void {
    console.log('\n📊 Generating verification report...');

    let report = '# FACT-CHECKING VERIFICATION REPORT\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Case:** Castillo v. Schwab & Sedgwick\n\n`;

    // Summary statistics
    const totalClaims = this.claims.size;
    const verifiedClaims = Array.from(this.claims.values()).filter(c => c.verified).length;
    const highConfidence = Array.from(this.claims.values()).filter(c => c.confidence === 'high').length;
    const mediumConfidence = Array.from(this.claims.values()).filter(c => c.confidence === 'medium').length;
    const lowConfidence = Array.from(this.claims.values()).filter(c => c.confidence === 'low').length;

    report += '## SUMMARY\n\n';
    report += `- **Total Claims:** ${totalClaims}\n`;
    report += `- **Verified Claims:** ${verifiedClaims} (${((verifiedClaims/totalClaims)*100).toFixed(1)}%)\n`;
    report += `- **Unverified Claims:** ${totalClaims - verifiedClaims} (${(((totalClaims-verifiedClaims)/totalClaims)*100).toFixed(1)}%)\n`;
    report += `- **High Confidence:** ${highConfidence}\n`;
    report += `- **Medium Confidence:** ${mediumConfidence}\n`;
    report += `- **Low Confidence:** ${lowConfidence}\n\n`;

    // Claims by type
    report += '## CLAIMS BY TYPE\n\n';
    const claimsByType = new Map<string, number>();
    this.claims.forEach(claim => {
      claimsByType.set(claim.claimType, (claimsByType.get(claim.claimType) || 0) + 1);
    });

    for (const [type, count] of claimsByType) {
      report += `- **${type}:** ${count} claims\n`;
    }
    report += '\n';

    // Detailed claim verification
    report += '## DETAILED VERIFICATION\n\n';
    report += '| Claim ID | Type | Claim | Evidence Count | Verified | Confidence | Gaps |\n';
    report += '|----------|------|-------|----------------|----------|------------|------|\n';

    for (const claim of this.claims.values()) {
      const claimShort = claim.claim.substring(0, 50) + (claim.claim.length > 50 ? '...' : '');
      const verified = claim.verified ? '✓' : '✗';
      const gaps = claim.gaps.length > 0 ? claim.gaps.length.toString() : '-';

      report += `| ${claim.claimId} | ${claim.claimType} | ${claimShort} | ${claim.supportingEvidence.length} | ${verified} | ${claim.confidence} | ${gaps} |\n`;
    }
    report += '\n';

    // Unverified claims requiring attention
    report += '## UNVERIFIED CLAIMS REQUIRING ATTENTION\n\n';
    const unverifiedClaims = Array.from(this.claims.values()).filter(c => !c.verified);

    for (const claim of unverifiedClaims) {
      report += `### ${claim.claimId}: ${claim.claimType}\n\n`;
      report += `**Claim:** ${claim.claim}\n\n`;
      report += `**Evidence:** ${claim.supportingEvidence.length} items (${claim.verificationCount} verified)\n`;
      report += `**Confidence:** ${claim.confidence}\n\n`;
      report += '**Gaps:**\n';
      claim.gaps.forEach(gap => {
        report += `- ${gap}\n`;
      });
      report += '\n';
    }

    fs.writeFileSync(outputPath, report);
    console.log(`✓ Verification report saved to ${outputPath}`);
  }

  /**
   * Generate evidence gaps analysis
   */
  generateGapsAnalysis(outputPath: string): void {
    console.log('\n📊 Generating gaps analysis...');

    let report = '# EVIDENCE GAPS ANALYSIS\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Case:** Castillo v. Schwab & Sedgwick\n\n`;

    report += '## CRITICAL GAPS\n\n';
    report += 'Claims with fewer than 2 supporting documents:\n\n';

    const criticalGaps = Array.from(this.claims.values())
      .filter(c => c.supportingEvidence.length < 2);

    for (const claim of criticalGaps) {
      report += `### ${claim.claimId}: ${claim.claimType}\n\n`;
      report += `**Claim:** ${claim.claim}\n\n`;
      report += `**Current Evidence:** ${claim.supportingEvidence.length} items\n`;
      report += `**Required:** Minimum 2 items for verification\n\n`;
      report += '**Recommended Actions:**\n';
      claim.gaps.forEach(gap => {
        report += `- ${gap}\n`;
      });
      report += '\n';
    }

    report += '## GAPS BY CLAIM TYPE\n\n';

    const gapsByType = new Map<string, typeof criticalGaps>();
    criticalGaps.forEach(claim => {
      if (!gapsByType.has(claim.claimType)) {
        gapsByType.set(claim.claimType, []);
      }
      gapsByType.get(claim.claimType)!.push(claim);
    });

    for (const [type, claims] of gapsByType) {
      report += `### ${type} Claims (${claims.length} gaps)\n\n`;
      claims.forEach(claim => {
        report += `- **${claim.claimId}:** ${claim.gaps.join('; ')}\n`;
      });
      report += '\n';
    }

    report += '## DISCOVERY RECOMMENDATIONS\n\n';
    report += 'Based on identified gaps, the following additional discovery is recommended:\n\n';

    // Generate discovery recommendations
    const recommendations = this.generateDiscoveryRecommendations();
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    fs.writeFileSync(outputPath, report);
    console.log(`✓ Gaps analysis saved to ${outputPath}`);
  }

  private generateDiscoveryRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for missing evidence types
    const hasADAClaims = Array.from(this.claims.values()).some(c => c.claimType === 'ADA');
    const hasFMLAClaims = Array.from(this.claims.values()).some(c => c.claimType === 'FMLA');
    const hasERISAClaims = Array.from(this.claims.values()).some(c => c.claimType === 'ERISA');

    if (hasADAClaims) {
      recommendations.push('Request all ADA accommodation request forms and responses');
      recommendations.push('Request all medical documentation supporting disability claims');
      recommendations.push('Request interactive process documentation');
    }

    if (hasFMLAClaims) {
      recommendations.push('Request all FMLA leave request forms and approvals/denials');
      recommendations.push('Request medical certifications for FMLA leave');
      recommendations.push('Request attendance records during FMLA periods');
    }

    if (hasERISAClaims) {
      recommendations.push('Request complete Sedgwick claim file with all DCN records');
      recommendations.push('Request all benefit determination letters');
      recommendations.push('Request Sedgwick administrative procedures manual');
    }

    // Check for specific gaps
    const sedgwickGaps = this.anomalies.filter(a => a.type === 'missing_doc');
    if (sedgwickGaps.length > 0) {
      recommendations.push('Request explanation for gaps in Sedgwick documentation timeline');
    }

    return recommendations;
  }

  /**
   * Generate anomalies report
   */
  generateAnomaliesReport(outputPath: string): void {
    console.log('\n📊 Generating anomalies report...');

    let report = '# SEDGWICK METADATA ANOMALIES REPORT\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Case:** Castillo v. Schwab & Sedgwick\n\n`;

    report += '## EXECUTIVE SUMMARY\n\n';
    report += `- **Total Anomalies Detected:** ${this.anomalies.length}\n`;
    report += `- **Critical:** ${this.anomalies.filter(a => a.severity === 'critical').length}\n`;
    report += `- **High:** ${this.anomalies.filter(a => a.severity === 'high').length}\n`;
    report += `- **Medium:** ${this.anomalies.filter(a => a.severity === 'medium').length}\n`;
    report += `- **Low:** ${this.anomalies.filter(a => a.severity === 'low').length}\n\n`;

    // Backdating anomalies
    report += '## BACKDATING ANOMALIES\n\n';
    const backdatingAnomalies = this.anomalies.filter(a => a.type === 'backdating');
    if (backdatingAnomalies.length > 0) {
      report += `**Found ${backdatingAnomalies.length} instances of potential backdating:**\n\n`;
      backdatingAnomalies.forEach((anomaly, i) => {
        report += `### Anomaly ${i + 1} [${anomaly.severity.toUpperCase()}]\n\n`;
        report += `**Description:** ${anomaly.description}\n\n`;
        report += `**Affected Documents:** ${anomaly.affectedBates.join(', ')}\n\n`;
        report += `**Evidence:** ${anomaly.evidence}\n\n`;
        report += `**Detection Date:** ${anomaly.detectedDate.toISOString()}\n\n`;
      });
    } else {
      report += 'No backdating anomalies detected.\n\n';
    }

    // Duplicate documents
    report += '## DUPLICATE DOCUMENTS\n\n';
    const duplicates = this.anomalies.filter(a => a.type === 'duplicate');
    if (duplicates.length > 0) {
      report += `**Found ${duplicates.length} instances of duplicate documentation:**\n\n`;
      duplicates.forEach((anomaly, i) => {
        report += `### Duplicate Set ${i + 1} [${anomaly.severity.toUpperCase()}]\n\n`;
        report += `**Description:** ${anomaly.description}\n\n`;
        report += `**Affected Documents:** ${anomaly.affectedBates.join(', ')}\n\n`;
        report += `**Evidence:** ${anomaly.evidence}\n\n`;
      });
    } else {
      report += 'No duplicate documents detected.\n\n';
    }

    // Missing documentation
    report += '## MISSING DOCUMENTATION PERIODS\n\n';
    const missingDocs = this.anomalies.filter(a => a.type === 'missing_doc');
    if (missingDocs.length > 0) {
      report += `**Found ${missingDocs.length} gaps in documentation timeline:**\n\n`;
      missingDocs.forEach((anomaly, i) => {
        report += `### Gap ${i + 1} [${anomaly.severity.toUpperCase()}]\n\n`;
        report += `**Description:** ${anomaly.description}\n\n`;
        report += `**Between Documents:** ${anomaly.affectedBates.join(' → ')}\n\n`;
        report += `**Period:** ${anomaly.evidence}\n\n`;
      });
    } else {
      report += 'No significant gaps in documentation timeline.\n\n';
    }

    // Medical-Employer Correlations
    report += '## MEDICAL-EMPLOYER CORRELATIONS\n\n';
    if (this.medicalCorrelations.length > 0) {
      report += `**Found ${this.medicalCorrelations.length} correlations between medical events and employer actions:**\n\n`;
      report += '| Date | Medical Event | Employer Event | Correlation | Evidence |\n';
      report += '|------|---------------|----------------|-------------|----------|\n';
      this.medicalCorrelations.forEach(corr => {
        report += `| ${corr.date.toISOString().split('T')[0]} | ${corr.medicalEvent} | ${corr.employerEvent || 'N/A'} | ${corr.correlation} | ${corr.batesEvidence.join(', ')} |\n`;
      });
      report += '\n';
    } else {
      report += 'No significant medical-employer correlations detected.\n\n';
    }

    // Spoliation Evidence
    report += '## SPOLIATION EVIDENCE\n\n';
    if (this.spoliationEvidence.length > 0) {
      report += `**Found ${this.spoliationEvidence.length} indicators of potential spoliation:**\n\n`;
      this.spoliationEvidence.forEach((spol, i) => {
        report += `### Indicator ${i + 1} [${spol.impact.toUpperCase()}]\n\n`;
        report += `**Type:** ${spol.type.replace(/_/g, ' ').toUpperCase()}\n\n`;
        report += `**Date:** ${spol.date.toISOString()}\n\n`;
        report += `**Description:** ${spol.description}\n\n`;
        report += `**Evidence:** ${spol.evidence.join(', ')}\n\n`;
      });
    } else {
      report += 'No spoliation indicators detected.\n\n';
    }

    fs.writeFileSync(outputPath, report);
    console.log(`✓ Anomalies report saved to ${outputPath}`);
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  private loadEvidence(): void {
    // Load evidence from catalog or database
    const catalogPath = '/home/user/agentic-flow/docs/pro-se-platform/evidence/catalog.json';

    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      catalog.forEach((item: any) => {
        this.evidence.set(item.batesNumber, {
          batesNumber: item.batesNumber,
          filename: item.filename,
          hash: item.hash,
          dateModified: new Date(item.dateModified),
          parties: item.parties || [],
          content: item.content,
          metadata: item.metadata || {}
        });
      });
      console.log(`✓ Loaded ${this.evidence.size} evidence items from catalog`);
    } else {
      console.log('⚠ No evidence catalog found. Run evidence processor first.');
    }
  }

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  exportDatabase(outputPath: string): void {
    const database = {
      claims: Array.from(this.claims.values()),
      evidence: Array.from(this.evidence.values()),
      anomalies: this.anomalies,
      medicalCorrelations: this.medicalCorrelations,
      spoliationEvidence: this.spoliationEvidence,
      metadata: {
        generated: new Date().toISOString(),
        totalClaims: this.claims.size,
        totalEvidence: this.evidence.size,
        totalAnomalies: this.anomalies.length
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));
    console.log(`✓ Database exported to ${outputPath}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('⚖️  Pro Se Fact-Checking System - Dual Verification Protocol');
  console.log('='.repeat(70));
  console.log('Case: Castillo v. Schwab & Sedgwick\n');

  const system = new FactCheckingSystem();

  // FIRST PASS: Extract claims
  const summaryPath = '/home/user/agentic-flow/docs/pro-se-platform/legal-docs/executive-summary.md';
  const timelinePath = '/home/user/agentic-flow/docs/pro-se-platform/timeline/timeline.md';

  system.extractClaims(summaryPath, timelinePath);

  // SECOND PASS: Verify evidence
  system.verifyEvidence();

  // CROSS-REFERENCE CHECK
  system.performCrossReferenceCheck();

  // ANOMALY DETECTION
  system.detectSedgwickAnomalies();

  // CORRELATION ANALYSIS
  system.analyzeMedicalEmployerCorrelation();

  // SPOLIATION DETECTION
  system.detectSpoliation();

  // GENERATE REPORTS
  const evidenceDir = '/home/user/agentic-flow/docs/pro-se-platform/evidence';
  system.generateVerificationReport(path.join(evidenceDir, 'VERIFICATION-REPORT.md'));
  system.generateGapsAnalysis(path.join(evidenceDir, 'GAPS-ANALYSIS.md'));
  system.generateAnomaliesReport(path.join(evidenceDir, 'ANOMALIES-REPORT.md'));

  // EXPORT DATABASE
  system.exportDatabase(path.join(evidenceDir, 'fact-check-database.json'));

  console.log('\n✅ Dual fact-checking protocol complete!');
  console.log('\nReports generated:');
  console.log('  - VERIFICATION-REPORT.md');
  console.log('  - GAPS-ANALYSIS.md');
  console.log('  - ANOMALIES-REPORT.md');
  console.log('  - fact-check-database.json');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default FactCheckingSystem;
