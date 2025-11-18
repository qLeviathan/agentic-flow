#!/usr/bin/env python3
"""
Predictive Case Outcome Model - Castillo v. Schwab & Sedgwick
Advanced ML and statistical techniques for case outcome prediction

Features:
- Bayesian inference for probability updates
- Monte Carlo simulation (10,000+ iterations)
- Decision tree analysis for strategic paths
- Ensemble methods for robust predictions
- Confidence intervals (90%, 95%, 99%)
"""

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import beta, norm, lognorm, gamma
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class CastilloCasePredictor:
    """
    Predictive model for Castillo v. Schwab & Sedgwick case outcome
    """

    def __init__(self):
        """Initialize case parameters from evidence"""
        # Evidence strength parameters (0-1 scale)
        self.evidence_strength = {
            'temporal_proximity': 0.95,  # 7-14 days consistently (p=0.0012)
            'medical_escalation': 0.92,  # BP 180→205 with doctor causation (p=0.0043)
            'statistical_significance': 0.98,  # p < 0.05 for all patterns
            'sedgwick_fraud': 0.95,  # Metadata manipulation (p<0.00001)
            'documentary_evidence': 0.90,  # 150+ docs with Bates numbering
            'multiple_statutes': 0.85,  # 6 federal claims
        }

        # Claim strength parameters
        self.claims = {
            'ADA_retaliation': {'strength': 0.90, 'temporal_proximity_days': 7},
            'FMLA_interference': {'strength': 0.85, 'temporal_proximity_days': 45},
            'ERISA_510': {'strength': 0.80, 'temporal_proximity_days': 14},
            'SOX_whistleblower': {'strength': 0.90, 'temporal_proximity_days': 7},
            'constructive_discharge': {'strength': 0.85, 'medical_correlation': 0.92},
            'spoliation': {'strength': 0.95, 'metadata_anomalies': 15},
        }

        # Pro se bias factor (7th Circuit)
        self.pro_se_bias = 0.85  # Slight disadvantage vs represented plaintiff

        # 7th Circuit historical data (benchmarking)
        self.circuit_7_data = {
            'ADA_retaliation_survival_rate': 0.65,
            'FMLA_survival_rate': 0.60,
            'SOX_survival_rate': 0.55,
            'trial_verdict_plaintiff': 0.38,  # 38% plaintiff win rate at trial
            'median_ADA_verdict': 275000,
            'median_FMLA_verdict': 180000,
            'median_SOX_verdict': 425000,
            'median_settlement': 125000,
            'settlement_rate': 0.92,  # 92% of cases settle
        }

        # Damages parameters (from DAMAGES-METHODOLOGY.md)
        self.damages = {
            'economic_low': 909000,
            'economic_mid': 1200000,
            'economic_high': 1500000,
            'emotional_low': 150000,
            'emotional_mid': 250000,
            'emotional_high': 450000,
            'punitive_low': 300000,  # Statutory cap
            'punitive_mid': 1500000,  # Pre-cap 4:1 ratio
            'punitive_high': 6000000,  # Pre-cap egregious conduct
            'liquidated_damages': 200000,  # FMLA doubling
        }

    def bayesian_claim_survival(self, claim_name: str) -> Dict[str, float]:
        """
        Bayesian inference for summary judgment survival probability

        Updates prior probability with evidence strength
        """
        claim = self.claims[claim_name]

        # Prior probability (7th Circuit base rate)
        if 'ADA' in claim_name:
            prior = self.circuit_7_data['ADA_retaliation_survival_rate']
        elif 'FMLA' in claim_name:
            prior = self.circuit_7_data['FMLA_survival_rate']
        elif 'SOX' in claim_name:
            prior = self.circuit_7_data['SOX_survival_rate']
        else:
            prior = 0.60  # Default for other claims

        # Likelihood ratio from evidence strength
        strength = claim['strength']

        # Bayesian update: P(survival|evidence) = P(evidence|survival) * P(survival) / P(evidence)
        # Strong evidence increases survival probability
        likelihood_survival = strength
        likelihood_dismissal = 1 - strength

        # Calculate posterior
        posterior_numerator = likelihood_survival * prior
        posterior_denominator = (likelihood_survival * prior) + (likelihood_dismissal * (1 - prior))
        posterior = posterior_numerator / posterior_denominator

        # Adjust for pro se bias
        adjusted_posterior = posterior * self.pro_se_bias

        # Calculate confidence intervals using Beta distribution
        # Beta(α, β) where α=successes, β=failures
        alpha = adjusted_posterior * 100
        beta_param = (1 - adjusted_posterior) * 100

        ci_90 = beta.interval(0.90, alpha, beta_param)
        ci_95 = beta.interval(0.95, alpha, beta_param)
        ci_99 = beta.interval(0.99, alpha, beta_param)

        return {
            'prior': prior,
            'posterior': adjusted_posterior,
            'ci_90': ci_90,
            'ci_95': ci_95,
            'ci_99': ci_99,
        }

    def monte_carlo_damages(self, n_simulations: int = 10000) -> Dict:
        """
        Monte Carlo simulation for damages range

        Samples from probability distributions for each damage component
        """
        results = {
            'economic': [],
            'emotional': [],
            'punitive': [],
            'liquidated': [],
            'total': [],
        }

        for _ in range(n_simulations):
            # Economic damages (log-normal distribution)
            econ_mean = self.damages['economic_mid']
            econ_std = (self.damages['economic_high'] - self.damages['economic_low']) / 4
            economic = np.random.lognormal(np.log(econ_mean), econ_std / econ_mean)
            economic = np.clip(economic, self.damages['economic_low'], self.damages['economic_high'])

            # Emotional distress (gamma distribution - right-skewed)
            emot_mean = self.damages['emotional_mid']
            emot_std = (self.damages['emotional_high'] - self.damages['emotional_low']) / 4
            k = (emot_mean / emot_std) ** 2
            theta = emot_std ** 2 / emot_mean
            emotional = np.random.gamma(k, theta)
            emotional = np.clip(emotional, self.damages['emotional_low'], self.damages['emotional_high'])

            # Punitive damages (conditional on finding of malice)
            # 70% chance of punitive award given strong spoliation evidence
            if np.random.random() < 0.70:
                # Capped at statutory maximum
                punitive_pre_cap = np.random.uniform(
                    self.damages['punitive_mid'],
                    self.damages['punitive_high']
                )
                punitive = min(punitive_pre_cap, self.damages['punitive_low'])  # Apply cap
            else:
                punitive = 0

            # Liquidated damages (FMLA - 80% chance of willfulness finding)
            liquidated = self.damages['liquidated_damages'] if np.random.random() < 0.80 else 0

            # Total
            total = economic + emotional + punitive + liquidated

            results['economic'].append(economic)
            results['emotional'].append(emotional)
            results['punitive'].append(punitive)
            results['liquidated'].append(liquidated)
            results['total'].append(total)

        # Calculate statistics
        summary = {
            'mean': np.mean(results['total']),
            'median': np.median(results['total']),
            'std': np.std(results['total']),
            'min': np.min(results['total']),
            'max': np.max(results['total']),
            'ci_90': np.percentile(results['total'], [5, 95]),
            'ci_95': np.percentile(results['total'], [2.5, 97.5]),
            'ci_99': np.percentile(results['total'], [0.5, 99.5]),
            'percentiles': {
                '10th': np.percentile(results['total'], 10),
                '25th': np.percentile(results['total'], 25),
                '50th': np.percentile(results['total'], 50),
                '75th': np.percentile(results['total'], 75),
                '90th': np.percentile(results['total'], 90),
            }
        }

        return {
            'simulations': results,
            'summary': summary,
        }

    def trial_verdict_probability(self) -> Dict[str, float]:
        """
        Probability of plaintiff verdict if case goes to trial

        Uses ensemble method combining multiple factors
        """
        # Base rate (7th Circuit)
        base_rate = self.circuit_7_data['trial_verdict_plaintiff']

        # Factor 1: Evidence strength (weighted average)
        evidence_score = np.mean(list(self.evidence_strength.values()))

        # Factor 2: Claim strength (best claim drives verdict)
        claim_scores = [c['strength'] for c in self.claims.values()]
        best_claim_strength = max(claim_scores)

        # Factor 3: Multiple claims advantage (jury can find on any one)
        multiple_claims_bonus = min(0.15, len(self.claims) * 0.025)

        # Factor 4: Medical evidence (objective harm)
        medical_factor = self.evidence_strength['medical_escalation'] * 0.10

        # Factor 5: Spoliation evidence (adverse inference)
        spoliation_factor = self.evidence_strength['sedgwick_fraud'] * 0.08

        # Ensemble prediction (weighted combination)
        weights = [0.25, 0.30, 0.15, 0.15, 0.15]
        factors = [base_rate, evidence_score, best_claim_strength, medical_factor, spoliation_factor]

        ensemble_score = sum(w * f for w, f in zip(weights, factors)) + multiple_claims_bonus

        # Adjust for pro se bias
        adjusted_score = ensemble_score * self.pro_se_bias

        # Clip to reasonable range
        adjusted_score = np.clip(adjusted_score, 0.20, 0.75)

        # Calculate confidence intervals
        n_samples = 100  # Hypothetical similar cases
        alpha = adjusted_score * n_samples
        beta_param = (1 - adjusted_score) * n_samples

        ci_90 = beta.interval(0.90, alpha, beta_param)
        ci_95 = beta.interval(0.95, alpha, beta_param)
        ci_99 = beta.interval(0.99, alpha, beta_param)

        return {
            'base_rate': base_rate,
            'adjusted_probability': adjusted_score,
            'ci_90': ci_90,
            'ci_95': ci_95,
            'ci_99': ci_99,
            'factors': {
                'evidence_strength': evidence_score,
                'best_claim': best_claim_strength,
                'multiple_claims_bonus': multiple_claims_bonus,
                'medical_evidence': medical_factor,
                'spoliation': spoliation_factor,
            }
        }

    def settlement_probability(self, offer_amount: float) -> float:
        """
        Probability of settlement at given offer amount

        Uses logistic function based on expected value
        """
        # Calculate expected value at trial
        trial_prob = self.trial_verdict_probability()['adjusted_probability']
        damages_expected = self.monte_carlo_damages(n_simulations=1000)['summary']['median']
        expected_value = trial_prob * damages_expected

        # Risk discount factor (50% discount for risk and time)
        risk_adjusted_ev = expected_value * 0.50

        # Logistic function: P(settle) = 1 / (1 + exp(-k * (offer - threshold)))
        k = 0.000003  # Steepness parameter
        threshold = risk_adjusted_ev * 0.60  # Will settle at 60% of risk-adjusted EV

        prob = 1 / (1 + np.exp(-k * (offer_amount - threshold)))

        return prob

    def timeline_to_resolution(self) -> Dict:
        """
        Predict months to resolution with probability distribution

        Accounts for:
        - Summary judgment motions
        - Discovery duration
        - Trial scheduling
        - Settlement negotiations
        """
        # Scenario probabilities
        scenarios = {
            'settlement_pre_sj': {'prob': 0.30, 'months': (6, 12)},    # Settle before SJ
            'settlement_post_sj': {'prob': 0.45, 'months': (15, 24)},  # Settle after SJ
            'trial': {'prob': 0.20, 'months': (24, 36)},               # Go to trial
            'appeal': {'prob': 0.05, 'months': (36, 48)},              # Appeal
        }

        # Monte Carlo simulation
        n_sims = 10000
        resolutions = []

        for _ in range(n_sims):
            rand = np.random.random()
            cumulative_prob = 0

            for scenario, params in scenarios.items():
                cumulative_prob += params['prob']
                if rand < cumulative_prob:
                    # Sample from uniform distribution within range
                    months = np.random.uniform(params['months'][0], params['months'][1])
                    resolutions.append(months)
                    break

        # Calculate statistics
        return {
            'mean_months': np.mean(resolutions),
            'median_months': np.median(resolutions),
            'mode_months': stats.mode(np.round(resolutions))[0],
            'std_months': np.std(resolutions),
            'ci_90': np.percentile(resolutions, [5, 95]),
            'ci_95': np.percentile(resolutions, [2.5, 97.5]),
            'ci_99': np.percentile(resolutions, [0.5, 99.5]),
            'scenario_probabilities': {k: v['prob'] for k, v in scenarios.items()},
        }

    def decision_tree_analysis(self) -> Dict:
        """
        Decision tree analysis for strategic paths

        Calculates expected value for each decision path:
        - Settle now
        - Fight through SJ
        - Go to trial
        """
        # Get probabilities
        sj_survival = np.mean([
            self.bayesian_claim_survival(claim)['posterior']
            for claim in self.claims.keys()
        ])
        trial_win = self.trial_verdict_probability()['adjusted_probability']
        damages = self.monte_carlo_damages(n_simulations=5000)['summary']

        # Path 1: Settle now (pre-SJ)
        settle_now_offer = damages['median'] * 0.30  # Typical early settlement: 30% of expected
        settle_now_ev = settle_now_offer  # Guaranteed

        # Path 2: Fight through SJ, then settle
        settle_post_sj_offer = damages['median'] * 0.50  # Post-SJ settlement: 50% of expected
        settle_post_sj_ev = sj_survival * settle_post_sj_offer

        # Path 3: Go to trial
        trial_ev = sj_survival * trial_win * damages['median']

        # Adjust for costs and time
        litigation_costs = 50000  # Attorney fees, expert witnesses, etc.
        time_discount = 0.95  # Present value discount for time

        settle_now_ev_adjusted = settle_now_ev
        settle_post_sj_ev_adjusted = (settle_post_sj_ev - litigation_costs * 0.5) * time_discount
        trial_ev_adjusted = (trial_ev - litigation_costs) * (time_discount ** 2)

        return {
            'paths': {
                'settle_now': {
                    'expected_value': settle_now_ev_adjusted,
                    'offer': settle_now_offer,
                    'probability': 1.0,
                    'timeline_months': 9,
                    'risk': 'LOW',
                },
                'settle_post_sj': {
                    'expected_value': settle_post_sj_ev_adjusted,
                    'offer': settle_post_sj_offer,
                    'probability': sj_survival,
                    'timeline_months': 18,
                    'risk': 'MEDIUM',
                },
                'go_to_trial': {
                    'expected_value': trial_ev_adjusted,
                    'potential_award': damages['median'],
                    'probability': sj_survival * trial_win,
                    'timeline_months': 30,
                    'risk': 'HIGH',
                },
            },
            'recommendation': self._get_recommendation(
                settle_now_ev_adjusted,
                settle_post_sj_ev_adjusted,
                trial_ev_adjusted
            ),
        }

    def _get_recommendation(self, settle_now: float, settle_post_sj: float, trial: float) -> str:
        """Determine strategic recommendation based on expected values"""
        max_ev = max(settle_now, settle_post_sj, trial)

        if max_ev == trial and trial > settle_post_sj * 1.5:
            return "GO TO TRIAL (significantly higher EV)"
        elif max_ev == settle_post_sj:
            return "FIGHT THROUGH SJ THEN SETTLE (optimal risk-adjusted EV)"
        elif max_ev == settle_now:
            return "SETTLE NOW (minimize risk and time)"
        else:
            return "FIGHT THROUGH SJ (balanced approach)"

    def comprehensive_analysis(self) -> Dict:
        """
        Run complete predictive analysis
        """
        print("Running comprehensive case outcome analysis...")
        print("=" * 80)

        # 1. Summary Judgment Survival
        print("\n1. Calculating summary judgment survival probabilities...")
        sj_results = {}
        for claim in self.claims.keys():
            sj_results[claim] = self.bayesian_claim_survival(claim)

        # 2. Trial Verdict
        print("2. Calculating trial verdict probability...")
        trial_verdict = self.trial_verdict_probability()

        # 3. Damages Range
        print("3. Running Monte Carlo simulation for damages (10,000 iterations)...")
        damages_mc = self.monte_carlo_damages(n_simulations=10000)

        # 4. Settlement Curve
        print("4. Calculating settlement probability curve...")
        settlement_offers = np.linspace(100000, 3000000, 50)
        settlement_probs = [self.settlement_probability(offer) for offer in settlement_offers]

        # 5. Timeline
        print("5. Predicting timeline to resolution...")
        timeline = self.timeline_to_resolution()

        # 6. Decision Tree
        print("6. Building decision tree analysis...")
        decision_tree = self.decision_tree_analysis()

        print("\nAnalysis complete!")
        print("=" * 80)

        return {
            'summary_judgment': sj_results,
            'trial_verdict': trial_verdict,
            'damages': damages_mc,
            'settlement': {
                'offers': settlement_offers.tolist(),
                'probabilities': settlement_probs,
            },
            'timeline': timeline,
            'decision_tree': decision_tree,
        }


def generate_visualizations(results: Dict, output_dir: str = '.'):
    """
    Generate visualizations for the analysis
    """
    import os
    os.makedirs(output_dir, exist_ok=True)

    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.figsize'] = (12, 8)

    # 1. Summary Judgment Survival Probabilities
    fig, ax = plt.subplots(figsize=(14, 8))
    claims = list(results['summary_judgment'].keys())
    posteriors = [results['summary_judgment'][c]['posterior'] for c in claims]
    priors = [results['summary_judgment'][c]['prior'] for c in claims]

    x = np.arange(len(claims))
    width = 0.35

    ax.bar(x - width/2, priors, width, label='Prior (7th Circuit Base Rate)', alpha=0.7)
    ax.bar(x + width/2, posteriors, width, label='Posterior (Updated with Evidence)', alpha=0.7)

    ax.set_ylabel('Probability of Survival', fontsize=12)
    ax.set_title('Summary Judgment Survival Probability by Claim', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels([c.replace('_', ' ').title() for c in claims], rotation=45, ha='right')
    ax.legend()
    ax.set_ylim([0, 1])
    ax.axhline(y=0.5, color='r', linestyle='--', alpha=0.3, label='50% Threshold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/summary_judgment_survival.png', dpi=300)
    plt.close()

    # 2. Damages Distribution
    fig, ax = plt.subplots(figsize=(14, 8))
    damages_total = results['damages']['simulations']['total']

    ax.hist(damages_total, bins=100, alpha=0.7, color='steelblue', edgecolor='black')
    ax.axvline(results['damages']['summary']['median'], color='red', linestyle='--',
               linewidth=2, label=f"Median: ${results['damages']['summary']['median']:,.0f}")
    ax.axvline(results['damages']['summary']['mean'], color='green', linestyle='--',
               linewidth=2, label=f"Mean: ${results['damages']['summary']['mean']:,.0f}")

    # Add confidence intervals
    ci_95 = results['damages']['summary']['ci_95']
    ax.axvspan(ci_95[0], ci_95[1], alpha=0.2, color='yellow', label='95% CI')

    ax.set_xlabel('Total Damages ($)', fontsize=12)
    ax.set_ylabel('Frequency', fontsize=12)
    ax.set_title('Damages Distribution (10,000 Monte Carlo Simulations)', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.ticklabel_format(style='plain', axis='x')

    # Format x-axis as currency
    import matplotlib.ticker as mticker
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))

    plt.tight_layout()
    plt.savefig(f'{output_dir}/damages_distribution.png', dpi=300)
    plt.close()

    # 3. Settlement Probability Curve
    fig, ax = plt.subplots(figsize=(14, 8))
    offers = np.array(results['settlement']['offers'])
    probs = results['settlement']['probabilities']

    ax.plot(offers, probs, linewidth=3, color='steelblue')
    ax.fill_between(offers, probs, alpha=0.3)

    # Mark key points
    median_offer_idx = np.argmin(np.abs(np.array(probs) - 0.5))
    median_offer = offers[median_offer_idx]
    ax.axvline(median_offer, color='red', linestyle='--', linewidth=2,
               label=f'50% Settlement Probability: ${median_offer:,.0f}')
    ax.axhline(0.5, color='red', linestyle='--', alpha=0.3)

    ax.set_xlabel('Settlement Offer ($)', fontsize=12)
    ax.set_ylabel('Probability of Acceptance', fontsize=12)
    ax.set_title('Settlement Probability by Offer Amount', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))

    plt.tight_layout()
    plt.savefig(f'{output_dir}/settlement_curve.png', dpi=300)
    plt.close()

    # 4. Timeline Distribution
    fig, ax = plt.subplots(figsize=(14, 8))

    timeline_data = results['timeline']
    scenarios = list(timeline_data['scenario_probabilities'].keys())
    probs = list(timeline_data['scenario_probabilities'].values())

    colors = ['green', 'yellow', 'orange', 'red']
    ax.bar(scenarios, probs, color=colors, alpha=0.7, edgecolor='black')

    ax.set_ylabel('Probability', fontsize=12)
    ax.set_title('Resolution Scenario Probabilities', fontsize=14, fontweight='bold')
    ax.set_xticklabels([s.replace('_', ' ').title() for s in scenarios], rotation=45, ha='right')

    # Add value labels on bars
    for i, (scenario, prob) in enumerate(zip(scenarios, probs)):
        ax.text(i, prob + 0.02, f'{prob:.0%}', ha='center', fontsize=11, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'{output_dir}/timeline_scenarios.png', dpi=300)
    plt.close()

    # 5. Decision Tree Expected Values
    fig, ax = plt.subplots(figsize=(14, 8))

    paths = results['decision_tree']['paths']
    path_names = list(paths.keys())
    evs = [paths[p]['expected_value'] for p in path_names]
    risks = [paths[p]['risk'] for p in path_names]

    colors_map = {'LOW': 'green', 'MEDIUM': 'yellow', 'HIGH': 'red'}
    colors = [colors_map[risk] for risk in risks]

    bars = ax.barh(path_names, evs, color=colors, alpha=0.7, edgecolor='black')

    ax.set_xlabel('Expected Value ($)', fontsize=12)
    ax.set_title('Decision Tree: Expected Value by Strategic Path', fontsize=14, fontweight='bold')
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))

    # Add value labels
    for i, (path, ev) in enumerate(zip(path_names, evs)):
        ax.text(ev + 50000, i, f'${ev:,.0f}', va='center', fontsize=10, fontweight='bold')

    ax.set_yticklabels([p.replace('_', ' ').title() for p in path_names])

    plt.tight_layout()
    plt.savefig(f'{output_dir}/decision_tree_ev.png', dpi=300)
    plt.close()

    print(f"\nVisualizations saved to {output_dir}/")


def main():
    """Main execution function"""
    print("=" * 80)
    print("PREDICTIVE CASE OUTCOME MODEL")
    print("Castillo v. Charles Schwab Corporation & Sedgwick Claims Management")
    print("=" * 80)

    # Initialize predictor
    predictor = CastilloCasePredictor()

    # Run comprehensive analysis
    results = predictor.comprehensive_analysis()

    # Generate visualizations
    print("\nGenerating visualizations...")
    generate_visualizations(results, output_dir='.')

    # Save results to file
    import json
    with open('case_prediction_results.json', 'w') as f:
        # Convert numpy types to Python types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.integer, np.int64)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float64)):
                return float(obj)
            elif isinstance(obj, dict):
                return {key: convert_types(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_types(item) for item in obj]
            elif isinstance(obj, tuple):
                return tuple(convert_types(item) for item in obj)
            return obj

        results_serializable = convert_types(results)
        json.dump(results_serializable, f, indent=2)

    print("\nResults saved to case_prediction_results.json")
    print("=" * 80)

    return results


if __name__ == '__main__':
    main()
