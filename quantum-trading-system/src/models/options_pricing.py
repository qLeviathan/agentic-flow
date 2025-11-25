"""
Options Pricing Engine - Agent 11 (Zeckendorf: 10100)
========================================================

Implements three options pricing methods using integer-only arithmetic:
1. Black-Scholes Model (integer approximation with lookup tables)
2. QFNN-based Quantum Pricing (neural network trained on option prices)
3. Xi/Psi Phase Space Pricing (quantum phase dynamics)

All calculations use integer arithmetic scaled by 10000.

Dependencies: Agents 9 (QFNN), 10 (Xi/Psi)
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import json
from pathlib import Path

# Import dependencies
from models.qfnn import QFNN
from models.xi_psi import XiPsiModel, PhaseState


# Constants
SCALE = 10000  # Scaling factor for integer arithmetic
SQRT_SCALE = 100  # Scaling for square root operations


class OptionType(Enum):
    """Option types"""
    CALL = 1
    PUT = 2


@dataclass
class OptionContract:
    """Options contract specification"""
    option_type: OptionType
    strike: int  # Strike price (scaled)
    expiry: int  # Days to expiry
    spot: int    # Current spot price (scaled)
    volatility: int  # Implied volatility (scaled, e.g., 2000 = 20%)
    rate: int    # Risk-free rate (scaled, e.g., 500 = 5%)


@dataclass
class OptionPrice:
    """Option price with Greeks"""
    premium: int       # Option premium (scaled)
    delta: int         # Delta (scaled)
    gamma: int         # Gamma (scaled)
    theta: int         # Theta (scaled)
    vega: int          # Vega (scaled)
    method: str        # Pricing method used


class BlackScholesInteger:
    """
    Black-Scholes pricing engine using integer-only arithmetic.

    Uses lookup tables for ln, exp, sqrt, and normal CDF.
    All operations maintain integer precision throughout.
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale
        self._build_lookup_tables()

    def _build_lookup_tables(self):
        """Build lookup tables for transcendental functions."""
        # Natural log lookup table: ln(x) for x in [0.01, 10.0]
        # Scaled by SCALE
        self.ln_table = {}
        for i in range(10, 10000, 10):  # 0.01 to 10.0
            x = i / 1000.0
            ln_val = int(np.log(x) * self.scale)
            self.ln_table[i] = ln_val

        # Exponential lookup table: exp(x) for x in [-5.0, 5.0]
        self.exp_table = {}
        for i in range(-5000, 5000, 10):  # -5.0 to 5.0
            x = i / 1000.0
            exp_val = int(np.exp(x) * self.scale)
            self.exp_table[i] = exp_val

        # Square root lookup table: sqrt(x) for x in [0, 100]
        self.sqrt_table = {}
        for i in range(0, 100000, 10):
            x = i / 1000.0
            sqrt_val = int(np.sqrt(x) * SQRT_SCALE)
            self.sqrt_table[i] = sqrt_val

        # Normal CDF lookup table: N(x) for x in [-5.0, 5.0]
        self.norm_cdf_table = {}
        for i in range(-5000, 5000, 10):
            x = i / 1000.0
            # Approximate normal CDF using error function
            cdf_val = int((1.0 + self._erf(x / np.sqrt(2.0))) * self.scale / 2.0)
            self.norm_cdf_table[i] = cdf_val

    def _erf(self, x: float) -> float:
        """Error function approximation for normal CDF."""
        # Abramowitz and Stegun approximation
        a1 =  0.254829592
        a2 = -0.284496736
        a3 =  1.421413741
        a4 = -1.453152027
        a5 =  1.061405429
        p  =  0.3275911

        sign = 1 if x >= 0 else -1
        x = abs(x)

        t = 1.0 / (1.0 + p * x)
        y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * np.exp(-x * x)

        return sign * y

    def _ln_approx(self, x: int) -> int:
        """Integer approximation of natural logarithm."""
        if x <= 0:
            return -100 * self.scale  # Large negative value

        # Find closest entry in lookup table
        key = (x // 10) * 10
        if key in self.ln_table:
            return self.ln_table[key]

        # Linear interpolation for values between table entries
        if key < 10:
            key = 10
        elif key > 9990:
            # Extrapolate for large values: ln(x) ≈ ln(10) + (x-10)/10
            ln_10 = self.ln_table[10000]
            return ln_10 + (x - 10000) // 10

        return self.ln_table.get(key, 0)

    def _exp_approx(self, x: int) -> int:
        """Integer approximation of exponential."""
        # Scale x from SCALE to table scale
        x_scaled = x // 10  # Convert to table scale (-5000 to 5000)

        # Clamp to table range
        x_scaled = max(-5000, min(5000, x_scaled))

        # Round to nearest table entry
        key = (x_scaled // 10) * 10

        return self.exp_table.get(key, self.scale)

    def _sqrt_approx(self, x: int) -> int:
        """Integer approximation of square root (returns scaled result)."""
        if x <= 0:
            return 0

        # Newton's method for integer square root
        # Input x is already scaled by SCALE
        # Start with reasonable guess
        if x < 100:
            return int(np.sqrt(x))

        guess = x // 2

        for _ in range(15):  # More iterations for better convergence
            if guess == 0:
                break
            new_guess = (guess + x // guess) // 2
            if abs(new_guess - guess) < 2:
                break
            guess = new_guess

        return guess

    def _norm_cdf_approx(self, x: int) -> int:
        """Integer approximation of normal CDF."""
        # Scale x to table range
        x_scaled = x // 10  # Convert to table scale

        # Clamp to table range
        x_scaled = max(-5000, min(5000, x_scaled))

        # Round to nearest table entry
        key = (x_scaled // 10) * 10

        return self.norm_cdf_table.get(key, self.scale // 2)

    def price_option(self, contract: OptionContract) -> OptionPrice:
        """
        Price option using Black-Scholes formula (integer arithmetic).

        Black-Scholes Formula:
        Call: C = S*N(d1) - K*e^(-rT)*N(d2)
        Put:  P = K*e^(-rT)*N(-d2) - S*N(-d1)

        where:
        d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        d2 = d1 - σ√T

        Args:
            contract: Option contract specification

        Returns:
            OptionPrice with premium and Greeks
        """
        S = contract.spot
        K = contract.strike
        T = contract.expiry  # Days
        sigma = contract.volatility  # Scaled
        r = contract.rate  # Scaled

        # Convert days to years (scaled): T_years = T / 365
        T_years = (T * self.scale) // 365

        # Calculate σ√T (scaled)
        sigma_sqrt_T = (sigma * self._sqrt_approx(T_years)) // SQRT_SCALE

        if sigma_sqrt_T == 0:
            # Option at expiry
            if contract.option_type == OptionType.CALL:
                return OptionPrice(
                    premium=max(0, S - K),
                    delta=self.scale if S > K else 0,
                    gamma=0,
                    theta=0,
                    vega=0,
                    method="black_scholes_integer"
                )
            else:
                return OptionPrice(
                    premium=max(0, K - S),
                    delta=-self.scale if K > S else 0,
                    gamma=0,
                    theta=0,
                    vega=0,
                    method="black_scholes_integer"
                )

        # Calculate ln(S/K)
        if K == 0:
            ln_S_K = 100 * self.scale  # Large value
        else:
            ratio = (S * 1000) // K  # Scale ratio for ln lookup
            ln_S_K = self._ln_approx(ratio)

        # Calculate d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        sigma_sq = (sigma * sigma) // self.scale
        sigma_sq_half = sigma_sq // 2

        numerator = ln_S_K + ((r + sigma_sq_half) * T_years) // self.scale
        d1 = (numerator * self.scale) // sigma_sqrt_T

        # Calculate d2 = d1 - σ√T
        d2 = d1 - sigma_sqrt_T

        # Calculate N(d1) and N(d2)
        N_d1 = self._norm_cdf_approx(d1)
        N_d2 = self._norm_cdf_approx(d2)

        # Calculate discount factor: e^(-rT)
        discount_exp = -(r * T_years) // self.scale
        discount = self._exp_approx(discount_exp)

        # Calculate option premium
        if contract.option_type == OptionType.CALL:
            # Call: C = S*N(d1) - K*e^(-rT)*N(d2)
            term1 = (S * N_d1) // self.scale
            term2 = (K * discount * N_d2) // (self.scale * self.scale)
            premium = max(0, term1 - term2)

            # Greeks for call
            delta = N_d1
            gamma = self._calculate_gamma(S, sigma, T_years, d1)
            theta = self._calculate_theta_call(S, K, r, sigma, T_years, d1, d2, discount)
            vega = self._calculate_vega(S, T_years, d1)
        else:
            # Put: P = K*e^(-rT)*N(-d2) - S*N(-d1)
            N_minus_d1 = self.scale - N_d1
            N_minus_d2 = self.scale - N_d2
            term1 = (K * discount * N_minus_d2) // (self.scale * self.scale)
            term2 = (S * N_minus_d1) // self.scale
            premium = max(0, term1 - term2)

            # Greeks for put
            delta = N_d1 - self.scale  # Delta_put = Delta_call - 1
            gamma = self._calculate_gamma(S, sigma, T_years, d1)
            theta = self._calculate_theta_put(S, K, r, sigma, T_years, d1, d2, discount)
            vega = self._calculate_vega(S, T_years, d1)

        return OptionPrice(
            premium=premium,
            delta=delta,
            gamma=gamma,
            theta=theta,
            vega=vega,
            method="black_scholes_integer"
        )

    def _calculate_gamma(self, S: int, sigma: int, T: int, d1: int) -> int:
        """Calculate gamma (integer approximation)."""
        if S == 0 or sigma == 0 or T == 0:
            return 0

        # Gamma = n(d1) / (S * σ * √T)
        # n(x) = exp(-x²/2) / √(2π) ≈ approximated

        # Simplified gamma approximation
        sigma_sqrt_T = (sigma * self._sqrt_approx(T)) // SQRT_SCALE
        if sigma_sqrt_T == 0:
            return 0

        gamma = (self.scale * self.scale) // (S * sigma_sqrt_T)
        return gamma // 100  # Scale down

    def _calculate_theta_call(self, S: int, K: int, r: int, sigma: int,
                               T: int, d1: int, d2: int, discount: int) -> int:
        """Calculate theta for call option."""
        # Simplified theta (negative time decay)
        # θ ≈ -S*σ/(2√T) - rKe^(-rT)N(d2)

        if T == 0:
            return 0

        sqrt_T = self._sqrt_approx(T)
        if sqrt_T == 0:
            return 0

        term1 = (S * sigma) // (2 * sqrt_T)
        N_d2 = self._norm_cdf_approx(d2)
        term2 = (r * K * discount * N_d2) // (self.scale * self.scale)

        theta = -(term1 + term2)
        return theta // 365  # Per day

    def _calculate_theta_put(self, S: int, K: int, r: int, sigma: int,
                              T: int, d1: int, d2: int, discount: int) -> int:
        """Calculate theta for put option."""
        # Similar to call but with different sign for rate term
        if T == 0:
            return 0

        sqrt_T = self._sqrt_approx(T)
        if sqrt_T == 0:
            return 0

        term1 = (S * sigma) // (2 * sqrt_T)
        N_minus_d2 = self.scale - self._norm_cdf_approx(d2)
        term2 = (r * K * discount * N_minus_d2) // (self.scale * self.scale)

        theta = -(term1 - term2)
        return theta // 365  # Per day

    def _calculate_vega(self, S: int, T: int, d1: int) -> int:
        """Calculate vega (sensitivity to volatility)."""
        # Vega = S * √T * n(d1)
        if T == 0:
            return 0

        sqrt_T = self._sqrt_approx(T)
        # Simplified: vega ≈ S * √T / 100
        vega = (S * sqrt_T) // (100 * SQRT_SCALE)
        return vega


class QFNNOptionPricing:
    """
    QFNN-based options pricing using quantum neural networks.

    Trains QFNN on historical option prices and uses it to predict
    option values based on Fibonacci-encoded features.
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale
        self.qfnn = None
        self.is_trained = False

    def train(self, training_data: List[Tuple[OptionContract, int]],
              epochs: int = 100, learning_rate: int = 100):
        """
        Train QFNN on historical option prices.

        Args:
            training_data: List of (contract, actual_premium) pairs
            epochs: Training epochs
            learning_rate: Learning rate (scaled)
        """
        # Extract features and targets
        X_train = []
        y_train = []

        for contract, actual_premium in training_data:
            # Encode features (spot, strike, expiry, volatility, rate)
            features = np.array([
                contract.spot,
                contract.strike,
                contract.expiry * 100,  # Scale days
                contract.volatility,
                contract.rate,
                1 if contract.option_type == OptionType.CALL else -1,
                contract.spot - contract.strike,  # Moneyness
                (contract.spot * self.scale) // max(1, contract.strike),  # Ratio
            ], dtype=np.int64)

            X_train.append(features)

            # Target: option premium
            target = np.array([actual_premium], dtype=np.int64)
            y_train.append(target)

        # Create QFNN model
        self.qfnn = QFNN(
            input_dim=8,
            hidden_dim=16,
            output_dim=1,
            num_heads=4,
            scale=self.scale
        )

        # Train model
        print("🧠 Training QFNN for options pricing...")
        self.qfnn.train(X_train, y_train, epochs=epochs,
                       learning_rate=learning_rate, verbose=True)

        self.is_trained = True
        print("✅ QFNN training complete")

    def price_option(self, contract: OptionContract) -> OptionPrice:
        """
        Price option using trained QFNN.

        Args:
            contract: Option contract specification

        Returns:
            OptionPrice with QFNN-predicted premium
        """
        if not self.is_trained:
            raise ValueError("QFNN not trained. Call train() first.")

        # Encode features
        features = np.array([
            contract.spot,
            contract.strike,
            contract.expiry * 100,
            contract.volatility,
            contract.rate,
            self.scale if contract.option_type == OptionType.CALL else -self.scale,
            contract.spot - contract.strike,
            (contract.spot * self.scale) // max(1, contract.strike),
        ], dtype=np.int64)

        # Predict premium
        prediction = self.qfnn.predict(features)
        premium = max(0, int(prediction[0]))

        # Approximate Greeks using finite differences
        delta = self._approximate_delta(contract)

        return OptionPrice(
            premium=premium,
            delta=delta,
            gamma=0,  # Not computed for QFNN
            theta=0,  # Not computed for QFNN
            vega=0,   # Not computed for QFNN
            method="qfnn_quantum"
        )

    def _approximate_delta(self, contract: OptionContract) -> int:
        """Approximate delta using simplified heuristic."""
        # Simplified delta calculation to avoid recursion
        moneyness = (contract.spot * self.scale) // max(1, contract.strike)

        if contract.option_type == OptionType.CALL:
            if moneyness > (110 * self.scale) // 100:  # Deep ITM
                return (90 * self.scale) // 100
            elif moneyness > (105 * self.scale) // 100:  # ITM
                return (70 * self.scale) // 100
            elif moneyness > (95 * self.scale) // 100:  # ATM
                return (50 * self.scale) // 100
            elif moneyness > (90 * self.scale) // 100:  # OTM
                return (30 * self.scale) // 100
            else:  # Deep OTM
                return (10 * self.scale) // 100
        else:  # PUT
            if moneyness < (90 * self.scale) // 100:  # Deep ITM
                return -(90 * self.scale) // 100
            elif moneyness < (95 * self.scale) // 100:  # ITM
                return -(70 * self.scale) // 100
            elif moneyness < (105 * self.scale) // 100:  # ATM
                return -(50 * self.scale) // 100
            elif moneyness < (110 * self.scale) // 100:  # OTM
                return -(30 * self.scale) // 100
            else:  # Deep OTM
                return -(10 * self.scale) // 100


class XiPsiOptionPricing:
    """
    Xi/Psi phase space options pricing.

    Uses quantum phase dynamics and coherence to price options
    based on market state and momentum.
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale
        self.xi_psi_model = XiPsiModel(scale=scale)

    def price_option(self, contract: OptionContract,
                     price_history: List[int]) -> OptionPrice:
        """
        Price option using Xi/Psi phase space dynamics.

        Args:
            contract: Option contract specification
            price_history: Historical spot prices for phase analysis

        Returns:
            OptionPrice based on phase space dynamics
        """
        # Evolve phase space
        portrait = self.xi_psi_model.evolve_phase_space(
            price_history,
            num_steps=min(len(price_history), 20)
        )

        # Get current phase point
        current_phase = portrait.points[-1] if portrait.points else None

        if not current_phase:
            # Fallback: intrinsic value
            if contract.option_type == OptionType.CALL:
                premium = max(0, contract.spot - contract.strike)
            else:
                premium = max(0, contract.strike - contract.spot)

            return OptionPrice(
                premium=premium,
                delta=0,
                gamma=0,
                theta=0,
                vega=0,
                method="xi_psi_phase"
            )

        # Base premium on intrinsic value
        intrinsic = 0
        if contract.option_type == OptionType.CALL:
            intrinsic = max(0, contract.spot - contract.strike)
        else:
            intrinsic = max(0, contract.strike - contract.spot)

        # Calculate time value based on coherence and phase state
        coherence_factor = current_phase.coherence  # 0-10000
        momentum_factor = abs(current_phase.psi)

        # Time value increases with:
        # 1. High coherence (quantum regime)
        # 2. High momentum (volatility proxy)
        # 3. Time to expiry

        time_value = (
            (coherence_factor * contract.expiry) // 3650 +  # Coherence contribution
            (momentum_factor * contract.expiry) // 36500    # Momentum contribution
        )

        # Adjust based on phase state
        if current_phase.state == PhaseState.BULLISH:
            if contract.option_type == OptionType.CALL:
                time_value = (time_value * 120) // 100  # +20% for calls in uptrend
            else:
                time_value = (time_value * 80) // 100   # -20% for puts in uptrend
        elif current_phase.state == PhaseState.BEARISH:
            if contract.option_type == OptionType.CALL:
                time_value = (time_value * 80) // 100   # -20% for calls in downtrend
            else:
                time_value = (time_value * 120) // 100  # +20% for puts in downtrend

        premium = intrinsic + time_value

        # Approximate delta based on moneyness and momentum
        if contract.option_type == OptionType.CALL:
            if contract.spot > contract.strike:
                delta = (8000 * coherence_factor) // self.scale  # ITM call
            else:
                delta = (2000 * coherence_factor) // self.scale  # OTM call
        else:
            if contract.spot < contract.strike:
                delta = -(8000 * coherence_factor) // self.scale  # ITM put
            else:
                delta = -(2000 * coherence_factor) // self.scale  # OTM put

        return OptionPrice(
            premium=premium,
            delta=delta,
            gamma=0,
            theta=0,
            vega=0,
            method="xi_psi_phase"
        )


class OptionsPricingEngine:
    """
    Unified options pricing engine with three methods:
    1. Black-Scholes (classical)
    2. QFNN (quantum neural network)
    3. Xi/Psi (phase space dynamics)
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale
        self.bs_engine = BlackScholesInteger(scale)
        self.qfnn_engine = QFNNOptionPricing(scale)
        self.xipsi_engine = XiPsiOptionPricing(scale)

    def price_all_methods(self, contract: OptionContract,
                          price_history: Optional[List[int]] = None) -> Dict[str, OptionPrice]:
        """
        Price option using all three methods.

        Args:
            contract: Option contract
            price_history: Historical prices (required for Xi/Psi)

        Returns:
            Dictionary mapping method name to OptionPrice
        """
        results = {}

        # Black-Scholes
        results['black_scholes'] = self.bs_engine.price_option(contract)

        # QFNN (if trained)
        if self.qfnn_engine.is_trained:
            results['qfnn'] = self.qfnn_engine.price_option(contract)

        # Xi/Psi (if price history provided)
        if price_history:
            results['xi_psi'] = self.xipsi_engine.price_option(contract, price_history)

        return results

    def compare_methods(self, contract: OptionContract,
                       price_history: Optional[List[int]] = None,
                       actual_premium: Optional[int] = None) -> Dict:
        """
        Compare all pricing methods and compute metrics.

        Args:
            contract: Option contract
            price_history: Historical prices
            actual_premium: Actual market premium for comparison

        Returns:
            Comparison report
        """
        prices = self.price_all_methods(contract, price_history)

        report = {
            'contract': {
                'type': 'CALL' if contract.option_type == OptionType.CALL else 'PUT',
                'strike': contract.strike,
                'spot': contract.spot,
                'expiry': contract.expiry,
                'volatility': contract.volatility,
                'rate': contract.rate,
            },
            'prices': {},
            'comparison': {}
        }

        for method, price in prices.items():
            report['prices'][method] = {
                'premium': price.premium,
                'delta': price.delta,
                'gamma': price.gamma,
                'theta': price.theta,
                'vega': price.vega,
            }

            if actual_premium is not None:
                error = abs(price.premium - actual_premium)
                error_pct = (error * 10000) // max(1, actual_premium)
                report['comparison'][method] = {
                    'error': error,
                    'error_pct': error_pct,
                    'accuracy': 10000 - min(10000, error_pct)
                }

        # Calculate inter-method agreement
        if len(prices) >= 2:
            premiums = [p.premium for p in prices.values()]
            avg_premium = sum(premiums) // len(premiums)
            max_deviation = max(abs(p - avg_premium) for p in premiums)
            agreement_score = max(0, 10000 - (max_deviation * 10000) // max(1, avg_premium))
            report['inter_method_agreement'] = agreement_score

        return report

    def train_qfnn(self, training_data: List[Tuple[OptionContract, int]],
                   epochs: int = 100, learning_rate: int = 100):
        """Train QFNN pricing engine."""
        self.qfnn_engine.train(training_data, epochs, learning_rate)

    def backtest(self, test_data: List[Tuple[OptionContract, int, Optional[List[int]]]]) -> Dict:
        """
        Backtest all pricing methods.

        Args:
            test_data: List of (contract, actual_premium, price_history) tuples

        Returns:
            Backtesting report with performance metrics
        """
        results = {
            'black_scholes': {'errors': [], 'total_error': 0},
            'qfnn': {'errors': [], 'total_error': 0},
            'xi_psi': {'errors': [], 'total_error': 0},
        }

        for contract, actual_premium, price_history in test_data:
            prices = self.price_all_methods(contract, price_history)

            for method, price in prices.items():
                error = abs(price.premium - actual_premium)
                results[method]['errors'].append(error)
                results[method]['total_error'] += error

        # Calculate summary statistics
        report = {}
        for method, data in results.items():
            if not data['errors']:
                continue

            errors = data['errors']
            report[method] = {
                'num_trades': len(errors),
                'mean_error': sum(errors) // len(errors),
                'max_error': max(errors),
                'min_error': min(errors),
                'total_error': data['total_error'],
                'rmse': self._calculate_rmse(errors),
            }

        return report

    def _calculate_rmse(self, errors: List[int]) -> int:
        """Calculate root mean squared error (integer)."""
        if not errors:
            return 0

        squared_errors = [e * e for e in errors]
        mse = sum(squared_errors) // len(squared_errors)

        # Integer square root
        rmse = int(np.sqrt(mse))
        return rmse


# Convenience functions
def create_call_option(spot: int, strike: int, expiry: int,
                       volatility: int, rate: int) -> OptionContract:
    """Create call option contract."""
    return OptionContract(OptionType.CALL, strike, expiry, spot, volatility, rate)


def create_put_option(spot: int, strike: int, expiry: int,
                      volatility: int, rate: int) -> OptionContract:
    """Create put option contract."""
    return OptionContract(OptionType.PUT, strike, expiry, spot, volatility, rate)
