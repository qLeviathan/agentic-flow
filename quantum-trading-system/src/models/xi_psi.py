"""
Xi/Psi Phase Space Dynamics Model
==================================

Implements quantum phase space representation for market dynamics using:
- Xi (ξ): Position operator - represents price levels
- Psi (ψ): Momentum operator - represents price velocity/trends
- Lucas time evolution (OEIS A000032)
- Integer-only arithmetic (scale: 10000)
- Quantum coherence tracking

Author: Agent 10 (Zeckendorf: 10010)
Dependencies: Agents 5 (Fibonacci), 6 (Lucas), 8 (Integer Validator)
"""

import numpy as np
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from enum import Enum


# Lucas sequence (OEIS A000032) for time evolution
LUCAS_SEQUENCE = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843]

# Scale factor for integer arithmetic
SCALE = 10000

# Phase space constants (scaled integers)
PLANCK_SCALED = 100  # ℏ scaled to integer
COHERENCE_THRESHOLD = 8000  # 0.80 scaled


class PhaseState(Enum):
    """Phase space states for market dynamics"""
    BULLISH = 1
    BEARISH = 2
    RANGING = 3
    TRANSITIONAL = 4


@dataclass
class PhasePoint:
    """Single point in phase space (xi, psi)"""
    xi: int  # Position (price level, scaled)
    psi: int  # Momentum (velocity, scaled)
    time: int  # Lucas-encoded time step
    coherence: int  # Quantum coherence (0-10000)
    state: PhaseState


@dataclass
class PhasePortrait:
    """Complete phase portrait data"""
    points: List[PhasePoint]
    trajectories: List[List[Tuple[int, int]]]
    attractors: List[Tuple[int, int]]
    coherence_map: np.ndarray
    lucas_times: List[int]


class XiOperator:
    """
    Position operator Xi (ξ) for price levels.

    In quantum mechanics: x̂ψ = xψ (position measurement)
    In trading: ξ represents price level in phase space
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale

    def apply(self, price: int) -> int:
        """
        Apply position operator to price.

        Args:
            price: Integer price (scaled by SCALE)

        Returns:
            Position eigenvalue (scaled integer)
        """
        return price

    def commutator_with_psi(self, psi_value: int) -> int:
        """
        Compute [ξ, ψ] commutator (scaled).

        In quantum mechanics: [x̂, p̂] = iℏ
        In trading context: measures uncertainty relation

        Args:
            psi_value: Momentum value (scaled)

        Returns:
            Commutator value (scaled integer)
        """
        # [ξ, ψ] ≈ iℏ → scaled to integer
        return PLANCK_SCALED

    def expectation(self, prices: List[int]) -> int:
        """
        Calculate expectation value <ξ>.

        Args:
            prices: List of price values (scaled)

        Returns:
            Mean position (scaled integer)
        """
        if not prices:
            return 0
        return sum(prices) // len(prices)

    def variance(self, prices: List[int]) -> int:
        """
        Calculate variance σ²(ξ).

        Args:
            prices: List of price values (scaled)

        Returns:
            Position variance (scaled integer)
        """
        if not prices:
            return 0

        mean = self.expectation(prices)
        squared_diffs = [(p - mean) ** 2 for p in prices]
        return sum(squared_diffs) // len(squared_diffs)


class PsiOperator:
    """
    Momentum operator Psi (ψ) for price velocity/trends.

    In quantum mechanics: p̂ψ = -iℏ(dψ/dx)
    In trading: ψ represents rate of price change
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale

    def apply(self, prices: List[int], lucas_dt: int) -> int:
        """
        Apply momentum operator to price series.

        Momentum = Δprice / Δtime (Lucas-encoded)

        Args:
            prices: Price series (scaled integers)
            lucas_dt: Lucas time interval

        Returns:
            Momentum value (scaled integer)
        """
        if len(prices) < 2 or lucas_dt == 0:
            return 0

        delta_price = prices[-1] - prices[-2]
        # Scale momentum: (Δprice * SCALE) / lucas_dt
        momentum = (delta_price * self.scale) // lucas_dt
        return momentum

    def expectation(self, price_series: List[int], lucas_times: List[int]) -> int:
        """
        Calculate expectation value <ψ>.

        Args:
            price_series: Price series (scaled)
            lucas_times: Lucas time intervals

        Returns:
            Mean momentum (scaled integer)
        """
        if len(price_series) < 2:
            return 0

        momenta = []
        for i in range(1, len(price_series)):
            lucas_dt = lucas_times[i] if i < len(lucas_times) else 1
            delta = price_series[i] - price_series[i-1]
            momentum = (delta * self.scale) // lucas_dt
            momenta.append(momentum)

        return sum(momenta) // len(momenta) if momenta else 0

    def variance(self, price_series: List[int], lucas_times: List[int]) -> int:
        """
        Calculate variance σ²(ψ).

        Args:
            price_series: Price series (scaled)
            lucas_times: Lucas time intervals

        Returns:
            Momentum variance (scaled integer)
        """
        mean_momentum = self.expectation(price_series, lucas_times)

        momenta = []
        for i in range(1, len(price_series)):
            lucas_dt = lucas_times[i] if i < len(lucas_times) else 1
            delta = price_series[i] - price_series[i-1]
            momentum = (delta * self.scale) // lucas_dt
            momenta.append(momentum)

        if not momenta:
            return 0

        squared_diffs = [(m - mean_momentum) ** 2 for m in momenta]
        return sum(squared_diffs) // len(squared_diffs)


class XiPsiModel:
    """
    Complete Xi/Psi phase space dynamics model.

    Combines position and momentum operators to create
    phase space representation of market dynamics with
    Lucas time evolution and quantum coherence tracking.
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale
        self.xi_op = XiOperator(scale)
        self.psi_op = PsiOperator(scale)
        self.lucas_sequence = LUCAS_SEQUENCE.copy()
        self.phase_history: List[PhasePoint] = []

    def get_lucas_time(self, index: int) -> int:
        """
        Get Lucas number for time step.

        Args:
            index: Time step index

        Returns:
            Lucas number L(index)
        """
        if index < len(self.lucas_sequence):
            return self.lucas_sequence[index]

        # Generate more Lucas numbers if needed
        while len(self.lucas_sequence) <= index:
            n = len(self.lucas_sequence)
            next_lucas = self.lucas_sequence[n-1] + self.lucas_sequence[n-2]
            self.lucas_sequence.append(next_lucas)

        return self.lucas_sequence[index]

    def compute_phase_point(
        self,
        price_series: List[int],
        time_index: int
    ) -> PhasePoint:
        """
        Compute phase space point (ξ, ψ) at given time.

        Args:
            price_series: Historical prices (scaled)
            time_index: Current time index

        Returns:
            PhasePoint with ξ, ψ, coherence, and state
        """
        lucas_time = self.get_lucas_time(time_index)

        # Position: current price level
        xi = price_series[-1] if price_series else 0

        # Momentum: velocity with Lucas time weighting
        psi = self.psi_op.apply(price_series, lucas_time)

        # Coherence: based on phase space stability
        coherence = self._compute_coherence(xi, psi, price_series)

        # Classify phase state
        state = self._classify_state(xi, psi, price_series)

        phase_point = PhasePoint(
            xi=xi,
            psi=psi,
            time=lucas_time,
            coherence=coherence,
            state=state
        )

        self.phase_history.append(phase_point)
        return phase_point

    def _compute_coherence(
        self,
        xi: int,
        psi: int,
        price_series: List[int]
    ) -> int:
        """
        Compute quantum coherence measure.

        Coherence = exp(-|Δξ|²/σ²) scaled to [0, 10000]
        Measures how "quantum" vs "classical" the dynamics are.

        Args:
            xi: Current position
            psi: Current momentum
            price_series: Price history

        Returns:
            Coherence value (0-10000)
        """
        if len(price_series) < 3:
            return self.scale  # Perfect coherence initially

        # Compute position variance
        xi_var = self.xi_op.variance(price_series[-10:])
        if xi_var == 0:
            return self.scale

        # Uncertainty product: Δξ * Δψ ≥ ℏ/2
        xi_mean = self.xi_op.expectation(price_series[-10:])
        delta_xi_sq = (xi - xi_mean) ** 2

        # Coherence decreases with position uncertainty
        # Scaled exponential: exp(-x) ≈ 1/(1 + x) for integer math
        normalized_uncertainty = (delta_xi_sq * self.scale) // (xi_var + 1)
        coherence = (self.scale * self.scale) // (self.scale + normalized_uncertainty)

        return min(self.scale, max(0, coherence))

    def _classify_state(
        self,
        xi: int,
        psi: int,
        price_series: List[int]
    ) -> PhaseState:
        """
        Classify phase space state based on (ξ, ψ).

        Args:
            xi: Position
            psi: Momentum
            price_series: Price history

        Returns:
            PhaseState classification
        """
        if len(price_series) < 5:
            return PhaseState.TRANSITIONAL

        # Momentum threshold (5% of scale)
        momentum_threshold = self.scale // 20

        # Volatility measure
        recent_prices = price_series[-10:]
        price_range = max(recent_prices) - min(recent_prices)
        mean_price = sum(recent_prices) // len(recent_prices)
        volatility = (price_range * self.scale) // (mean_price + 1)

        # Classification logic
        if abs(psi) > momentum_threshold * 3:
            # Strong momentum
            return PhaseState.BULLISH if psi > 0 else PhaseState.BEARISH
        elif volatility < self.scale // 10:  # < 10% volatility
            return PhaseState.RANGING
        else:
            return PhaseState.TRANSITIONAL

    def evolve_phase_space(
        self,
        price_series: List[int],
        num_steps: int = 10
    ) -> PhasePortrait:
        """
        Evolve phase space over Lucas time steps.

        Args:
            price_series: Price history (scaled)
            num_steps: Number of Lucas time steps

        Returns:
            Complete PhasePortrait with trajectories
        """
        points = []
        trajectories = []
        current_trajectory = []

        for i in range(num_steps):
            if i >= len(price_series):
                break

            # Compute phase point
            phase_point = self.compute_phase_point(
                price_series[:i+1],
                time_index=i
            )
            points.append(phase_point)
            current_trajectory.append((phase_point.xi, phase_point.psi))

        trajectories.append(current_trajectory)

        # Find attractors (stable points in phase space)
        attractors = self._find_attractors(points)

        # Create coherence map
        coherence_map = self._create_coherence_map(points)

        # Lucas times used
        lucas_times = [self.get_lucas_time(i) for i in range(num_steps)]

        return PhasePortrait(
            points=points,
            trajectories=trajectories,
            attractors=attractors,
            coherence_map=coherence_map,
            lucas_times=lucas_times
        )

    def _find_attractors(
        self,
        points: List[PhasePoint],
        tolerance: int = None
    ) -> List[Tuple[int, int]]:
        """
        Find attractor points in phase space.

        Attractors are regions where trajectories converge.

        Args:
            points: Phase space points
            tolerance: Distance tolerance (scaled)

        Returns:
            List of (xi, psi) attractor coordinates
        """
        if tolerance is None:
            tolerance = self.scale // 10  # 10% tolerance

        attractors = []

        # Group points by proximity
        for point in points:
            is_near_existing = False
            for attractor in attractors:
                dist_sq = (point.xi - attractor[0])**2 + (point.psi - attractor[1])**2
                if dist_sq < tolerance**2:
                    is_near_existing = True
                    break

            if not is_near_existing and point.coherence > COHERENCE_THRESHOLD:
                attractors.append((point.xi, point.psi))

        return attractors

    def _create_coherence_map(
        self,
        points: List[PhasePoint],
        grid_size: int = 20
    ) -> np.ndarray:
        """
        Create 2D coherence map of phase space.

        Args:
            points: Phase space points
            grid_size: Grid resolution

        Returns:
            2D numpy array of coherence values
        """
        if not points:
            return np.zeros((grid_size, grid_size), dtype=np.int32)

        # Find phase space bounds
        xi_values = [p.xi for p in points]
        psi_values = [p.psi for p in points]

        xi_min, xi_max = min(xi_values), max(xi_values)
        psi_min, psi_max = min(psi_values), max(psi_values)

        # Create grid
        coherence_map = np.zeros((grid_size, grid_size), dtype=np.int32)

        # Map points to grid
        for point in points:
            if xi_max > xi_min:
                i = int(((point.xi - xi_min) * (grid_size - 1)) / (xi_max - xi_min))
            else:
                i = grid_size // 2

            if psi_max > psi_min:
                j = int(((point.psi - psi_min) * (grid_size - 1)) / (psi_max - psi_min))
            else:
                j = grid_size // 2

            i = max(0, min(grid_size - 1, i))
            j = max(0, min(grid_size - 1, j))

            # Average coherence if multiple points in same cell
            if coherence_map[i, j] > 0:
                coherence_map[i, j] = (coherence_map[i, j] + point.coherence) // 2
            else:
                coherence_map[i, j] = point.coherence

        return coherence_map

    def uncertainty_relation(
        self,
        price_series: List[int],
        lucas_times: List[int]
    ) -> Tuple[int, int, int]:
        """
        Compute Heisenberg uncertainty relation: Δξ * Δψ ≥ ℏ/2.

        Args:
            price_series: Price history (scaled)
            lucas_times: Lucas time intervals

        Returns:
            Tuple of (Δξ, Δψ, product) all scaled integers
        """
        # Position uncertainty
        delta_xi = int(np.sqrt(self.xi_op.variance(price_series)))

        # Momentum uncertainty
        delta_psi = int(np.sqrt(self.psi_op.variance(price_series, lucas_times)))

        # Uncertainty product
        product = (delta_xi * delta_psi) // self.scale

        return delta_xi, delta_psi, product

    def nash_equilibrium_exit(
        self,
        current_price: int,
        entry_price: int,
        time_held: int
    ) -> Tuple[bool, int]:
        """
        Determine Nash equilibrium exit point using Lucas timing.

        Args:
            current_price: Current price (scaled)
            entry_price: Entry price (scaled)
            time_held: Days held

        Returns:
            Tuple of (should_exit: bool, lucas_time: int)
        """
        # Find nearest Lucas number to time_held
        nearest_lucas = min(
            self.lucas_sequence[:12],
            key=lambda x: abs(x - time_held)
        )

        # Check if we're at a Lucas time point
        at_lucas_point = (time_held in self.lucas_sequence[:12])

        # Profit factor (scaled)
        if entry_price == 0:
            return False, nearest_lucas

        profit_factor = ((current_price - entry_price) * self.scale) // entry_price

        # Exit conditions:
        # 1. At Lucas time point AND profitable (>2%)
        # 2. At Lucas time point AND loss > -5%
        threshold_profit = self.scale // 50  # 2%
        threshold_loss = -(self.scale // 20)  # -5%

        should_exit = at_lucas_point and (
            profit_factor > threshold_profit or
            profit_factor < threshold_loss
        )

        return should_exit, nearest_lucas

    def export_state(self) -> Dict:
        """
        Export current model state for AgentDB storage.

        Returns:
            Dictionary with model state
        """
        return {
            'scale': self.scale,
            'lucas_sequence': self.lucas_sequence[:15],
            'num_phase_points': len(self.phase_history),
            'latest_coherence': self.phase_history[-1].coherence if self.phase_history else 0,
            'planck_constant': PLANCK_SCALED,
            'coherence_threshold': COHERENCE_THRESHOLD
        }


# Convenience function for quick phase analysis
def analyze_phase_dynamics(
    prices: List[int],
    scale: int = SCALE
) -> Dict:
    """
    Quick phase space analysis of price series.

    Args:
        prices: Price series (scaled integers)
        scale: Scaling factor

    Returns:
        Dictionary with phase analysis results
    """
    model = XiPsiModel(scale=scale)

    # Evolve phase space
    portrait = model.evolve_phase_space(prices, num_steps=len(prices))

    # Uncertainty relation
    lucas_times = portrait.lucas_times
    delta_xi, delta_psi, product = model.uncertainty_relation(prices, lucas_times)

    return {
        'num_points': len(portrait.points),
        'num_attractors': len(portrait.attractors),
        'mean_coherence': sum(p.coherence for p in portrait.points) // len(portrait.points),
        'delta_xi': delta_xi,
        'delta_psi': delta_psi,
        'uncertainty_product': product,
        'phase_states': {
            'bullish': sum(1 for p in portrait.points if p.state == PhaseState.BULLISH),
            'bearish': sum(1 for p in portrait.points if p.state == PhaseState.BEARISH),
            'ranging': sum(1 for p in portrait.points if p.state == PhaseState.RANGING),
            'transitional': sum(1 for p in portrait.points if p.state == PhaseState.TRANSITIONAL)
        }
    }
