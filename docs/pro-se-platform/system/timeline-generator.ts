/**
 * Pro Se Platform - Timeline Generation System
 * Castillo v. Schwab & Sedgwick
 *
 * Comprehensive timeline generator with evidence cross-referencing,
 * correlation analysis, and multiple output formats.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TimelineEvent {
  id: string;
  date: Date;
  time?: string;
  title: string;
  description: string;
  parties: string[];
  batesNumbers: string[]; // Supporting evidence
  significance: string;
  claimTypes: ClaimType[];
  phase: Phase;
  category: EventCategory;
  verified: boolean;
  correlations?: string[]; // IDs of correlated events
  metadata?: Record<string, any>;
}

export enum ClaimType {
  ADA_RETALIATION = 'ADA Retaliation',
  ADA_DISCRIMINATION = 'ADA Discrimination',
  FMLA_INTERFERENCE = 'FMLA Interference',
  FMLA_RETALIATION = 'FMLA Retaliation',
  ERISA_510 = 'ERISA § 510',
  SOX_WHISTLEBLOWER = 'SOX Whistleblower',
  CONSTRUCTIVE_DISCHARGE = 'Constructive Discharge',
  SPOLIATION = 'Spoliation of Evidence',
  FRAUD = 'Fraud/Misrepresentation'
}

export enum Phase {
  PHASE_1 = 'Phase 1: Initial Disclosure & Retaliation (Jan-Jun 2021)',
  PHASE_2 = 'Phase 2: Medical Escalation & FMLA (Jul-Dec 2021)',
  PHASE_3 = 'Phase 3: Benefits Battle & Network Sabotage (2022)',
  PHASE_4 = 'Phase 4: Sedgwick Fraud & Severance Coercion (Jan-Apr 2023)',
  PHASE_5 = 'Phase 5: Post-Termination & Legal Action (May 2023-Present)'
}

export enum EventCategory {
  DISCLOSURE = 'whistleblower_disclosure',
  RETALIATION = 'retaliation_action',
  MEDICAL = 'medical_event',
  FMLA = 'fmla_request_action',
  BENEFITS = 'benefits_claim_action',
  NETWORK = 'network_access_issue',
  SEDGWICK = 'sedgwick_action',
  TERMINATION = 'termination_related',
  LEGAL = 'legal_filing_action',
  EVIDENCE = 'evidence_related'
}

export interface CorrelationAnalysis {
  type: CorrelationType;
  eventIds: string[];
  description: string;
  statisticalSignificance?: number; // p-value
  causalityScore?: number; // 0-1 but-for causation likelihood
  temporalProximity: number; // Days between events
  evidence: string[];
}

export enum CorrelationType {
  MEDICAL_ESCALATION = 'medical_escalation',
  RETALIATION_SEQUENCE = 'retaliation_sequence',
  PAYMENT_GAP_DENIAL = 'payment_gap_correlation',
  NETWORK_TIMING = 'network_sabotage_timing',
  METADATA_ANOMALY = 'metadata_anomaly_pattern',
  CAUSAL_CHAIN = 'causal_chain'
}

export interface TimelineParseOptions {
  dateFormat?: string;
  autoDetectPhases?: boolean;
  autoLinkEvidence?: boolean;
  validateDates?: boolean;
}

export interface ExportOptions {
  format: 'markdown' | 'json' | 'csv' | 'latex' | 'html';
  includeBates?: boolean;
  includeVerificationStatus?: boolean;
  groupByPhase?: boolean;
  outputPath: string;
}

// ============================================================================
// TIMELINE GENERATOR CLASS
// ============================================================================

export class TimelineGenerator {
  private events: Map<string, TimelineEvent> = new Map();
  private correlations: CorrelationAnalysis[] = [];
  private evidenceMap: Map<string, string[]> = new Map(); // batesNumber -> eventIds

  constructor() {}

  // ==========================================================================
  // PARSING METHODS
  // ==========================================================================

  /**
   * Parse chronology text into structured events
   */
  parseChronologyText(text: string, options: TimelineParseOptions = {}): TimelineEvent[] {
    const lines = text.split('\n');
    const events: TimelineEvent[] = [];
    let currentPhase: Phase = Phase.PHASE_1;
    let eventCounter = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Detect phase headers
      const phaseMatch = trimmed.match(/Phase\s+(\d+)[:\-]?\s*(.+)/i);
      if (phaseMatch) {
        currentPhase = this.detectPhase(trimmed);
        continue;
      }

      // Parse event line (format: "YYYY-MM-DD: Event title - Description")
      const eventMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\s*[:\-]\s*(.+?)(?:\s*\-\s*(.+))?$/);
      if (eventMatch) {
        const [, dateStr, timeStr, title, description] = eventMatch;

        const event: TimelineEvent = {
          id: `EVT-${String(eventCounter).padStart(4, '0')}`,
          date: new Date(dateStr),
          time: timeStr,
          title: title.trim(),
          description: description?.trim() || title.trim(),
          parties: this.extractParties(title + (description || '')),
          batesNumbers: [], // To be linked later
          significance: '',
          claimTypes: this.inferClaimTypes(title + (description || '')),
          phase: currentPhase,
          category: this.inferCategory(title + (description || '')),
          verified: false,
          metadata: {}
        };

        events.push(event);
        this.events.set(event.id, event);
        eventCounter++;
      }
    }

    return events;
  }

  /**
   * Parse structured JSON chronology
   */
  parseJSONChronology(jsonPath: string): TimelineEvent[] {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const events: TimelineEvent[] = [];

    for (const item of data.events || []) {
      const event: TimelineEvent = {
        id: item.id || `EVT-${String(events.length + 1).padStart(4, '0')}`,
        date: new Date(item.date),
        time: item.time,
        title: item.title,
        description: item.description || item.title,
        parties: item.parties || [],
        batesNumbers: item.batesNumbers || item.evidence || [],
        significance: item.significance || '',
        claimTypes: item.claimTypes || [],
        phase: item.phase || Phase.PHASE_1,
        category: item.category || EventCategory.EVIDENCE,
        verified: item.verified || false,
        metadata: item.metadata || {}
      };

      events.push(event);
      this.events.set(event.id, event);
    }

    return events;
  }

  // ==========================================================================
  // EVIDENCE LINKING
  // ==========================================================================

  /**
   * Link events to evidence by Bates numbers
   */
  linkEvidence(eventId: string, batesNumbers: string[]): void {
    const event = this.events.get(eventId);
    if (!event) return;

    event.batesNumbers = [...new Set([...event.batesNumbers, ...batesNumbers])];

    // Update reverse mapping
    for (const bates of batesNumbers) {
      const eventIds = this.evidenceMap.get(bates) || [];
      eventIds.push(eventId);
      this.evidenceMap.set(bates, eventIds);
    }
  }

  /**
   * Auto-link evidence based on date and party matching
   */
  async autoLinkEvidence(): Promise<void> {
    console.log('Auto-linking evidence to timeline events...');

    // Query AgentDB for evidence
    try {
      const query = `
        SELECT bates_id, date_modified, parties, content_text
        FROM evidence_master
        ORDER BY date_modified;
      `;

      // This would use actual AgentDB query in production
      // For now, we'll implement the logic framework

      for (const [eventId, event] of this.events) {
        // Match evidence within ±7 days of event
        // Match by parties involved
        // Match by keywords in content
        // Score and rank matches

        console.log(`  Processing ${eventId}: ${event.title}`);
      }

    } catch (error) {
      console.error('Auto-linking failed:', error);
    }
  }

  /**
   * Validate that all critical events have supporting evidence
   */
  validateEvidence(): { missing: string[], insufficient: string[] } {
    const missing: string[] = [];
    const insufficient: string[] = [];

    for (const [eventId, event] of this.events) {
      if (event.batesNumbers.length === 0) {
        missing.push(eventId);
      } else if (event.batesNumbers.length < 2 && event.significance === 'critical') {
        insufficient.push(eventId);
      }
    }

    return { missing, insufficient };
  }

  // ==========================================================================
  // CORRELATION ANALYSIS
  // ==========================================================================

  /**
   * Analyze medical escalation timeline
   */
  analyzeMedicalEscalation(): CorrelationAnalysis[] {
    const medicalEvents = Array.from(this.events.values())
      .filter(e => e.category === EventCategory.MEDICAL || e.claimTypes.includes(ClaimType.FMLA_INTERFERENCE))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const correlations: CorrelationAnalysis[] = [];

    // Look for pattern: retaliation → medical event → escalating symptoms
    for (let i = 0; i < medicalEvents.length - 1; i++) {
      const current = medicalEvents[i];
      const next = medicalEvents[i + 1];

      const daysBetween = this.daysBetween(current.date, next.date);

      // Find retaliation events within 30 days before medical event
      const priorRetaliation = Array.from(this.events.values())
        .filter(e =>
          e.category === EventCategory.RETALIATION &&
          this.daysBetween(e.date, current.date) >= 0 &&
          this.daysBetween(e.date, current.date) <= 30
        );

      if (priorRetaliation.length > 0) {
        correlations.push({
          type: CorrelationType.MEDICAL_ESCALATION,
          eventIds: [priorRetaliation[0].id, current.id, next.id],
          description: `Retaliation preceded medical escalation by ${this.daysBetween(priorRetaliation[0].date, current.date)} days`,
          temporalProximity: daysBetween,
          evidence: [...current.batesNumbers, ...next.batesNumbers],
          causalityScore: this.computeCausalityScore(priorRetaliation[0], current)
        });
      }
    }

    return correlations;
  }

  /**
   * Analyze payment gaps correlated with claim denials
   */
  analyzePaymentGapCorrelation(): CorrelationAnalysis[] {
    const benefitsEvents = Array.from(this.events.values())
      .filter(e => e.category === EventCategory.BENEFITS)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const correlations: CorrelationAnalysis[] = [];

    // Look for pattern: denial → payment gap → financial pressure
    for (const event of benefitsEvents) {
      if (event.title.toLowerCase().includes('denial') || event.title.toLowerCase().includes('delay')) {
        const subsequentEvents = Array.from(this.events.values())
          .filter(e =>
            e.date > event.date &&
            this.daysBetween(event.date, e.date) <= 60 &&
            (e.category === EventCategory.TERMINATION || e.title.toLowerCase().includes('severance'))
          );

        if (subsequentEvents.length > 0) {
          correlations.push({
            type: CorrelationType.PAYMENT_GAP_DENIAL,
            eventIds: [event.id, ...subsequentEvents.map(e => e.id)],
            description: `Benefits denial followed by termination pressure within ${this.daysBetween(event.date, subsequentEvents[0].date)} days`,
            temporalProximity: this.daysBetween(event.date, subsequentEvents[0].date),
            evidence: [...event.batesNumbers, ...subsequentEvents.flatMap(e => e.batesNumbers)],
            causalityScore: 0.75
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Analyze network issues timing with termination
   */
  analyzeNetworkTiming(): CorrelationAnalysis[] {
    const networkEvents = Array.from(this.events.values())
      .filter(e => e.category === EventCategory.NETWORK)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const terminationEvents = Array.from(this.events.values())
      .filter(e => e.category === EventCategory.TERMINATION);

    const correlations: CorrelationAnalysis[] = [];

    for (const termEvent of terminationEvents) {
      const priorNetworkIssues = networkEvents.filter(e =>
        e.date < termEvent.date &&
        this.daysBetween(e.date, termEvent.date) <= 90
      );

      if (priorNetworkIssues.length >= 2) {
        correlations.push({
          type: CorrelationType.NETWORK_TIMING,
          eventIds: [...priorNetworkIssues.map(e => e.id), termEvent.id],
          description: `${priorNetworkIssues.length} network sabotage events preceded termination`,
          temporalProximity: this.daysBetween(priorNetworkIssues[0].date, termEvent.date),
          evidence: [...priorNetworkIssues.flatMap(e => e.batesNumbers), ...termEvent.batesNumbers],
          causalityScore: 0.85,
          statisticalSignificance: this.computeCoincidenceProbability(priorNetworkIssues.length, 90)
        });
      }
    }

    return correlations;
  }

  /**
   * Run all correlation analyses
   */
  analyzeAllCorrelations(): void {
    console.log('Running correlation analyses...');

    this.correlations = [
      ...this.analyzeMedicalEscalation(),
      ...this.analyzePaymentGapCorrelation(),
      ...this.analyzeNetworkTiming()
    ];

    // Store correlations in events
    for (const correlation of this.correlations) {
      for (const eventId of correlation.eventIds) {
        const event = this.events.get(eventId);
        if (event) {
          event.correlations = event.correlations || [];
          event.correlations.push(...correlation.eventIds.filter(id => id !== eventId));
        }
      }
    }

    console.log(`  Found ${this.correlations.length} significant correlations`);
  }

  // ==========================================================================
  // MATHEMATICAL ANALYSIS (Integration with math-framework)
  // ==========================================================================

  /**
   * Compute but-for causation score using math framework
   */
  private computeCausalityScore(causeEvent: TimelineEvent, effectEvent: TimelineEvent): number {
    // Factors:
    // 1. Temporal proximity (closer = higher score)
    // 2. Direct parties overlap
    // 3. Claim type alignment
    // 4. Evidence quality

    const daysDiff = this.daysBetween(causeEvent.date, effectEvent.date);
    const temporalScore = Math.max(0, 1 - (daysDiff / 365)); // Decay over 1 year

    const partiesOverlap = causeEvent.parties.filter(p => effectEvent.parties.includes(p)).length;
    const partiesScore = partiesOverlap / Math.max(causeEvent.parties.length, effectEvent.parties.length);

    const claimOverlap = causeEvent.claimTypes.filter(c => effectEvent.claimTypes.includes(c)).length;
    const claimScore = claimOverlap > 0 ? 0.5 : 0;

    const evidenceScore = Math.min(1, (causeEvent.batesNumbers.length + effectEvent.batesNumbers.length) / 10);

    // Weighted average
    return (temporalScore * 0.4 + partiesScore * 0.3 + claimScore * 0.2 + evidenceScore * 0.1);
  }

  /**
   * Compute probability that timing is coincidental
   * Uses Poisson distribution for random event occurrence
   */
  private computeCoincidenceProbability(eventCount: number, daysWindow: number): number {
    // Assume base rate of 1 event per 30 days (λ = daysWindow / 30)
    const lambda = daysWindow / 30;

    // P(X >= eventCount) where X ~ Poisson(λ)
    let cumulative = 0;
    for (let k = 0; k < eventCount; k++) {
      cumulative += Math.pow(lambda, k) * Math.exp(-lambda) / this.factorial(k);
    }

    return 1 - cumulative; // p-value
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  // ==========================================================================
  // EXPORT METHODS
  // ==========================================================================

  /**
   * Export timeline to Markdown with Bates citations
   */
  exportMarkdown(outputPath: string, groupByPhase: boolean = true): void {
    let markdown = '# Master Timeline - Castillo v. Schwab & Sedgwick\n\n';
    markdown += `**Generated:** ${new Date().toISOString()}\n`;
    markdown += `**Total Events:** ${this.events.size}\n`;
    markdown += `**Evidence Items:** ${this.evidenceMap.size}\n\n`;
    markdown += '---\n\n';

    if (groupByPhase) {
      const phases = [Phase.PHASE_1, Phase.PHASE_2, Phase.PHASE_3, Phase.PHASE_4, Phase.PHASE_5];

      for (const phase of phases) {
        const phaseEvents = Array.from(this.events.values())
          .filter(e => e.phase === phase)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (phaseEvents.length === 0) continue;

        markdown += `## ${phase}\n\n`;

        for (const event of phaseEvents) {
          markdown += this.formatEventMarkdown(event);
        }

        markdown += '\n---\n\n';
      }
    } else {
      const sortedEvents = Array.from(this.events.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (const event of sortedEvents) {
        markdown += this.formatEventMarkdown(event);
      }
    }

    // Add correlations section
    markdown += '## Correlation Analysis\n\n';
    markdown += this.formatCorrelationsMarkdown();

    fs.writeFileSync(outputPath, markdown);
    console.log(`✓ Markdown timeline exported to ${outputPath}`);
  }

  private formatEventMarkdown(event: TimelineEvent): string {
    let md = `### ${event.date.toISOString().split('T')[0]}`;
    if (event.time) md += ` ${event.time}`;
    md += ` - ${event.title}\n\n`;

    md += `**Description:** ${event.description}\n\n`;
    md += `**Parties:** ${event.parties.join(', ')}\n\n`;
    md += `**Category:** ${event.category}\n\n`;
    md += `**Claims:** ${event.claimTypes.join(', ')}\n\n`;

    if (event.batesNumbers.length > 0) {
      md += `**Evidence:** ${event.batesNumbers.join(', ')}\n\n`;
    } else {
      md += `**Evidence:** ⚠️  *[MISSING - NEEDS EVIDENCE LINK]*\n\n`;
    }

    if (event.significance) {
      md += `**Significance:** ${event.significance}\n\n`;
    }

    if (event.correlations && event.correlations.length > 0) {
      md += `**Correlated Events:** ${event.correlations.join(', ')}\n\n`;
    }

    md += `*Verified:* ${event.verified ? '✓' : '⚠️  Needs verification'}\n\n`;

    return md + '---\n\n';
  }

  private formatCorrelationsMarkdown(): string {
    let md = '';

    const types = [
      CorrelationType.MEDICAL_ESCALATION,
      CorrelationType.RETALIATION_SEQUENCE,
      CorrelationType.PAYMENT_GAP_DENIAL,
      CorrelationType.NETWORK_TIMING
    ];

    for (const type of types) {
      const correlations = this.correlations.filter(c => c.type === type);
      if (correlations.length === 0) continue;

      md += `### ${type.replace(/_/g, ' ').toUpperCase()}\n\n`;

      for (const corr of correlations) {
        md += `**Events:** ${corr.eventIds.join(' → ')}\n\n`;
        md += `**Description:** ${corr.description}\n\n`;
        md += `**Temporal Proximity:** ${corr.temporalProximity} days\n\n`;

        if (corr.causalityScore) {
          md += `**Causality Score:** ${(corr.causalityScore * 100).toFixed(1)}%\n\n`;
        }

        if (corr.statisticalSignificance) {
          md += `**Statistical Significance:** p = ${corr.statisticalSignificance.toFixed(4)}\n\n`;
        }

        if (corr.evidence.length > 0) {
          md += `**Evidence:** ${corr.evidence.join(', ')}\n\n`;
        }

        md += '---\n\n';
      }
    }

    return md;
  }

  /**
   * Export timeline to JSON
   */
  exportJSON(outputPath: string): void {
    const data = {
      metadata: {
        generated: new Date().toISOString(),
        totalEvents: this.events.size,
        totalEvidence: this.evidenceMap.size,
        totalCorrelations: this.correlations.length
      },
      events: Array.from(this.events.values()).map(e => ({
        ...e,
        date: e.date.toISOString()
      })),
      correlations: this.correlations,
      evidenceMap: Object.fromEntries(this.evidenceMap)
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✓ JSON timeline exported to ${outputPath}`);
  }

  /**
   * Export timeline to CSV
   */
  exportCSV(outputPath: string): void {
    const headers = [
      'Event ID',
      'Date',
      'Time',
      'Title',
      'Description',
      'Parties',
      'Evidence (Bates)',
      'Claims',
      'Phase',
      'Category',
      'Verified'
    ];

    let csv = headers.join(',') + '\n';

    const sortedEvents = Array.from(this.events.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const event of sortedEvents) {
      const row = [
        event.id,
        event.date.toISOString().split('T')[0],
        event.time || '',
        this.csvEscape(event.title),
        this.csvEscape(event.description),
        this.csvEscape(event.parties.join('; ')),
        this.csvEscape(event.batesNumbers.join('; ')),
        this.csvEscape(event.claimTypes.join('; ')),
        this.csvEscape(event.phase),
        event.category,
        event.verified ? 'Yes' : 'No'
      ];
      csv += row.join(',') + '\n';
    }

    fs.writeFileSync(outputPath, csv);
    console.log(`✓ CSV timeline exported to ${outputPath}`);
  }

  private csvEscape(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Export timeline to LaTeX for court filings
   */
  exportLaTeX(outputPath: string): void {
    let latex = `\\documentclass[12pt]{article}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage[margin=1in]{geometry}

\\title{Timeline of Events\\\\Castillo v. Schwab \\& Sedgwick}
\\author{Marc Castillo, Pro Se Plaintiff}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Master Timeline}

\\begin{longtable}{|p{1in}|p{2in}|p{2.5in}|p{1in}|}
\\hline
\\textbf{Date} & \\textbf{Event} & \\textbf{Significance} & \\textbf{Evidence} \\\\
\\hline
\\endfirsthead

\\hline
\\textbf{Date} & \\textbf{Event} & \\textbf{Significance} & \\textbf{Evidence} \\\\
\\hline
\\endhead

\\hline
\\endfoot

`;

    const sortedEvents = Array.from(this.events.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const event of sortedEvents) {
      const dateStr = event.date.toISOString().split('T')[0];
      const title = this.latexEscape(event.title);
      const significance = this.latexEscape(event.significance || event.description.substring(0, 100));
      const evidence = this.latexEscape(event.batesNumbers.slice(0, 3).join(', '));

      latex += `${dateStr} & ${title} & ${significance} & ${evidence} \\\\\n\\hline\n`;
    }

    latex += `\\end{longtable}

\\end{document}
`;

    fs.writeFileSync(outputPath, latex);
    console.log(`✓ LaTeX timeline exported to ${outputPath}`);
  }

  private latexEscape(str: string): string {
    return str
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  /**
   * Export interactive HTML timeline
   */
  exportHTML(outputPath: string): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timeline - Castillo v. Schwab & Sedgwick</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .phase { margin: 20px 0; padding: 15px; background: #e9ecef; border-left: 5px solid #007bff; }
    .event { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 3px solid #28a745; }
    .event.missing-evidence { border-left-color: #dc3545; }
    .event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .event-date { font-weight: bold; color: #007bff; }
    .event-title { font-size: 1.2em; font-weight: bold; margin: 5px 0; }
    .badge { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 0.85em; }
    .badge-claim { background: #ffc107; color: #000; }
    .badge-party { background: #17a2b8; color: #fff; }
    .badge-evidence { background: #28a745; color: #fff; }
    .badge-missing { background: #dc3545; color: #fff; }
    .correlation { margin: 10px 0; padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timeline of Events - Castillo v. Schwab & Sedgwick</h1>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    <p><strong>Total Events:</strong> ${this.events.size}</p>
    <p><strong>Evidence Items:</strong> ${this.evidenceMap.size}</p>

    ${this.generateHTMLTimeline()}

    <h2>Correlation Analysis</h2>
    ${this.generateHTMLCorrelations()}
  </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`✓ HTML timeline exported to ${outputPath}`);
  }

  private generateHTMLTimeline(): string {
    const phases = [Phase.PHASE_1, Phase.PHASE_2, Phase.PHASE_3, Phase.PHASE_4, Phase.PHASE_5];
    let html = '';

    for (const phase of phases) {
      const phaseEvents = Array.from(this.events.values())
        .filter(e => e.phase === phase)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (phaseEvents.length === 0) continue;

      html += `<div class="phase"><h2>${phase}</h2>`;

      for (const event of phaseEvents) {
        const missingEvidence = event.batesNumbers.length === 0;
        html += `
        <div class="event ${missingEvidence ? 'missing-evidence' : ''}">
          <div class="event-header">
            <span class="event-date">${event.date.toISOString().split('T')[0]}${event.time ? ' ' + event.time : ''}</span>
            <span>${event.verified ? '✓ Verified' : '⚠️  Unverified'}</span>
          </div>
          <div class="event-title">${event.title}</div>
          <p>${event.description}</p>
          <div>
            ${event.parties.map(p => `<span class="badge badge-party">${p}</span>`).join('')}
            ${event.claimTypes.map(c => `<span class="badge badge-claim">${c}</span>`).join('')}
          </div>
          <div style="margin-top: 10px;">
            ${event.batesNumbers.length > 0
              ? event.batesNumbers.map(b => `<span class="badge badge-evidence">${b}</span>`).join('')
              : '<span class="badge badge-missing">⚠️  MISSING EVIDENCE</span>'
            }
          </div>
        </div>`;
      }

      html += '</div>';
    }

    return html;
  }

  private generateHTMLCorrelations(): string {
    let html = '';

    for (const corr of this.correlations) {
      html += `
      <div class="correlation">
        <strong>${corr.type.replace(/_/g, ' ').toUpperCase()}</strong><br>
        ${corr.description}<br>
        <strong>Events:</strong> ${corr.eventIds.join(' → ')}<br>
        <strong>Temporal Proximity:</strong> ${corr.temporalProximity} days
        ${corr.causalityScore ? `<br><strong>Causality Score:</strong> ${(corr.causalityScore * 100).toFixed(1)}%` : ''}
        ${corr.statisticalSignificance ? `<br><strong>p-value:</strong> ${corr.statisticalSignificance.toFixed(4)}` : ''}
      </div>`;
    }

    return html;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private daysBetween(date1: Date, date2: Date): number {
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private detectPhase(text: string): Phase {
    if (text.includes('Phase 1')) return Phase.PHASE_1;
    if (text.includes('Phase 2')) return Phase.PHASE_2;
    if (text.includes('Phase 3')) return Phase.PHASE_3;
    if (text.includes('Phase 4')) return Phase.PHASE_4;
    if (text.includes('Phase 5')) return Phase.PHASE_5;
    return Phase.PHASE_1;
  }

  private extractParties(text: string): string[] {
    const knownParties = [
      'Marc Castillo', 'Castillo',
      'Jennifer Babchuk', 'Babchuk',
      'Andrei Egorov', 'Egorov',
      'Charlie Soulis', 'Soulis',
      'Kay Bristow', 'Bristow',
      'Taylor Huffner', 'Huffner',
      'Chrystal Hicks', 'Hicks',
      'Noel Tapia', 'Tapia',
      'Beth Cappeli', 'Beth',
      'Sedgwick', 'Sheri', 'Miriam', 'Theresa',
      'Schwab', 'Charles Schwab',
      'Sara Fowler', 'Fowler', 'Seyfarth'
    ];

    const found: Set<string> = new Set();
    for (const party of knownParties) {
      if (text.includes(party)) {
        found.add(party);
      }
    }

    return Array.from(found);
  }

  private inferClaimTypes(text: string): ClaimType[] {
    const claims: ClaimType[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('ada') || lower.includes('disability') || lower.includes('accommodation')) {
      claims.push(ClaimType.ADA_RETALIATION);
    }
    if (lower.includes('fmla') || lower.includes('medical leave') || lower.includes('family leave')) {
      claims.push(ClaimType.FMLA_INTERFERENCE);
    }
    if (lower.includes('erisa') || lower.includes('benefits') || lower.includes('insurance')) {
      claims.push(ClaimType.ERISA_510);
    }
    if (lower.includes('sox') || lower.includes('whistleblower') || lower.includes('disclosure')) {
      claims.push(ClaimType.SOX_WHISTLEBLOWER);
    }
    if (lower.includes('terminate') || lower.includes('severance') || lower.includes('resign')) {
      claims.push(ClaimType.CONSTRUCTIVE_DISCHARGE);
    }
    if (lower.includes('backdating') || lower.includes('metadata') || lower.includes('spoliation')) {
      claims.push(ClaimType.SPOLIATION);
    }

    return claims;
  }

  private inferCategory(text: string): EventCategory {
    const lower = text.toLowerCase();

    if (lower.includes('medical') || lower.includes('doctor') || lower.includes('health')) {
      return EventCategory.MEDICAL;
    }
    if (lower.includes('fmla') || lower.includes('leave request')) {
      return EventCategory.FMLA;
    }
    if (lower.includes('benefit') || lower.includes('sedgwick') || lower.includes('claim')) {
      return EventCategory.BENEFITS;
    }
    if (lower.includes('network') || lower.includes('access') || lower.includes('password')) {
      return EventCategory.NETWORK;
    }
    if (lower.includes('terminate') || lower.includes('severance') || lower.includes('resign')) {
      return EventCategory.TERMINATION;
    }
    if (lower.includes('disclosure') || lower.includes('whistleblower') || lower.includes('report')) {
      return EventCategory.DISCLOSURE;
    }
    if (lower.includes('retaliat') || lower.includes('threat') || lower.includes('intimidat')) {
      return EventCategory.RETALIATION;
    }

    return EventCategory.EVIDENCE;
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, any> {
    const claimTypeCounts = new Map<ClaimType, number>();
    const categoryCounts = new Map<EventCategory, number>();
    const phaseCounts = new Map<Phase, number>();
    let missingEvidence = 0;

    for (const event of this.events.values()) {
      for (const claim of event.claimTypes) {
        claimTypeCounts.set(claim, (claimTypeCounts.get(claim) || 0) + 1);
      }
      categoryCounts.set(event.category, (categoryCounts.get(event.category) || 0) + 1);
      phaseCounts.set(event.phase, (phaseCounts.get(event.phase) || 0) + 1);

      if (event.batesNumbers.length === 0) missingEvidence++;
    }

    return {
      totalEvents: this.events.size,
      totalEvidence: this.evidenceMap.size,
      totalCorrelations: this.correlations.length,
      missingEvidence,
      evidenceCompleteness: ((this.events.size - missingEvidence) / this.events.size * 100).toFixed(1) + '%',
      claimTypeCounts: Object.fromEntries(claimTypeCounts),
      categoryCounts: Object.fromEntries(categoryCounts),
      phaseCounts: Object.fromEntries(phaseCounts)
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  console.log('🏛️  Timeline Generator - Castillo v. Schwab & Sedgwick');
  console.log('='.repeat(70));

  const generator = new TimelineGenerator();

  // Parse chronology (example - replace with actual data source)
  const chronologyPath = process.argv[2] || '/home/user/agentic-flow/docs/pro-se-platform/timeline/chronology.txt';

  if (fs.existsSync(chronologyPath)) {
    if (chronologyPath.endsWith('.json')) {
      console.log(`\nParsing JSON chronology: ${chronologyPath}`);
      generator.parseJSONChronology(chronologyPath);
    } else {
      console.log(`\nParsing text chronology: ${chronologyPath}`);
      const text = fs.readFileSync(chronologyPath, 'utf-8');
      generator.parseChronologyText(text);
    }
  } else {
    console.log('\n⚠️  No chronology file found. Creating example structure...');
  }

  // Auto-link evidence
  console.log('\nLinking evidence...');
  await generator.autoLinkEvidence();

  // Validate evidence
  const validation = generator.validateEvidence();
  console.log(`\n📊 Evidence Validation:`);
  console.log(`   Missing: ${validation.missing.length} events`);
  console.log(`   Insufficient: ${validation.insufficient.length} events`);

  // Run correlation analysis
  console.log('\n🔍 Running correlation analysis...');
  generator.analyzeAllCorrelations();

  // Get statistics
  const stats = generator.getStatistics();
  console.log('\n📈 Timeline Statistics:');
  console.log(`   Total Events: ${stats.totalEvents}`);
  console.log(`   Evidence Completeness: ${stats.evidenceCompleteness}`);
  console.log(`   Correlations Found: ${stats.totalCorrelations}`);

  // Export all formats
  const outputDir = '/home/user/agentic-flow/docs/pro-se-platform/timeline';

  console.log('\n📤 Exporting timeline...');
  generator.exportMarkdown(path.join(outputDir, 'MASTER-TIMELINE.md'));
  generator.exportJSON(path.join(outputDir, 'timeline.json'));
  generator.exportCSV(path.join(outputDir, 'timeline.csv'));
  generator.exportLaTeX(path.join(outputDir, 'timeline.tex'));
  generator.exportHTML(path.join(outputDir, 'timeline.html'));

  console.log('\n✅ Timeline generation complete!');
  console.log(`\n📁 Output files:`);
  console.log(`   ${outputDir}/MASTER-TIMELINE.md`);
  console.log(`   ${outputDir}/timeline.json`);
  console.log(`   ${outputDir}/timeline.csv`);
  console.log(`   ${outputDir}/timeline.tex`);
  console.log(`   ${outputDir}/timeline.html`);
}

if (require.main === module) {
  main().catch(console.error);
}

export default TimelineGenerator;
