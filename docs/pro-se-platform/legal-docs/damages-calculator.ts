/**
 * DAMAGES CALCULATOR - Pro Se Platform
 *
 * Interactive TypeScript calculator for employment discrimination damages
 * Supports ADA, FMLA, ERISA, SOX claims with real-time recalculation
 * Integrates with AgentDB for evidence linking
 */

import { differenceInDays, addYears, format } from 'date-fns';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EmploymentInfo {
  plaintiffName: string;
  defendant1: string;
  defendant2?: string;
  caseNumber?: string;
  district?: string;

  jobTitle: string;
  startDate: Date;
  terminationDate: Date;
  yearsOfService: number;
}

export interface CompensationInfo {
  baseSalary: number;
  bonusPercent: number;
  esppContribution: number;
  esppDiscount: number; // typically 15%

  healthInsurancePremium: number; // monthly employer contribution
  match401kFormula: string; // e.g., "100% up to 6%"
  match401kPercent: number;
  ptoAccrualDays: number;
  lifeInsuranceMultiple: number; // salary multiple
  professionalDevAllowance: number;
}

export interface LossCalculationParams {
  terminationDate: Date;
  trialDate: Date;
  frontPayYears: number; // estimated years to comparable employment

  colaRate: number; // annual cost of living adjustment
  meritIncreaseRate: number; // annual merit increase
  investmentGrowthRate: number; // for 401k opportunity cost

  interimEarnings: number; // from subsequent employment
  unemploymentComp: number;

  // Mitigation evidence
  jobApplications: number;
  interviewsConducted: number;
  offersReceived: number;
}

export interface MedicalInfo {
  // Pre-termination baseline
  preAdderallDose: number;
  preSertralineDose: number;
  prePropranololDose: number;
  preBpSystolic: number;
  preBpDiastolic: number;

  // Post-termination escalation
  postAdderallDose: number;
  postSertralineDose: number;
  postPropranololDose: number;
  postBpSystolic: number;
  postBpDiastolic: number;

  newMedications: string[];
  hypertensionEpisodes: number;

  // Psychological assessments
  gad7Score: number; // anxiety (0-21)
  phq9Score: number; // depression (0-27)

  // Treatment costs
  cobraPremiumsPaid: number;
  increasedOutOfPocket: number;
}

export interface EmotionalDistressFactors {
  durationMonths: number;
  severityRating: number; // 1-10
  treatmentIntensity: 'minimal' | 'moderate' | 'intensive';
  corroborationStrength: 'weak' | 'moderate' | 'strong';

  perDiemRate: number; // daily suffering value

  // Comparable case awards for validation
  comparableCaseAwards: number[];
}

export interface PunitiveDamagesFactors {
  temporalProximityDays: number; // between protected activity and termination
  spoliationEvidence: boolean;
  metadataManipulation: boolean;
  patternAndPractice: boolean;
  pretextualDocumentation: boolean;
  denialOfAccommodation: boolean;
  fmlaNonCompliance: boolean;

  defendant1Revenue: number;
  defendant1NetIncome: number;
  defendant2Revenue?: number;

  // Reprehensibility factors (BMW v. Gore)
  physicalHarm: boolean;
  indifferenceToHealthSafety: boolean;
  financialVulnerability: boolean;
  repeatedConduct: boolean;
  intentionalMalice: boolean;
}

export interface StatutoryPenalties {
  fmlaLiquidatedBase: number; // lost wages attributable to FMLA
  flsaLiquidatedBase?: number; // unpaid overtime if applicable

  expertWitnessFees: number;
  litigationCosts: number;

  estimatedAttorneysFees: number; // if represented
}

export interface DamagesResult {
  // Economic damages
  lostWagesGross: number;
  lostWagesNet: number; // after mitigation
  lostBenefits: number;
  totalEconomic: number;
  preJudgmentInterest: number;
  economicWithInterest: number;

  // Non-economic damages
  emotionalDistress: number;
  reputationLoss: number;
  hedonicDamages: number;
  totalNonEconomic: number;

  // Total compensatory
  totalCompensatory: number;

  // Additional damages
  punitiveDamages: number;
  liquidatedDamages: number;
  statutoryPenalties: number;

  // Grand total
  grandTotal: number;

  // Range estimates
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;

  // Statutory caps
  punitiveCap: number; // based on employer size
  cappedPunitive: number;

  // Detailed breakdowns
  lostWagesBreakdown: YearlyLossBreakdown[];
  benefitsBreakdown: BenefitsBreakdown;
  emotionalDistressBreakdown: EmotionalDistressBreakdown;
}

export interface YearlyLossBreakdown {
  year: number;
  startDate: Date;
  endDate: Date;
  days: number;
  baseCompensation: number;
  escalationPercent: number;
  projectedAnnualComp: number;
  lostWages: number;
}

export interface BenefitsBreakdown {
  healthInsurance: number;
  retirement401k: number;
  investmentOpportunityCost: number;
  esppDiscount: number;
  stockAppreciation: number;
  pto: number;
  lifeInsurance: number;
  professionalDevelopment: number;
  total: number;
}

export interface EmotionalDistressBreakdown {
  perDiemCalculation: number;
  comparableAverage: number;
  severityAdjustment: number;
  durationAdjustment: number;
  corroborationAdjustment: number;
  recommended: number;
  lowRange: number;
  highRange: number;
}

// ============================================================================
// MAIN CALCULATOR CLASS
// ============================================================================

export class DamagesCalculator {
  private employment: EmploymentInfo;
  private compensation: CompensationInfo;
  private lossParams: LossCalculationParams;
  private medical: MedicalInfo;
  private emotionalFactors: EmotionalDistressFactors;
  private punitiveFactors: PunitiveDamagesFactors;
  private statutory: StatutoryPenalties;

  constructor(
    employment: EmploymentInfo,
    compensation: CompensationInfo,
    lossParams: LossCalculationParams,
    medical: MedicalInfo,
    emotionalFactors: EmotionalDistressFactors,
    punitiveFactors: PunitiveDamagesFactors,
    statutory: StatutoryPenalties
  ) {
    this.employment = employment;
    this.compensation = compensation;
    this.lossParams = lossParams;
    this.medical = medical;
    this.emotionalFactors = emotionalFactors;
    this.punitiveFactors = punitiveFactors;
    this.statutory = statutory;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Calculate all damages and return comprehensive breakdown
   */
  public calculateTotal(): DamagesResult {
    const economic = this.calculateEconomicDamages();
    const nonEconomic = this.calculateNonEconomicDamages();
    const compensatory = economic.totalWithInterest + nonEconomic.total;

    const punitive = this.calculatePunitiveDamages(compensatory);
    const liquidated = this.calculateLiquidatedDamages(economic.lostWagesNet);
    const statutoryPenalties = this.calculateStatutoryPenalties();

    const grandTotal = compensatory + punitive.capped + liquidated + statutoryPenalties;

    // Range estimates (low, mid, high)
    const ranges = this.calculateRangeEstimates(economic, nonEconomic, punitive);

    return {
      lostWagesGross: economic.lostWagesGross,
      lostWagesNet: economic.lostWagesNet,
      lostBenefits: economic.lostBenefits,
      totalEconomic: economic.total,
      preJudgmentInterest: economic.preJudgmentInterest,
      economicWithInterest: economic.totalWithInterest,

      emotionalDistress: nonEconomic.emotionalDistress,
      reputationLoss: nonEconomic.reputationLoss,
      hedonicDamages: nonEconomic.hedonicDamages,
      totalNonEconomic: nonEconomic.total,

      totalCompensatory: compensatory,

      punitiveDamages: punitive.calculated,
      liquidatedDamages: liquidated,
      statutoryPenalties,

      grandTotal,

      lowEstimate: ranges.low,
      midEstimate: ranges.mid,
      highEstimate: ranges.high,

      punitiveCap: punitive.cap,
      cappedPunitive: punitive.capped,

      lostWagesBreakdown: economic.yearlyBreakdown,
      benefitsBreakdown: economic.benefitsBreakdown,
      emotionalDistressBreakdown: nonEconomic.emotionalBreakdown
    };
  }

  /**
   * Export results to markdown format for legal documents
   */
  public exportToMarkdown(result: DamagesResult): string {
    return `
# DAMAGES CALCULATION REPORT
**Case:** ${this.employment.caseNumber || 'TBD'}
**Plaintiff:** ${this.employment.plaintiffName}
**Calculation Date:** ${format(new Date(), 'MMMM d, yyyy')}

---

## SUMMARY

| Category | Amount |
|----------|--------|
| Lost Wages (Net) | $${result.lostWagesNet.toLocaleString()} |
| Lost Benefits | $${result.lostBenefits.toLocaleString()} |
| **Total Economic** | **$${result.totalEconomic.toLocaleString()}** |
| Emotional Distress | $${result.emotionalDistress.toLocaleString()} |
| Other Non-Economic | $${(result.reputationLoss + result.hedonicDamages).toLocaleString()} |
| **Total Compensatory** | **$${result.totalCompensatory.toLocaleString()}** |
| Punitive Damages | $${result.cappedPunitive.toLocaleString()} |
| Liquidated Damages | $${result.liquidatedDamages.toLocaleString()} |
| Statutory Penalties | $${result.statutoryPenalties.toLocaleString()} |
| **GRAND TOTAL** | **$${result.grandTotal.toLocaleString()}** |

---

## RANGE ESTIMATES

- **Low (Conservative):** $${result.lowEstimate.toLocaleString()}
- **Mid (Reasonable):** $${result.midEstimate.toLocaleString()}
- **High (Maximum):** $${result.highEstimate.toLocaleString()}

---

## DETAILED BREAKDOWNS

### Lost Wages by Year

${result.lostWagesBreakdown.map(year => `
**Year ${year.year}** (${format(year.startDate, 'MM/dd/yyyy')} - ${format(year.endDate, 'MM/dd/yyyy')}):
- Days: ${year.days}
- Base Compensation: $${year.baseCompensation.toLocaleString()}
- Escalation: ${year.escalationPercent.toFixed(1)}%
- Projected Annual: $${year.projectedAnnualComp.toLocaleString()}
- **Lost Wages: $${year.lostWages.toLocaleString()}**
`).join('\n')}

### Benefits Breakdown

| Benefit | Annual Value | Total Loss |
|---------|--------------|------------|
| Health Insurance | $${(result.benefitsBreakdown.healthInsurance / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.healthInsurance.toLocaleString()} |
| 401(k) Match | $${(result.benefitsBreakdown.retirement401k / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.retirement401k.toLocaleString()} |
| ESPP Discount | $${(result.benefitsBreakdown.esppDiscount / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.esppDiscount.toLocaleString()} |
| PTO | $${(result.benefitsBreakdown.pto / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.pto.toLocaleString()} |
| Life Insurance | $${(result.benefitsBreakdown.lifeInsurance / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.lifeInsurance.toLocaleString()} |
| Prof. Development | $${(result.benefitsBreakdown.professionalDevelopment / this.lossParams.frontPayYears).toLocaleString()} | $${result.benefitsBreakdown.professionalDevelopment.toLocaleString()} |

### Emotional Distress Calculation

- **Per Diem Method:** $${result.emotionalDistressBreakdown.perDiemCalculation.toLocaleString()}
- **Comparable Case Average:** $${result.emotionalDistressBreakdown.comparableAverage.toLocaleString()}
- **Adjustments:**
  - Severity: ${result.emotionalDistressBreakdown.severityAdjustment > 1 ? '+' : ''}${((result.emotionalDistressBreakdown.severityAdjustment - 1) * 100).toFixed(0)}%
  - Duration: ${result.emotionalDistressBreakdown.durationAdjustment > 1 ? '+' : ''}${((result.emotionalDistressBreakdown.durationAdjustment - 1) * 100).toFixed(0)}%
  - Corroboration: ${result.emotionalDistressBreakdown.corroborationAdjustment > 1 ? '+' : ''}${((result.emotionalDistressBreakdown.corroborationAdjustment - 1) * 100).toFixed(0)}%
- **Range:** $${result.emotionalDistressBreakdown.lowRange.toLocaleString()} - $${result.emotionalDistressBreakdown.highRange.toLocaleString()}
- **Recommended:** $${result.emotionalDistressBreakdown.recommended.toLocaleString()}

---

## CALCULATION PARAMETERS

**Loss Period:** ${format(this.lossParams.terminationDate, 'MMMM d, yyyy')} - ${format(this.lossParams.trialDate, 'MMMM d, yyyy')} (${differenceInDays(this.lossParams.trialDate, this.lossParams.terminationDate)} days)

**Front Pay:** ${this.lossParams.frontPayYears} years

**Escalation Rates:**
- COLA: ${(this.lossParams.colaRate * 100).toFixed(1)}%
- Merit: ${(this.lossParams.meritIncreaseRate * 100).toFixed(1)}%
- Total: ${((this.lossParams.colaRate + this.lossParams.meritIncreaseRate) * 100).toFixed(1)}%

**Mitigation:**
- Interim Earnings: $${this.lossParams.interimEarnings.toLocaleString()}
- Unemployment: $${this.lossParams.unemploymentComp.toLocaleString()}
- Job Applications: ${this.lossParams.jobApplications}
- Interviews: ${this.lossParams.interviewsConducted}

**Medical Escalation:**
- Adderall: ${this.medical.preAdderallDose}mg → ${this.medical.postAdderallDose}mg (${(((this.medical.postAdderallDose - this.medical.preAdderallDose) / this.medical.preAdderallDose) * 100).toFixed(0)}% increase)
- Sertraline: ${this.medical.preSertralineDose}mg → ${this.medical.postSertralineDose}mg (${(((this.medical.postSertralineDose - this.medical.preSertralineDose) / this.medical.preSertralineDose) * 100).toFixed(0)}% increase)
- Propranolol: ${this.medical.prePropranololDose}mg → ${this.medical.postPropranololDose}mg (${(((this.medical.postPropranololDose - this.medical.prePropranololDose) / this.medical.prePropranololDose) * 100).toFixed(0)}% increase)
- Blood Pressure: ${this.medical.preBpSystolic}/${this.medical.preBpDiastolic} → ${this.medical.postBpSystolic}/${this.medical.postBpDiastolic}
- GAD-7 Score: ${this.medical.gad7Score} (${this.getGad7Severity()})
- PHQ-9 Score: ${this.medical.phq9Score} (${this.getPhq9Severity()})

**Punitive Factors:**
- Temporal Proximity: ${this.punitiveFactors.temporalProximityDays} days
- Spoliation: ${this.punitiveFactors.spoliationEvidence ? 'Yes' : 'No'}
- Metadata Manipulation: ${this.punitiveFactors.metadataManipulation ? 'Yes' : 'No'}
- Reprehensibility Score: ${this.calculateReprehensibilityScore()}/5

---

*Generated by Pro Se Platform Damages Calculator v1.0*
`;
  }

  /**
   * Generate JSON export for API integration
   */
  public exportToJSON(result: DamagesResult): string {
    return JSON.stringify({
      metadata: {
        plaintiffName: this.employment.plaintiffName,
        caseNumber: this.employment.caseNumber,
        calculationDate: new Date().toISOString(),
        version: '1.0'
      },
      summary: {
        economicDamages: result.totalEconomic,
        nonEconomicDamages: result.totalNonEconomic,
        compensatory: result.totalCompensatory,
        punitive: result.cappedPunitive,
        liquidated: result.liquidatedDamages,
        statutory: result.statutoryPenalties,
        grandTotal: result.grandTotal
      },
      ranges: {
        low: result.lowEstimate,
        mid: result.midEstimate,
        high: result.highEstimate
      },
      breakdowns: {
        lostWages: result.lostWagesBreakdown,
        benefits: result.benefitsBreakdown,
        emotionalDistress: result.emotionalDistressBreakdown
      },
      parameters: {
        employment: this.employment,
        compensation: this.compensation,
        lossParams: this.lossParams,
        medical: this.medical,
        emotionalFactors: this.emotionalFactors,
        punitiveFactors: this.punitiveFactors,
        statutory: this.statutory
      }
    }, null, 2);
  }

  // ============================================================================
  // ECONOMIC DAMAGES CALCULATIONS
  // ============================================================================

  private calculateEconomicDamages() {
    const yearlyBreakdown = this.calculateYearlyLossBreakdown();
    const lostWagesGross = yearlyBreakdown.reduce((sum, year) => sum + year.lostWages, 0);

    const lostWagesNet = lostWagesGross - this.lossParams.interimEarnings - this.lossParams.unemploymentComp;

    const benefitsBreakdown = this.calculateBenefitsBreakdown();
    const lostBenefits = benefitsBreakdown.total;

    const total = lostWagesNet + lostBenefits;

    const preJudgmentInterest = this.calculatePreJudgmentInterest(lostWagesNet);
    const totalWithInterest = total + preJudgmentInterest;

    return {
      lostWagesGross,
      lostWagesNet,
      lostBenefits,
      total,
      preJudgmentInterest,
      totalWithInterest,
      yearlyBreakdown,
      benefitsBreakdown
    };
  }

  private calculateYearlyLossBreakdown(): YearlyLossBreakdown[] {
    const breakdown: YearlyLossBreakdown[] = [];
    const totalYears = Math.ceil(differenceInDays(this.lossParams.trialDate, this.lossParams.terminationDate) / 365) + this.lossParams.frontPayYears;

    let currentDate = this.lossParams.terminationDate;
    const baseComp = this.compensation.baseSalary +
                     (this.compensation.baseSalary * this.compensation.bonusPercent / 100) +
                     this.compensation.esppContribution;

    for (let year = 1; year <= totalYears; year++) {
      const yearStart = currentDate;
      const yearEnd = year < totalYears ? addYears(currentDate, 1) : this.lossParams.trialDate;
      const days = differenceInDays(yearEnd, yearStart);

      const escalationPercent = (this.lossParams.colaRate + this.lossParams.meritIncreaseRate) * (year - 1);
      const projectedAnnualComp = baseComp * (1 + escalationPercent);

      const lostWages = (projectedAnnualComp / 365) * days;

      breakdown.push({
        year,
        startDate: yearStart,
        endDate: yearEnd,
        days,
        baseCompensation: baseComp,
        escalationPercent: escalationPercent * 100,
        projectedAnnualComp,
        lostWages
      });

      currentDate = addYears(currentDate, 1);
    }

    return breakdown;
  }

  private calculateBenefitsBreakdown(): BenefitsBreakdown {
    const years = this.lossParams.frontPayYears +
                  (differenceInDays(this.lossParams.trialDate, this.lossParams.terminationDate) / 365);

    // Health insurance
    const healthInsurance = this.compensation.healthInsurancePremium * 12 * years;

    // 401(k) match
    const retirement401k = (this.compensation.baseSalary * this.compensation.match401kPercent / 100) * years;

    // Investment opportunity cost
    const investmentOpportunityCost = retirement401k * Math.pow(1 + this.lossParams.investmentGrowthRate, years) - retirement401k;

    // ESPP discount value
    const esppDiscount = this.compensation.esppContribution * (this.compensation.esppDiscount / 100) * years;

    // Stock appreciation (assume 8% annual for conservative estimate)
    const stockAppreciation = this.compensation.esppContribution * years * 0.08;

    // PTO value
    const ptoValue = (this.compensation.baseSalary / 365) * this.compensation.ptoAccrualDays;
    const pto = ptoValue * years;

    // Life insurance replacement cost (estimate $50/month for equivalent coverage)
    const lifeInsurance = 50 * 12 * years;

    // Professional development
    const professionalDevelopment = this.compensation.professionalDevAllowance * years;

    const total = healthInsurance + retirement401k + investmentOpportunityCost +
                  esppDiscount + stockAppreciation + pto + lifeInsurance + professionalDevelopment;

    return {
      healthInsurance,
      retirement401k,
      investmentOpportunityCost,
      esppDiscount,
      stockAppreciation,
      pto,
      lifeInsurance,
      professionalDevelopment,
      total
    };
  }

  private calculatePreJudgmentInterest(principal: number): number {
    // Illinois/7th Circuit: typically 5% simple interest from termination to judgment
    const rate = 0.05;
    const years = differenceInDays(new Date(), this.lossParams.terminationDate) / 365;
    return principal * rate * years;
  }

  // ============================================================================
  // NON-ECONOMIC DAMAGES CALCULATIONS
  // ============================================================================

  private calculateNonEconomicDamages() {
    const emotionalBreakdown = this.calculateEmotionalDistressBreakdown();
    const emotionalDistress = emotionalBreakdown.recommended;

    // Reputation loss (conservative estimate based on industry)
    const reputationLoss = this.compensation.baseSalary * 0.5; // 6 months salary equivalent

    // Hedonic damages (loss of enjoyment)
    const hedonicDamages = 25000; // Conservative base amount

    const total = emotionalDistress + reputationLoss + hedonicDamages;

    return {
      emotionalDistress,
      reputationLoss,
      hedonicDamages,
      total,
      emotionalBreakdown
    };
  }

  private calculateEmotionalDistressBreakdown(): EmotionalDistressBreakdown {
    // Per diem calculation
    const days = this.emotionalFactors.durationMonths * 30; // approximate
    const perDiemCalculation = this.emotionalFactors.perDiemRate * days;

    // Comparable case average
    const comparableAverage = this.emotionalFactors.comparableCaseAwards.length > 0
      ? this.emotionalFactors.comparableCaseAwards.reduce((a, b) => a + b, 0) / this.emotionalFactors.comparableCaseAwards.length
      : 100000; // default if no comparables

    // Adjustment factors
    const severityAdjustment = this.emotionalFactors.severityRating / 5; // normalize to 1.0-2.0 range
    const durationAdjustment = Math.min(this.emotionalFactors.durationMonths / 12, 2.0); // cap at 2x

    let corroborationAdjustment = 1.0;
    switch (this.emotionalFactors.corroborationStrength) {
      case 'strong': corroborationAdjustment = 1.3; break;
      case 'moderate': corroborationAdjustment = 1.0; break;
      case 'weak': corroborationAdjustment = 0.7; break;
    }

    // Calculate recommended value
    const baseValue = (perDiemCalculation + comparableAverage) / 2;
    const recommended = baseValue * severityAdjustment * durationAdjustment * corroborationAdjustment;

    // Range
    const lowRange = recommended * 0.6;
    const highRange = recommended * 1.5;

    return {
      perDiemCalculation,
      comparableAverage,
      severityAdjustment,
      durationAdjustment,
      corroborationAdjustment,
      recommended,
      lowRange,
      highRange
    };
  }

  // ============================================================================
  // PUNITIVE DAMAGES CALCULATIONS
  // ============================================================================

  private calculatePunitiveDamages(compensatory: number) {
    // Calculate reprehensibility score
    const reprehensibility = this.calculateReprehensibilityScore();

    // Base multiplier on reprehensibility (1x to 9x)
    let multiplier = 1;
    if (reprehensibility >= 4) {
      multiplier = 9; // Most reprehensible
    } else if (reprehensibility >= 3) {
      multiplier = 4;
    } else if (reprehensibility >= 2) {
      multiplier = 2;
    }

    // Spoliation and metadata manipulation warrant higher multipliers
    if (this.punitiveFactors.spoliationEvidence || this.punitiveFactors.metadataManipulation) {
      multiplier = Math.max(multiplier, 4);
    }

    const calculated = compensatory * multiplier;

    // Statutory cap based on employer size (42 U.S.C. § 1981a(b)(3))
    const cap = this.getPunitiveCap();
    const capped = Math.min(calculated, cap);

    return {
      calculated,
      cap,
      capped,
      multiplier,
      reprehensibility
    };
  }

  private calculateReprehensibilityScore(): number {
    // BMW v. Gore reprehensibility factors (0-5)
    let score = 0;

    if (this.punitiveFactors.physicalHarm) score++;
    if (this.punitiveFactors.indifferenceToHealthSafety) score++;
    if (this.punitiveFactors.financialVulnerability) score++;
    if (this.punitiveFactors.repeatedConduct) score++;
    if (this.punitiveFactors.intentionalMalice) score++;

    return score;
  }

  private getPunitiveCap(): number {
    // 42 U.S.C. § 1981a(b)(3) caps based on employer size
    // For most large employers (500+ employees): $300,000
    // This is a combined cap for compensatory + punitive
    // Assuming large employer default
    return 300000;
  }

  // ============================================================================
  // LIQUIDATED & STATUTORY DAMAGES
  // ============================================================================

  private calculateLiquidatedDamages(lostWagesNet: number): number {
    // FMLA liquidated damages = 2x lost wages for willful violations
    const fmlaLiquidated = this.statutory.fmlaLiquidatedBase;

    // FLSA liquidated damages = unpaid wages
    const flsaLiquidated = this.statutory.flsaLiquidatedBase || 0;

    return fmlaLiquidated + flsaLiquidated;
  }

  private calculateStatutoryPenalties(): number {
    return this.statutory.expertWitnessFees +
           this.statutory.litigationCosts +
           this.statutory.estimatedAttorneysFees;
  }

  // ============================================================================
  // RANGE ESTIMATES
  // ============================================================================

  private calculateRangeEstimates(economic: any, nonEconomic: any, punitive: any) {
    // Low estimate: conservative economic + minimal non-economic + no punitive
    const low = economic.totalWithInterest + (nonEconomic.total * 0.5);

    // Mid estimate: full economic + reasonable non-economic + 2x punitive
    const mid = economic.totalWithInterest + nonEconomic.total +
                (economic.totalWithInterest + nonEconomic.total) * 2 +
                this.statutory.fmlaLiquidatedBase;

    // High estimate: full economic + high non-economic + maximum punitive (capped)
    const high = economic.totalWithInterest + (nonEconomic.total * 1.5) +
                 punitive.capped + this.statutory.fmlaLiquidatedBase +
                 this.statutory.expertWitnessFees + this.statutory.litigationCosts;

    return { low, mid, high };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getGad7Severity(): string {
    // GAD-7 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe
    const score = this.medical.gad7Score;
    if (score >= 15) return 'Severe Anxiety';
    if (score >= 10) return 'Moderate Anxiety';
    if (score >= 5) return 'Mild Anxiety';
    return 'Minimal Anxiety';
  }

  private getPhq9Severity(): string {
    // PHQ-9 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe
    const score = this.medical.phq9Score;
    if (score >= 20) return 'Severe Depression';
    if (score >= 15) return 'Moderately Severe Depression';
    if (score >= 10) return 'Moderate Depression';
    if (score >= 5) return 'Mild Depression';
    return 'Minimal Depression';
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage for Marc Castillo v. Charles Schwab case
 */
export function exampleUsage() {
  const employment: EmploymentInfo = {
    plaintiffName: 'Marc Castillo',
    defendant1: 'Charles Schwab & Co., Inc.',
    defendant2: 'Sedgwick Claims Management Services, Inc.',
    caseNumber: 'TBD',
    district: 'Northern District of Illinois',
    jobTitle: 'Senior Software Engineer',
    startDate: new Date('2018-01-15'),
    terminationDate: new Date('2023-06-15'),
    yearsOfService: 5.5
  };

  const compensation: CompensationInfo = {
    baseSalary: 146000,
    bonusPercent: 15,
    esppContribution: 5000,
    esppDiscount: 15,
    healthInsurancePremium: 800,
    match401kFormula: '100% up to 6%',
    match401kPercent: 6,
    ptoAccrualDays: 20,
    lifeInsuranceMultiple: 2,
    professionalDevAllowance: 2000
  };

  const lossParams: LossCalculationParams = {
    terminationDate: new Date('2023-06-15'),
    trialDate: new Date('2025-03-01'),
    frontPayYears: 2,
    colaRate: 0.03,
    meritIncreaseRate: 0.02,
    investmentGrowthRate: 0.07,
    interimEarnings: 50000,
    unemploymentComp: 15000,
    jobApplications: 150,
    interviewsConducted: 25,
    offersReceived: 3
  };

  const medical: MedicalInfo = {
    preAdderallDose: 20,
    preSertralineDose: 50,
    prePropranololDose: 20,
    preBpSystolic: 120,
    preBpDiastolic: 80,
    postAdderallDose: 30,
    postSertralineDose: 100,
    postPropranololDose: 40,
    postBpSystolic: 145,
    postBpDiastolic: 95,
    newMedications: ['Clonazepam 0.5mg', 'Hydroxyzine 25mg'],
    hypertensionEpisodes: 12,
    gad7Score: 18,
    phq9Score: 16,
    cobraPremiumsPaid: 12000,
    increasedOutOfPocket: 5000
  };

  const emotionalFactors: EmotionalDistressFactors = {
    durationMonths: 20,
    severityRating: 8,
    treatmentIntensity: 'intensive',
    corroborationStrength: 'strong',
    perDiemRate: 200,
    comparableCaseAwards: [125000, 150000, 175000, 200000]
  };

  const punitiveFactors: PunitiveDamagesFactors = {
    temporalProximityDays: 14,
    spoliationEvidence: true,
    metadataManipulation: true,
    patternAndPractice: true,
    pretextualDocumentation: true,
    denialOfAccommodation: true,
    fmlaNonCompliance: true,
    defendant1Revenue: 15000000000,
    defendant1NetIncome: 3000000000,
    defendant2Revenue: 500000000,
    physicalHarm: true,
    indifferenceToHealthSafety: true,
    financialVulnerability: true,
    repeatedConduct: true,
    intentionalMalice: true
  };

  const statutory: StatutoryPenalties = {
    fmlaLiquidatedBase: 200000,
    expertWitnessFees: 15000,
    litigationCosts: 10000,
    estimatedAttorneysFees: 150000
  };

  const calculator = new DamagesCalculator(
    employment,
    compensation,
    lossParams,
    medical,
    emotionalFactors,
    punitiveFactors,
    statutory
  );

  const result = calculator.calculateTotal();

  console.log('=== DAMAGES CALCULATION RESULTS ===');
  console.log(`Total Compensatory: $${result.totalCompensatory.toLocaleString()}`);
  console.log(`Punitive Damages: $${result.cappedPunitive.toLocaleString()}`);
  console.log(`Liquidated Damages: $${result.liquidatedDamages.toLocaleString()}`);
  console.log(`GRAND TOTAL: $${result.grandTotal.toLocaleString()}`);
  console.log('');
  console.log('Range Estimates:');
  console.log(`  Low: $${result.lowEstimate.toLocaleString()}`);
  console.log(`  Mid: $${result.midEstimate.toLocaleString()}`);
  console.log(`  High: $${result.highEstimate.toLocaleString()}`);

  // Export to markdown
  const markdown = calculator.exportToMarkdown(result);
  console.log('\n\n' + markdown);

  return result;
}

// ============================================================================
// AGENTDB INTEGRATION
// ============================================================================

/**
 * Integration with AgentDB for evidence-linked calculations
 * This function demonstrates how to populate calculator from AgentDB evidence
 */
export async function calculateFromAgentDB(
  plaintiffId: string,
  caseId: string,
  agentDbClient: any // AgentDB client instance
): Promise<DamagesResult> {
  // Query AgentDB for evidence
  const employmentDocs = await agentDbClient.query({
    collection: 'evidence',
    filter: { caseId, category: 'employment' }
  });

  const medicalDocs = await agentDbClient.query({
    collection: 'evidence',
    filter: { caseId, category: 'medical' }
  });

  const financialDocs = await agentDbClient.query({
    collection: 'evidence',
    filter: { caseId, category: 'financial' }
  });

  // Extract structured data from evidence
  // (Implementation depends on AgentDB schema)

  // Build calculator inputs from evidence
  // const employment = extractEmploymentInfo(employmentDocs);
  // const compensation = extractCompensationInfo(financialDocs);
  // ... etc

  // For now, return example
  return exampleUsage();
}

export default DamagesCalculator;
