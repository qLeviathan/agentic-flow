# DAMAGES METHODOLOGY & CALCULATION FRAMEWORK
## Comprehensive Economic and Non-Economic Damages Analysis

---

## I. EXECUTIVE SUMMARY

This methodology provides a systematic framework for calculating damages in employment discrimination, retaliation, and wrongful termination cases. It incorporates economic damages (lost wages, benefits), non-economic damages (emotional distress), punitive damages, and statutory penalties across multiple federal statutes: ADA, FMLA, ERISA, and SOX.

**Total Estimated Damages Range: ${{MIN_DAMAGES}} - ${{MAX_DAMAGES}}**

---

## II. ECONOMIC DAMAGES

### A. Lost Wages Analysis

#### 1. Base Compensation Structure

**Pre-Termination Compensation:**
```
Base Salary:                    $146,000/year
Target Bonus (15%):             $ 21,900/year
ESPP Contribution (estimated):  $  5,000/year
---------------------------------------------------
Total Annual Compensation:      $172,900/year
Daily Rate:                     $  473.42/day
Hourly Rate:                    $  59.18/hour
```

**Calculation Methodology:**
- Base salary: Documented in employment agreement [{{BATES_SALARY}}]
- Bonus: Historical average {{BONUS_AVERAGE}}% × base salary
- ESPP: Employer match {{ESPP_MATCH}}% on {{ESPP_CONTRIBUTION}}% employee contribution
- Benefits: Actuarial value of medical, dental, vision, 401(k) match

#### 2. Temporal Calculation

**Loss Period: {{TERMINATION_DATE}} through {{TRIAL_DATE}}**

| Period | Duration | Daily Rate | Subtotal |
|--------|----------|------------|----------|
| Year 1 ({{YEAR_1}}) | {{DAYS_YEAR_1}} days | $473.42 | ${{TOTAL_YEAR_1}} |
| Year 2 ({{YEAR_2}}) | {{DAYS_YEAR_2}} days | $473.42 | ${{TOTAL_YEAR_2}} |
| Year 3 ({{YEAR_3}}) | {{DAYS_YEAR_3}} days | $473.42 | ${{TOTAL_YEAR_3}} |
| **Subtotal (through trial)** | | | **${{SUBTOTAL_LOST_WAGES}}** |

**Projected Front Pay (post-trial to full make-whole):**
- Additional {{FRONT_PAY_YEARS}} years: ${{FRONT_PAY_TOTAL}}
- Based on reasonable time to achieve comparable employment

**TOTAL LOST WAGES: ${{TOTAL_LOST_WAGES}}**

#### 3. Annual Escalation

Courts recognize inflationary adjustments and typical salary progression:
- Cost of Living Adjustment (COLA): {{COLA_RATE}}% annually
- Merit Increases: {{MERIT_RATE}}% annually (based on historical performance)
- Total Annual Escalation: {{TOTAL_ESCALATION}}%

**Escalated Compensation Table:**

| Year | Base Escalation | Projected Annual Comp | Lost Wages |
|------|-----------------|----------------------|------------|
| 1 | 0% | $172,900 | ${{YEAR_1_LOSS}} |
| 2 | {{ESCALATION_Y2}}% | ${{COMP_Y2}} | ${{YEAR_2_LOSS}} |
| 3 | {{ESCALATION_Y3}}% | ${{COMP_Y3}} | ${{YEAR_3_LOSS}} |
| 4 | {{ESCALATION_Y4}}% | ${{COMP_Y4}} | ${{YEAR_4_LOSS}} |

**ESCALATED TOTAL: ${{ESCALATED_TOTAL}}**

### B. Lost Benefits

#### 1. Health Insurance

**Medical, Dental, Vision Coverage:**
- Employer Premium Contribution: ${{HEALTH_PREMIUM_MONTHLY}}/month
- Loss Period: {{BENEFITS_LOSS_MONTHS}} months
- **Total Health Insurance Loss: ${{HEALTH_INSURANCE_TOTAL}}**

**Out-of-Pocket Medical Costs:**
- COBRA premiums paid: ${{COBRA_PAID}}
- Increased deductibles/co-pays: ${{INCREASED_MEDICAL}}
- **Total Additional Medical: ${{ADDITIONAL_MEDICAL_TOTAL}}**

#### 2. Retirement Benefits

**401(k) Matching:**
- Employer Match Formula: {{MATCH_FORMULA}}
- Employee Contribution Rate: {{EMPLOYEE_401K_RATE}}%
- Annual Match Loss: ${{ANNUAL_401K_LOSS}}
- Loss Period: {{YEARS_LOST}}
- **Total 401(k) Loss: ${{TOTAL_401K_LOSS}}**

**Lost Investment Growth:**
- Assumed Growth Rate: {{INVESTMENT_GROWTH_RATE}}%
- Opportunity Cost: ${{INVESTMENT_OPPORTUNITY_COST}}

#### 3. Employee Stock Purchase Plan (ESPP)

**Purchase Discount Loss:**
- ESPP Discount: {{ESPP_DISCOUNT}}% below market
- Eligible Salary: {{ESPP_ELIGIBLE_SALARY}}%
- Maximum Contribution: ${{ESPP_MAX_CONTRIBUTION}}/year
- Annual Discount Value: ${{ANNUAL_ESPP_VALUE}}
- Loss Period: {{YEARS_LOST}}
- **Total ESPP Loss: ${{TOTAL_ESPP_LOSS}}**

**Stock Appreciation:**
- {{DEFENDANT_1}} stock performance during loss period: {{STOCK_APPRECIATION}}%
- Additional opportunity loss: ${{STOCK_APPRECIATION_LOSS}}

#### 4. Other Benefits

**Paid Time Off (PTO):**
- Accrual Rate: {{PTO_ACCRUAL}} days/year
- Value: ${{PTO_VALUE}}/day
- **Total PTO Loss: ${{TOTAL_PTO_LOSS}}**

**Life Insurance:**
- Employer-Paid Coverage: {{LIFE_INSURANCE_COVERAGE}}× salary
- Replacement Premium Cost: ${{LIFE_INSURANCE_ANNUAL}}/year
- **Total Life Insurance Loss: ${{TOTAL_LIFE_INSURANCE_LOSS}}**

**Professional Development:**
- Annual Training Allowance: ${{TRAINING_ALLOWANCE}}
- Certification Maintenance: ${{CERT_MAINTENANCE}}
- **Total Professional Development Loss: ${{TOTAL_PROF_DEV_LOSS}}**

#### 5. Benefits Summary

| Benefit Category | Annual Value | Total Loss |
|------------------|--------------|------------|
| Health Insurance | ${{HEALTH_ANNUAL}} | ${{HEALTH_TOTAL}} |
| 401(k) Match | ${{401K_ANNUAL}} | ${{401K_TOTAL}} |
| ESPP | ${{ESPP_ANNUAL}} | ${{ESPP_TOTAL}} |
| PTO | ${{PTO_ANNUAL}} | ${{PTO_TOTAL}} |
| Life Insurance | ${{LIFE_ANNUAL}} | ${{LIFE_TOTAL}} |
| Professional Dev | ${{PROF_DEV_ANNUAL}} | ${{PROF_DEV_TOTAL}} |
| **TOTAL BENEFITS** | **${{BENEFITS_ANNUAL}}** | **${{BENEFITS_TOTAL}}** |

### C. Mitigation Analysis

Plaintiffs have a duty to mitigate damages by seeking comparable employment. However, mitigation does not apply when:
1. Plaintiff made reasonable efforts to find comparable work
2. Comparable positions were unavailable due to market conditions
3. Plaintiff's reputation was damaged by Defendants' actions

**{{PLAINTIFF_NAME}}'s Mitigation Efforts:**
- Job applications submitted: {{APPLICATIONS_SUBMITTED}}
- Interviews conducted: {{INTERVIEWS_CONDUCTED}}
- Offers received: {{OFFERS_RECEIVED}}
- Reasons for offer rejections: {{REJECTION_REASONS}}

**Interim Earnings:**
- Subsequent employment from {{SUBSEQUENT_START_DATE}}
- Annual compensation: ${{SUBSEQUENT_COMPENSATION}}
- Difference from prior role: ${{COMPENSATION_DIFFERENCE}}

**Mitigation Deduction Calculation:**
```
Gross Lost Wages:          ${{GROSS_LOST_WAGES}}
Less: Interim Earnings:    ${{INTERIM_EARNINGS}}
Less: Unemployment Comp:   ${{UNEMPLOYMENT_COMP}}
---------------------------------------------------
NET LOST WAGES:            ${{NET_LOST_WAGES}}
```

**Note**: If {{PLAINTIFF_NAME}} accepted substantially lower compensation due to urgent financial need caused by Defendants' wrongful termination, this does not constitute failure to mitigate. *Ford Motor Co. v. EEOC*, 458 U.S. 219, 231 (1982).

### D. Economic Damages Summary

| Component | Amount |
|-----------|--------|
| Lost Wages (Net) | ${{NET_LOST_WAGES}} |
| Lost Benefits | ${{BENEFITS_TOTAL}} |
| **TOTAL ECONOMIC DAMAGES** | **${{TOTAL_ECONOMIC}}** |

**Pre-Judgment Interest**: ${{PREJUDGMENT_INTEREST}} at {{INTEREST_RATE}}% from {{ACCRUAL_START_DATE}}

**ECONOMIC DAMAGES WITH INTEREST: ${{ECONOMIC_WITH_INTEREST}}**

---

## III. NON-ECONOMIC DAMAGES

### A. Emotional Distress Damages

#### 1. Legal Standard

Under federal employment discrimination statutes, compensatory damages include "future pecuniary losses, emotional pain, suffering, inconvenience, mental anguish, loss of enjoyment of life, and other nonpecuniary losses." 42 U.S.C. § 1981a(b)(3).

The Seventh Circuit recognizes emotional distress damages based on:
- Severity and duration of emotional harm
- Medical treatment and medications
- Impact on daily life and relationships
- Corroborating evidence (medical records, testimony)

*Timm v. Progressive Steel Treating, Inc.*, 137 F.3d 1008, 1010 (7th Cir. 1998).

#### 2. Medical Documentation

**{{PLAINTIFF_NAME}}'s Medical Treatment Timeline:**

| Date | Provider | Diagnosis/Treatment | Evidence |
|------|----------|---------------------|----------|
| {{PRE_TERMINATION_DATE}} | {{PROVIDER_1}} | Baseline: {{BASELINE_DIAGNOSIS}} | {{BATES_MED_001}} |
| {{POST_TERMINATION_DATE_1}} | {{PROVIDER_2}} | Escalation: {{ESCALATION_DIAGNOSIS}} | {{BATES_MED_002}} |
| {{POST_TERMINATION_DATE_2}} | {{PROVIDER_3}} | Hypertension: {{BP_READING}} | {{BATES_MED_003}} |
| {{POST_TERMINATION_DATE_3}} | {{PROVIDER_4}} | Medication adjustment | {{BATES_MED_004}} |

**Medication Escalation:**

**Pre-Termination (Baseline):**
- Adderall: {{ADDERALL_PRE_DOSE}} mg/day
- Sertraline: {{SERTRALINE_PRE_DOSE}} mg/day
- Propranolol: {{PROPRANOLOL_PRE_DOSE}} mg/day

**Post-Termination (Escalated):**
- Adderall: {{ADDERALL_POST_DOSE}} mg/day ({{ADDERALL_INCREASE}}% increase)
- Sertraline: {{SERTRALINE_POST_DOSE}} mg/day ({{SERTRALINE_INCREASE}}% increase)
- Propranolol: {{PROPRANOLOL_POST_DOSE}} mg/day ({{PROPRANOLOL_INCREASE}}% increase)
- **New Medications:** {{NEW_MEDICATIONS}}

**Clinical Significance:**
The {{MEDICATION_INCREASE_PERCENT}}% increase in medication dosages, combined with new prescriptions for {{NEW_MEDICATIONS}}, demonstrates objective worsening of mental health directly attributable to Defendants' conduct.

#### 3. Documented Symptoms

**Physical Manifestations:**
- Hypertensive episodes: {{HYPERTENSION_EPISODES}} documented instances
- Blood pressure readings: {{BP_RANGE}} (compared to baseline {{BP_BASELINE}})
- Sleep disturbances: {{SLEEP_DISTURBANCE_DESCRIPTION}}
- Weight changes: {{WEIGHT_CHANGE}} lbs
- Chronic headaches: {{HEADACHE_FREQUENCY}}

**Psychological Symptoms:**
- Anxiety: {{ANXIETY_SEVERITY}} (GAD-7 score: {{GAD7_SCORE}})
- Depression: {{DEPRESSION_SEVERITY}} (PHQ-9 score: {{PHQ9_SCORE}})
- PTSD symptoms: {{PTSD_SYMPTOMS}}
- Panic attacks: {{PANIC_FREQUENCY}}
- Suicidal ideation: {{SUICIDAL_IDEATION_YN}}

**Social/Occupational Impairment:**
- Relationship strain: {{RELATIONSHIP_IMPACT}}
- Social withdrawal: {{SOCIAL_WITHDRAWAL}}
- Career setback: {{CAREER_IMPACT}}
- Financial stress: {{FINANCIAL_STRESS}}
- Loss of professional reputation: {{REPUTATION_DAMAGE}}

#### 4. Valuation Methodology

**Comparable Case Awards (7th Circuit):**

| Case | Year | Emotional Distress Award | Circumstances |
|------|------|--------------------------|---------------|
| {{COMPARABLE_CASE_1}} | {{YEAR_1}} | ${{AWARD_1}} | {{CIRCUMSTANCES_1}} |
| {{COMPARABLE_CASE_2}} | {{YEAR_2}} | ${{AWARD_2}} | {{CIRCUMSTANCES_2}} |
| {{COMPARABLE_CASE_3}} | {{YEAR_3}} | ${{AWARD_3}} | {{CIRCUMSTANCES_3}} |
| {{COMPARABLE_CASE_4}} | {{YEAR_4}} | ${{AWARD_4}} | {{CIRCUMSTANCES_4}} |

**Average Comparable Award: ${{AVERAGE_COMPARABLE}}**

**Adjustment Factors:**
- Duration of distress: {{DURATION_MONTHS}} months (ongoing)
- Severity: {{SEVERITY_RATING}} (scale 1-10)
- Medical treatment intensity: {{TREATMENT_INTENSITY}}
- Corroboration strength: {{CORROBORATION_STRENGTH}}

**Per Diem Method:**
- Daily suffering value: ${{PER_DIEM_RATE}}
- Days of distress: {{DAYS_OF_DISTRESS}}
- **Per Diem Total: ${{PER_DIEM_TOTAL}}**

**Recommended Range:**
- Low: ${{EMOTIONAL_DISTRESS_LOW}} (conservative, well-documented minimum)
- Mid: ${{EMOTIONAL_DISTRESS_MID}} (comparable case average)
- High: ${{EMOTIONAL_DISTRESS_HIGH}} (upper range for egregious conduct)

**ESTIMATED EMOTIONAL DISTRESS DAMAGES: ${{EMOTIONAL_DISTRESS_ESTIMATED}}**

### B. Loss of Reputation

Professional reputation damage in specialized fields (financial services, technology) can constitute compensable harm.

**{{PLAINTIFF_NAME}}'s Reputation Damage:**
- Industry standing prior to termination: {{INDUSTRY_STANDING}}
- Impact on job search: {{JOB_SEARCH_IMPACT}}
- Professional network effects: {{NETWORK_EFFECTS}}
- Industry blacklisting: {{BLACKLISTING_EVIDENCE}}

**Valuation:** ${{REPUTATION_DAMAGE_VALUE}}

[EVIDENCE NEEDED: Industry expert testimony on reputation quantification]

### C. Loss of Enjoyment of Life

**Hedonic Damages:**
- Hobbies/activities abandoned: {{ABANDONED_ACTIVITIES}}
- Family/social events missed: {{MISSED_EVENTS}}
- Quality of life degradation: {{QOL_DEGRADATION}}

**Valuation:** ${{HEDONIC_DAMAGES}}

### D. Non-Economic Damages Summary

| Component | Amount |
|-----------|--------|
| Emotional Distress | ${{EMOTIONAL_DISTRESS_ESTIMATED}} |
| Reputation Loss | ${{REPUTATION_DAMAGE_VALUE}} |
| Loss of Enjoyment | ${{HEDONIC_DAMAGES}} |
| **TOTAL NON-ECONOMIC** | **${{TOTAL_NON_ECONOMIC}}** |

---

## IV. PUNITIVE DAMAGES

### A. Legal Standard

Punitive damages are available under federal employment discrimination statutes when the defendant acted "with malice or with reckless indifference to the federally protected rights of an aggrieved individual." 42 U.S.C. § 1981a(b)(1).

The Seventh Circuit defines this standard as conduct involving:
- "Knowledge that [the conduct] may violate federal law"
- Or "reckless disregard of the possibility" of violation

*Kolstad v. American Dental Ass'n*, 527 U.S. 526, 536 (1999).

### B. Evidence of Malice/Reckless Indifference

**{{DEFENDANT_1}}'s Conduct:**

1. **Temporal Proximity**: Termination {{TIMING_DAYS}} days after accommodation request demonstrates consciousness of protected activity.

2. **Spoliation**: Intentional destruction/manipulation of evidence [{{BATES_SPOLIATION}}] shows consciousness of wrongdoing and reckless disregard for legal obligations.

3. **Metadata Manipulation**: {{DEFENDANT_2}}'s alteration of document timestamps [{{BATES_METADATA}}] demonstrates deliberate concealment, elevating conduct to malicious level.

4. **Pattern and Practice**: Evidence of similar treatment of other employees engaging in protected activities [{{BATES_PATTERN}}].

5. **Pretextual Documentation**: Creation of post-hoc performance complaints contradicted by contemporaneous records shows calculated effort to manufacture justification.

6. **Denial of Accommodation**: Rejecting medically necessary accommodation without interactive process violates well-established ADA requirements, demonstrating reckless indifference.

7. **FMLA Non-Compliance**: Failure to provide designation notice violates clear regulatory requirements (29 C.F.R. § 825.300(b)), showing reckless disregard.

### C. RICO Conspiracy Theory (If Applicable)

If evidence supports coordination between {{DEFENDANT_1}} and {{DEFENDANT_2}} to systematically deny claims and retaliate against employees, RICO treble damages may apply:

**18 U.S.C. § 1964(c) - Treble Damages:**
- Pattern of racketeering activity: {{RICO_PATTERN}}
- Enterprise: {{RICO_ENTERPRISE}}
- Predicate acts: {{RICO_PREDICATES}}

**RICO Damages: 3× (Economic + Non-Economic) = ${{RICO_TREBLE}}**

[EVIDENCE NEEDED: Additional instances demonstrating pattern/enterprise]

### D. Punitive Damages Calculation

**Constitutional Limitations:**

The Supreme Court holds that punitive damages exceeding a single-digit ratio to compensatory damages may violate due process. *State Farm Mut. Auto. Ins. Co. v. Campbell*, 538 U.S. 408, 425 (2003).

However, particularly egregious conduct can support higher multipliers, especially when:
- Compensatory damages are small (not applicable here)
- Conduct was especially reprehensible
- Defendant has substantial net worth

**Reprehensibility Factors (All Present):**
1. ✓ Physical harm (hypertension, medical escalation)
2. ✓ Indifference to health/safety
3. ✓ Financial vulnerability of plaintiff
4. ✓ Conduct repeated/part of pattern
5. ✓ Intentional malice vs. mere accident

*BMW of North America, Inc. v. Gore*, 517 U.S. 559, 576-77 (1996).

**Defendant's Financial Condition:**
- {{DEFENDANT_1}} Annual Revenue: ${{DEFENDANT_1_REVENUE}}
- {{DEFENDANT_1}} Net Income: ${{DEFENDANT_1_NET_INCOME}}
- {{DEFENDANT_2}} Annual Revenue: ${{DEFENDANT_2_REVENUE}}

**Punitive Damages Calculation:**

| Ratio | Multiplier | Compensatory Base | Punitive Amount |
|-------|------------|-------------------|-----------------|
| 1:1 | 1× | ${{COMPENSATORY_BASE}} | ${{PUNITIVE_1X}} |
| 2:1 | 2× | ${{COMPENSATORY_BASE}} | ${{PUNITIVE_2X}} |
| 4:1 | 4× | ${{COMPENSATORY_BASE}} | ${{PUNITIVE_4X}} |
| 9:1 | 9× | ${{COMPENSATORY_BASE}} | ${{PUNITIVE_9X}} |

**Recommended**: 4:1 ratio = **${{PUNITIVE_RECOMMENDED}}** (given spoliation and metadata manipulation)

**Statutory Cap (42 U.S.C. § 1981a(b)(3)):**
- Employer size: {{EMPLOYER_SIZE}} employees
- Cap: ${{STATUTORY_CAP}}

If jury awards exceed cap, court reduces to statutory maximum.

**ESTIMATED PUNITIVE DAMAGES: ${{PUNITIVE_ESTIMATED}}**

---

## V. LIQUIDATED DAMAGES

### A. FMLA Liquidated Damages

The FMLA provides for liquidated damages equal to compensable lost wages for willful violations:

> "Any employer who violates section 2615 of this title shall be liable... for an additional amount as liquidated damages equal to the sum of the amount [of damages] and the interest on such amount."

29 U.S.C. § 2617(a)(1)(A)(iii).

**Willfulness Standard:**
A violation is willful if the employer "knew or showed reckless disregard for the matter of whether its conduct was prohibited by the statute." *Brohm v. JH Properties, Inc.*, 149 F.3d 517, 523 (6th Cir. 1998).

**Evidence of Willfulness:**
- Failure to provide designation notice despite clear regulatory requirement
- Retaliation immediately following FMLA request
- HR personnel's knowledge of FMLA obligations

**FMLA Liquidated Damages: ${{FMLA_LIQUIDATED}}** (equals lost wages attributable to FMLA violation)

### B. FLSA Liquidated Damages (If Applicable)

If overtime or wage-and-hour violations exist, FLSA provides automatic liquidated damages equal to unpaid wages:

29 U.S.C. § 216(b).

[EVIDENCE NEEDED: Timekeeping records showing unpaid overtime]

**FLSA Liquidated Damages (if applicable): ${{FLSA_LIQUIDATED}}**

### C. Liquidated Damages Summary

| Statute | Base Damages | Liquidated Amount |
|---------|--------------|-------------------|
| FMLA | ${{FMLA_BASE}} | ${{FMLA_LIQUIDATED}} |
| FLSA | ${{FLSA_BASE}} | ${{FLSA_LIQUIDATED}} |
| **TOTAL LIQUIDATED** | | **${{TOTAL_LIQUIDATED}}** |

---

## VI. STATUTORY PENALTIES

### A. ADA Violations

While the ADA does not provide per-violation penalties, attorney's fees and costs are available under 42 U.S.C. § 12205.

**Estimated Attorney's Fees (if represented)**: ${{ADA_ATTORNEYS_FEES}}

### B. SOX Whistleblower

SOX provides "all relief necessary to make the employee whole," including:
- Reinstatement with same seniority
- Back pay with interest
- Compensation for special damages (litigation costs, expert fees, reasonable attorney's fees)

18 U.S.C. § 1514A(c).

**Special Damages:**
- Expert witness fees: ${{EXPERT_FEES}}
- Litigation costs: ${{LITIGATION_COSTS}}
- **Total Special Damages: ${{SOX_SPECIAL_DAMAGES}}**

### C. ERISA Penalties

ERISA § 502(g) provides for attorney's fees at the court's discretion. 29 U.S.C. § 1132(g).

**Estimated ERISA Attorney's Fees**: ${{ERISA_ATTORNEYS_FEES}}

### D. Statutory Penalties Summary

| Statute | Penalty Type | Amount |
|---------|--------------|--------|
| ADA | Attorney's Fees | ${{ADA_ATTORNEYS_FEES}} |
| SOX | Special Damages | ${{SOX_SPECIAL_DAMAGES}} |
| ERISA | Attorney's Fees | ${{ERISA_ATTORNEYS_FEES}} |
| **TOTAL STATUTORY** | | **${{TOTAL_STATUTORY}}** |

---

## VII. COMPREHENSIVE DAMAGES SUMMARY

### A. Total Damages Table

| Category | Low Estimate | Mid Estimate | High Estimate |
|----------|--------------|--------------|---------------|
| **Economic Damages** |
| Lost Wages (Net) | ${{LOST_WAGES_LOW}} | ${{LOST_WAGES_MID}} | ${{LOST_WAGES_HIGH}} |
| Lost Benefits | ${{BENEFITS_LOW}} | ${{BENEFITS_MID}} | ${{BENEFITS_HIGH}} |
| *Subtotal Economic* | *${{ECONOMIC_LOW}}* | *${{ECONOMIC_MID}}* | *${{ECONOMIC_HIGH}}* |
| **Non-Economic Damages** |
| Emotional Distress | ${{EMOTIONAL_LOW}} | ${{EMOTIONAL_MID}} | ${{EMOTIONAL_HIGH}} |
| Reputation/Hedonic | ${{OTHER_NON_ECON_LOW}} | ${{OTHER_NON_ECON_MID}} | ${{OTHER_NON_ECON_HIGH}} |
| *Subtotal Non-Economic* | *${{NON_ECON_LOW}}* | *${{NON_ECON_MID}}* | *${{NON_ECON_HIGH}}* |
| **Compensatory Total** | **${{COMPENSATORY_LOW}}** | **${{COMPENSATORY_MID}}** | **${{COMPENSATORY_HIGH}}** |
| **Additional Damages** |
| Punitive Damages | ${{PUNITIVE_LOW}} | ${{PUNITIVE_MID}} | ${{PUNITIVE_HIGH}} |
| Liquidated Damages | ${{LIQUIDATED_LOW}} | ${{LIQUIDATED_MID}} | ${{LIQUIDATED_HIGH}} |
| Statutory Penalties | ${{STATUTORY_LOW}} | ${{STATUTORY_MID}} | ${{STATUTORY_HIGH}} |
| **GRAND TOTAL** | **${{TOTAL_LOW}}** | **${{TOTAL_MID}}** | **${{TOTAL_HIGH}}** |

### B. Recommended Demand

**Conservative Demand**: ${{RECOMMENDED_CONSERVATIVE}} (likely to survive summary judgment and appeal)

**Reasonable Demand**: ${{RECOMMENDED_REASONABLE}} (supported by comparable verdicts)

**Maximum Demand**: ${{RECOMMENDED_MAXIMUM}} (full measure of damages, subject to statutory caps)

### C. Settlement Range Analysis

Based on comparable settlements in the 7th Circuit and typical resolution patterns:

**Pre-Trial Settlement Range**: ${{SETTLEMENT_LOW}} - ${{SETTLEMENT_HIGH}}

**Factors Favoring Higher Settlement:**
- Strength of documentary evidence
- Spoliation sanctions risk
- Reputational risk to defendants
- Jury appeal of plaintiff's case

**Factors Favoring Lower Settlement:**
- Mitigation evidence
- Interim employment
- Statutory caps on certain damages

---

## VIII. CASE PRECEDENT RESEARCH

### A. Comparable 7th Circuit Awards

#### 1. ADA Retaliation

**{{CASE_NAME_1}}**, {{CITATION_1}} ({{COURT_1}} {{YEAR_1}}):
- Facts: {{FACTS_1}}
- Award: ${{AWARD_1}}
- Breakdown: Economic ${{ECON_1}}, Emotional ${{EMOTIONAL_1}}, Punitive ${{PUNITIVE_1}}
- Relevance: {{RELEVANCE_1}}

**{{CASE_NAME_2}}**, {{CITATION_2}} ({{COURT_2}} {{YEAR_2}}):
- Facts: {{FACTS_2}}
- Award: ${{AWARD_2}}
- Breakdown: Economic ${{ECON_2}}, Emotional ${{EMOTIONAL_2}}, Punitive ${{PUNITIVE_2}}
- Relevance: {{RELEVANCE_2}}

#### 2. FMLA Interference/Retaliation

**{{CASE_NAME_3}}**, {{CITATION_3}} ({{COURT_3}} {{YEAR_3}}):
- Facts: {{FACTS_3}}
- Award: ${{AWARD_3}}
- Liquidated Damages: {{LIQUIDATED_3}}
- Relevance: {{RELEVANCE_3}}

#### 3. ERISA § 510

**{{CASE_NAME_4}}**, {{CITATION_4}} ({{COURT_4}} {{YEAR_4}}):
- Facts: {{FACTS_4}}
- Award: ${{AWARD_4}}
- Relevance: {{RELEVANCE_4}}

#### 4. SOX Whistleblower

**{{CASE_NAME_5}}**, {{CITATION_5}} ({{COURT_5}} {{YEAR_5}}):
- Facts: {{FACTS_5}}
- Award: ${{AWARD_5}}
- Relevance: {{RELEVANCE_5}}

#### 5. Spoliation Sanctions

**{{CASE_NAME_6}}**, {{CITATION_6}} ({{COURT_6}} {{YEAR_6}}):
- Facts: {{FACTS_6}}
- Sanction: {{SANCTION_6}}
- Relevance: {{RELEVANCE_6}}

[EVIDENCE NEEDED: Comprehensive Westlaw/Lexis search for 7th Circuit precedents 2020-2025]

### B. National High-Value Verdicts

For context and negotiation leverage:

| Case | Jurisdiction | Year | Verdict | Claims |
|------|--------------|------|---------|--------|
| {{HIGH_CASE_1}} | {{JURIS_1}} | {{YR_1}} | ${{VERDICT_1}} | {{CLAIMS_1}} |
| {{HIGH_CASE_2}} | {{JURIS_2}} | {{YR_2}} | ${{VERDICT_2}} | {{CLAIMS_2}} |
| {{HIGH_CASE_3}} | {{JURIS_3}} | {{YR_3}} | ${{VERDICT_3}} | {{CLAIMS_3}} |

---

## IX. INTERACTIVE CALCULATOR INTEGRATION

This methodology integrates with the TypeScript damages calculator (`damages-calculator.ts`) to enable:

1. **Real-Time Updates**: As trial date changes or interim earnings are updated, all dependent calculations refresh automatically.

2. **Scenario Analysis**: Toggle assumptions (interest rates, front pay duration, punitive multipliers) to model settlement ranges.

3. **Evidence Linking**: Each calculation links to supporting Bates-stamped evidence in AgentDB.

4. **Export Formats**: Generate formatted damages summaries for:
   - Settlement demand letters
   - Expert witness reports
   - Jury instructions
   - Trial exhibits

**Usage Example:**
```typescript
import { DamagesCalculator } from './damages-calculator';

const calculator = new DamagesCalculator({
  terminationDate: '2023-06-15',
  trialDate: '2025-03-01',
  baseSalary: 146000,
  bonusPercent: 15,
  esppContribution: 5000
});

const damages = calculator.calculateTotal();
console.log(damages.totalLow, damages.totalMid, damages.totalHigh);
```

---

## X. EVIDENCE GAPS & DISCOVERY PRIORITIES

### Critical Evidence Still Needed:

1. **[HIGH PRIORITY]** Medical records documenting pre/post-termination mental health
2. **[HIGH PRIORITY]** Complete benefits summary with vesting schedules
3. **[HIGH PRIORITY]** Forensic analysis report of metadata manipulation
4. **[MEDIUM PRIORITY]** Comparator employee performance records
5. **[MEDIUM PRIORITY]** Industry expert testimony on reputation valuation
6. **[MEDIUM PRIORITY]** {{DEFENDANT_1}} financial statements for punitive damages analysis
7. **[LOW PRIORITY]** Timekeeping records for potential FLSA claims

### Discovery Requests to Issue:

- Interrogatories on document destruction policies
- RFPs for all communications mentioning {{PLAINTIFF_NAME}}
- Depositions of HR personnel and decision-makers
- Subpoena to IT department for metadata audit logs

---

## XI. TEMPLATE VARIABLES REFERENCE

**Financial Variables:**
- `{{BASE_SALARY}}` - Annual base salary
- `{{BONUS_PERCENTAGE}}` - Target bonus percentage
- `{{ESPP_CONTRIBUTION}}` - ESPP contribution amount
- All `{{*_LOW}}`, `{{*_MID}}`, `{{*_HIGH}}` - Damage range estimates
- All `{{TOTAL_*}}` - Calculated totals

**Temporal Variables:**
- `{{TERMINATION_DATE}}` - Employment end date
- `{{TRIAL_DATE}}` - Projected/actual trial date
- `{{*_START_DATE}}` - Various activity start dates

**Medical Variables:**
- `{{*_DOSE}}` - Medication dosages (pre/post)
- `{{BP_*}}` - Blood pressure readings
- `{{GAD7_SCORE}}`, `{{PHQ9_SCORE}}` - Clinical assessment scores

**Evidence Variables:**
- `{{BATES_*}}` - Bates-stamped exhibit references

**Status Indicators:**
- `[EVIDENCE NEEDED: description]` - Marks gaps requiring additional discovery

---

## XII. CONCLUSION

This comprehensive damages methodology provides a systematic, evidence-based framework for calculating all compensable harm resulting from Defendants' unlawful conduct. The damages range of **${{TOTAL_LOW}} - ${{TOTAL_HIGH}}** reflects conservative to maximum valuations supported by 7th Circuit precedent.

The interactive calculator enables real-time adjustments as additional evidence emerges and trial dates are confirmed. Integration with AgentDB ensures all calculations are directly linked to supporting documentation.

**Recommended Jury Demand: ${{RECOMMENDED_REASONABLE}}**

This figure balances maximum recovery with realistic expectations based on comparable verdicts, statutory caps, and settlement leverage.

---

**Last Updated: {{LAST_UPDATED}}**
**Version: {{VERSION}}**
**Generated by: Pro Se Platform Legal Document Generator**
