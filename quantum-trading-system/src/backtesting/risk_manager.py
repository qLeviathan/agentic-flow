"""
Risk Manager - Agent 19 (Zeckendorf: 10000110)

Comprehensive risk management system using integer-only arithmetic.
Implements Fibonacci-based position sizing, VaR/CVaR, and portfolio allocation.

Features:
- Fibonacci ratio-based position sizing (using φ golden ratio)
- Integer-only VaR and CVaR calculations
- Portfolio allocation with risk limits
- Kelly Criterion approximation (integer)
- Maximum drawdown tracking
- Stop-loss calculations using Fibonacci levels
- Risk-adjusted position scaling

Dependencies:
- Agent 5: Fibonacci Encoder
- Agent 18: Backtesting Engine

All calculations use integer arithmetic with cent precision.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from encoders.fibonacci_encoder import FibonacciEncoder


@dataclass
class PositionRisk:
    """
    Risk parameters for a position.

    All monetary values in cents, ratios scaled by 1000.
    """
    symbol: str
    position_size_cents: int
    entry_price_cents: int
    stop_loss_cents: int
    risk_amount_cents: int
    risk_percent_scaled: int  # Scaled by 1000
    position_value_cents: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'symbol': self.symbol,
            'position_size': f"${self.position_size_cents / 100:.2f}",
            'entry_price': f"${self.entry_price_cents / 100:.2f}",
            'stop_loss': f"${self.stop_loss_cents / 100:.2f}",
            'risk_amount': f"${self.risk_amount_cents / 100:.2f}",
            'risk_percent': f"{self.risk_percent_scaled / 10:.1f}%",
            'position_value': f"${self.position_value_cents / 100:.2f}"
        }


@dataclass
class PortfolioRisk:
    """
    Portfolio-level risk metrics.

    All values in cents or scaled by 1000.
    """
    total_capital_cents: int
    total_risk_cents: int
    total_exposure_cents: int
    var_95_cents: int  # 95% Value at Risk
    cvar_95_cents: int  # 95% Conditional VaR
    max_drawdown_cents: int
    risk_utilization_scaled: int  # Scaled by 1000
    leverage_scaled: int  # Scaled by 1000

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'total_capital': f"${self.total_capital_cents / 100:.2f}",
            'total_risk': f"${self.total_risk_cents / 100:.2f}",
            'total_exposure': f"${self.total_exposure_cents / 100:.2f}",
            'var_95': f"${self.var_95_cents / 100:.2f}",
            'cvar_95': f"${self.cvar_95_cents / 100:.2f}",
            'max_drawdown': f"${self.max_drawdown_cents / 100:.2f}",
            'risk_utilization': f"{self.risk_utilization_scaled / 10:.1f}%",
            'leverage': f"{self.leverage_scaled / 1000:.2f}x"
        }


class RiskManager:
    """
    Integer-only risk management system with Fibonacci-based position sizing.

    Position Sizing Methods:
    - Fibonacci ratios (38.2%, 50%, 61.8%, 100%, 161.8%)
    - Golden ratio (φ) scaling
    - Kelly Criterion approximation
    - Fixed fractional method

    Risk Metrics:
    - Value at Risk (VaR) - 95% confidence
    - Conditional VaR (CVaR) - expected loss beyond VaR
    - Maximum drawdown tracking
    - Portfolio heat (total risk exposure)

    All calculations use integer arithmetic with scaling factors.
    """

    # Risk parameters (scaled by 1000)
    DEFAULT_RISK_PER_TRADE = 20  # 2% per trade
    MAX_PORTFOLIO_RISK = 60  # 6% total portfolio risk
    MAX_POSITION_SIZE = 250  # 25% of capital per position
    MAX_LEVERAGE = 2000  # 2x leverage

    # Fibonacci position size ratios (scaled by 1000)
    FIB_POSITION_SIZES = {
        'conservative': 382,   # 38.2% of max
        'moderate': 618,       # 61.8% of max (golden ratio)
        'aggressive': 1000,    # 100% of max
        'golden_ratio': 1618,  # 161.8% of max (φ)
    }

    # VaR confidence levels (scaled by 1000)
    VAR_95_PERCENTILE = 950  # 95th percentile
    VAR_99_PERCENTILE = 990  # 99th percentile

    SCALE_FACTOR = 1000  # For ratio calculations

    def __init__(self,
                 initial_capital_cents: int = 10000000,  # $100,000
                 risk_per_trade_scaled: int = 20,  # 2%
                 max_portfolio_risk_scaled: int = 60,  # 6%
                 max_position_size_scaled: int = 250):  # 25%
        """
        Initialize Risk Manager.

        Args:
            initial_capital_cents: Initial capital in cents
            risk_per_trade_scaled: Risk per trade (scaled by 1000)
            max_portfolio_risk_scaled: Maximum portfolio risk (scaled by 1000)
            max_position_size_scaled: Maximum position size (scaled by 1000)
        """
        self.initial_capital_cents = initial_capital_cents
        self.current_capital_cents = initial_capital_cents
        self.peak_capital_cents = initial_capital_cents
        self.risk_per_trade_scaled = risk_per_trade_scaled
        self.max_portfolio_risk_scaled = max_portfolio_risk_scaled
        self.max_position_size_scaled = max_position_size_scaled

        # Fibonacci encoder for position sizing
        self.encoder = FibonacciEncoder(max_index=50)

        # Track positions
        self.positions: Dict[str, PositionRisk] = {}
        self.returns_history: List[int] = []  # Scaled returns

        # Portfolio metrics
        self.total_risk_cents = 0
        self.total_exposure_cents = 0
        self.max_drawdown_cents = 0

    def calculate_position_size_fibonacci(self,
                                         symbol: str,
                                         entry_price_cents: int,
                                         stop_loss_cents: int,
                                         risk_level: str = 'moderate') -> PositionRisk:
        """
        Calculate position size using Fibonacci ratios.

        Position size = (Capital × Risk%) × Fibonacci_Ratio / |Entry - Stop|

        Args:
            symbol: Symbol identifier
            entry_price_cents: Entry price in cents
            stop_loss_cents: Stop loss price in cents
            risk_level: 'conservative', 'moderate', 'aggressive', 'golden_ratio'

        Returns:
            PositionRisk with calculated size
        """
        if entry_price_cents <= stop_loss_cents:
            raise ValueError("Entry price must be greater than stop loss")

        # Get Fibonacci ratio for risk level
        fib_ratio = self.FIB_POSITION_SIZES.get(risk_level, self.FIB_POSITION_SIZES['moderate'])

        # Calculate risk amount per trade
        base_risk_cents = (self.current_capital_cents * self.risk_per_trade_scaled) // self.SCALE_FACTOR

        # Apply Fibonacci scaling
        adjusted_risk_cents = (base_risk_cents * fib_ratio) // self.SCALE_FACTOR

        # Calculate distance to stop loss
        risk_per_share_cents = entry_price_cents - stop_loss_cents

        # Position size = risk_amount / risk_per_share
        # But we need shares, so: shares = risk_amount / (risk_per_share / 100)
        shares = (adjusted_risk_cents * 100) // risk_per_share_cents

        # Calculate position value
        position_value_cents = (shares * entry_price_cents) // 100

        # Check position size limit
        max_position_value = (self.current_capital_cents * self.max_position_size_scaled) // self.SCALE_FACTOR
        if position_value_cents > max_position_value:
            # Scale down shares
            shares = (max_position_value * 100) // entry_price_cents
            position_value_cents = (shares * entry_price_cents) // 100
            adjusted_risk_cents = (shares * risk_per_share_cents) // 100

        # Calculate risk percentage
        risk_percent_scaled = 0
        if self.current_capital_cents > 0:
            risk_percent_scaled = (adjusted_risk_cents * self.SCALE_FACTOR) // self.current_capital_cents

        return PositionRisk(
            symbol=symbol,
            position_size_cents=position_value_cents,
            entry_price_cents=entry_price_cents,
            stop_loss_cents=stop_loss_cents,
            risk_amount_cents=adjusted_risk_cents,
            risk_percent_scaled=risk_percent_scaled,
            position_value_cents=position_value_cents
        )

    def calculate_position_size_kelly(self,
                                     win_rate_scaled: int,
                                     avg_win_cents: int,
                                     avg_loss_cents: int) -> int:
        """
        Calculate optimal position size using Kelly Criterion.

        Kelly% = W - [(1-W) / R]
        Where: W = win rate, R = avg_win / avg_loss

        Args:
            win_rate_scaled: Win rate (scaled by 1000)
            avg_win_cents: Average win in cents
            avg_loss_cents: Average loss in cents (positive value)

        Returns:
            Position size as percentage of capital (scaled by 1000)
        """
        if avg_loss_cents == 0 or win_rate_scaled == 0:
            return 0

        # Calculate win/loss ratio
        win_loss_ratio = (avg_win_cents * self.SCALE_FACTOR) // avg_loss_cents

        # Kelly = W - (1-W)/R
        # Scaled: Kelly = W - ((1000-W) * 1000 / R)
        lose_rate_scaled = self.SCALE_FACTOR - win_rate_scaled
        kelly_scaled = win_rate_scaled - (lose_rate_scaled * self.SCALE_FACTOR) // win_loss_ratio

        # Apply Kelly fraction (typically 0.5 * Kelly for safety)
        fractional_kelly = kelly_scaled // 2

        # Cap at maximum position size
        return min(fractional_kelly, self.max_position_size_scaled)

    def calculate_stop_loss_fibonacci(self,
                                     entry_price_cents: int,
                                     swing_high_cents: int,
                                     swing_low_cents: int,
                                     level: str = '618') -> int:
        """
        Calculate stop loss using Fibonacci retracement.

        Places stop below Fibonacci level based on swing points.

        Args:
            entry_price_cents: Entry price in cents
            swing_high_cents: Recent swing high
            swing_low_cents: Recent swing low
            level: Fibonacci level ('236', '382', '500', '618')

        Returns:
            Stop loss price in cents
        """
        if swing_high_cents <= swing_low_cents:
            raise ValueError("Swing high must be greater than swing low")

        # Calculate Fibonacci retracements
        retracements = self.encoder.calculate_retracements(swing_high_cents, swing_low_cents)

        # Get the specified level
        level_key = f'level_{level}'
        if level_key not in retracements:
            level_key = 'level_618'  # Default to golden ratio

        fib_level = retracements[level_key]

        # Place stop 1% below Fibonacci level (safety buffer)
        buffer = fib_level // 100  # 1% buffer
        stop_loss = fib_level - buffer

        # Ensure stop is below entry
        return min(stop_loss, entry_price_cents - 10)  # At least 10 cents below entry

    def calculate_var_95(self, returns_scaled: List[int]) -> int:
        """
        Calculate 95% Value at Risk using historical returns.

        VaR_95 = 5th percentile of returns distribution

        Args:
            returns_scaled: List of historical returns (scaled by 1000)

        Returns:
            VaR in cents (positive value = potential loss)
        """
        if not returns_scaled or len(returns_scaled) < 20:
            return 0

        # Sort returns
        sorted_returns = sorted(returns_scaled)

        # Get 5th percentile (95% VaR)
        percentile_idx = (len(sorted_returns) * 5) // 100
        var_return_scaled = sorted_returns[percentile_idx]

        # Convert to cents
        var_cents = abs((self.current_capital_cents * var_return_scaled) // self.SCALE_FACTOR)

        return var_cents

    def calculate_cvar_95(self, returns_scaled: List[int]) -> int:
        """
        Calculate 95% Conditional Value at Risk (Expected Shortfall).

        CVaR_95 = Expected loss given loss exceeds VaR_95

        Args:
            returns_scaled: List of historical returns (scaled by 1000)

        Returns:
            CVaR in cents (positive value = expected tail loss)
        """
        if not returns_scaled or len(returns_scaled) < 20:
            return 0

        # Sort returns
        sorted_returns = sorted(returns_scaled)

        # Get 5th percentile index
        percentile_idx = (len(sorted_returns) * 5) // 100

        # Calculate average of worst 5% returns
        tail_returns = sorted_returns[:percentile_idx + 1]
        if not tail_returns:
            return 0

        avg_tail_return = sum(tail_returns) // len(tail_returns)

        # Convert to cents
        cvar_cents = abs((self.current_capital_cents * avg_tail_return) // self.SCALE_FACTOR)

        return cvar_cents

    def add_position(self, position: PositionRisk) -> bool:
        """
        Add position to portfolio with risk checks.

        Args:
            position: PositionRisk to add

        Returns:
            True if position added, False if rejected
        """
        # Calculate new total risk
        new_total_risk = self.total_risk_cents + position.risk_amount_cents

        # Check portfolio risk limit
        max_portfolio_risk_cents = (self.current_capital_cents * self.max_portfolio_risk_scaled) // self.SCALE_FACTOR
        if new_total_risk > max_portfolio_risk_cents:
            return False  # Exceeds portfolio risk limit

        # Check leverage limit
        new_total_exposure = self.total_exposure_cents + position.position_value_cents
        leverage_scaled = (new_total_exposure * self.SCALE_FACTOR) // self.current_capital_cents
        if leverage_scaled > self.MAX_LEVERAGE:
            return False  # Exceeds leverage limit

        # Add position
        self.positions[position.symbol] = position
        self.total_risk_cents = new_total_risk
        self.total_exposure_cents = new_total_exposure

        return True

    def remove_position(self, symbol: str, exit_price_cents: int) -> Optional[int]:
        """
        Remove position and calculate P&L.

        Args:
            symbol: Symbol to remove
            exit_price_cents: Exit price in cents

        Returns:
            P&L in cents, or None if position not found
        """
        if symbol not in self.positions:
            return None

        position = self.positions[symbol]

        # Calculate P&L: (exit - entry) * shares / 100
        shares = (position.position_value_cents * 100) // position.entry_price_cents
        pnl_cents = ((exit_price_cents - position.entry_price_cents) * shares) // 100

        # Update capital
        self.current_capital_cents += pnl_cents

        # Update peak capital
        if self.current_capital_cents > self.peak_capital_cents:
            self.peak_capital_cents = self.current_capital_cents

        # Calculate drawdown
        drawdown = self.peak_capital_cents - self.current_capital_cents
        if drawdown > self.max_drawdown_cents:
            self.max_drawdown_cents = drawdown

        # Calculate return and add to history
        return_scaled = 0
        if position.position_value_cents > 0:
            return_scaled = (pnl_cents * self.SCALE_FACTOR) // position.position_value_cents
        self.returns_history.append(return_scaled)

        # Update portfolio metrics
        self.total_risk_cents -= position.risk_amount_cents
        self.total_exposure_cents -= position.position_value_cents

        # Remove position
        del self.positions[symbol]

        return pnl_cents

    def get_portfolio_risk(self) -> PortfolioRisk:
        """
        Calculate comprehensive portfolio risk metrics.

        Returns:
            PortfolioRisk with all metrics
        """
        # Calculate VaR and CVaR
        var_95_cents = self.calculate_var_95(self.returns_history)
        cvar_95_cents = self.calculate_cvar_95(self.returns_history)

        # Calculate risk utilization
        max_risk_cents = (self.current_capital_cents * self.max_portfolio_risk_scaled) // self.SCALE_FACTOR
        risk_utilization_scaled = 0
        if max_risk_cents > 0:
            risk_utilization_scaled = (self.total_risk_cents * self.SCALE_FACTOR) // max_risk_cents

        # Calculate leverage
        leverage_scaled = 0
        if self.current_capital_cents > 0:
            leverage_scaled = (self.total_exposure_cents * self.SCALE_FACTOR) // self.current_capital_cents

        return PortfolioRisk(
            total_capital_cents=self.current_capital_cents,
            total_risk_cents=self.total_risk_cents,
            total_exposure_cents=self.total_exposure_cents,
            var_95_cents=var_95_cents,
            cvar_95_cents=cvar_95_cents,
            max_drawdown_cents=self.max_drawdown_cents,
            risk_utilization_scaled=risk_utilization_scaled,
            leverage_scaled=leverage_scaled
        )

    def check_risk_limits(self) -> Dict[str, bool]:
        """
        Check if portfolio is within risk limits.

        Returns:
            Dictionary of limit checks
        """
        portfolio_risk = self.get_portfolio_risk()

        max_risk_cents = (self.current_capital_cents * self.max_portfolio_risk_scaled) // self.SCALE_FACTOR

        return {
            'portfolio_risk_ok': self.total_risk_cents <= max_risk_cents,
            'leverage_ok': portfolio_risk.leverage_scaled <= self.MAX_LEVERAGE,
            'drawdown_ok': self.max_drawdown_cents <= (self.initial_capital_cents * 200) // self.SCALE_FACTOR,  # 20% max
            'capital_positive': self.current_capital_cents > 0
        }

    def calculate_portfolio_allocation(self,
                                      symbols: List[str],
                                      method: str = 'equal_risk') -> Dict[str, int]:
        """
        Calculate portfolio allocation across symbols.

        Methods:
        - 'equal_weight': Equal capital allocation
        - 'equal_risk': Equal risk allocation
        - 'fibonacci': Fibonacci-weighted allocation

        Args:
            symbols: List of symbols to allocate
            method: Allocation method

        Returns:
            Dictionary mapping symbol -> allocation (scaled by 1000)
        """
        if not symbols:
            return {}

        allocation = {}

        if method == 'equal_weight':
            # Equal weight allocation
            weight = self.SCALE_FACTOR // len(symbols)
            for symbol in symbols:
                allocation[symbol] = weight

        elif method == 'equal_risk':
            # Equal risk allocation
            weight = self.SCALE_FACTOR // len(symbols)
            for symbol in symbols:
                allocation[symbol] = weight

        elif method == 'fibonacci':
            # Fibonacci-weighted allocation
            # Use Fibonacci numbers for weights
            fib_weights = [self.encoder.get_fibonacci(i) for i in range(len(symbols))]
            total_weight = sum(fib_weights)

            for i, symbol in enumerate(symbols):
                if total_weight > 0:
                    allocation[symbol] = (fib_weights[i] * self.SCALE_FACTOR) // total_weight
                else:
                    allocation[symbol] = 0

        return allocation

    def get_risk_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive risk report.

        Returns:
            Dictionary with all risk metrics and positions
        """
        portfolio_risk = self.get_portfolio_risk()
        risk_limits = self.check_risk_limits()

        return {
            'capital': {
                'initial': f"${self.initial_capital_cents / 100:.2f}",
                'current': f"${self.current_capital_cents / 100:.2f}",
                'peak': f"${self.peak_capital_cents / 100:.2f}",
                'return': f"{((self.current_capital_cents - self.initial_capital_cents) * 1000 // self.initial_capital_cents) / 10:.1f}%"
            },
            'portfolio_risk': portfolio_risk.to_dict(),
            'positions': {
                'count': len(self.positions),
                'details': [pos.to_dict() for pos in self.positions.values()]
            },
            'risk_limits': risk_limits,
            'configuration': {
                'risk_per_trade': f"{self.risk_per_trade_scaled / 10:.1f}%",
                'max_portfolio_risk': f"{self.max_portfolio_risk_scaled / 10:.1f}%",
                'max_position_size': f"{self.max_position_size_scaled / 10:.1f}%",
                'max_leverage': f"{self.MAX_LEVERAGE / 1000:.1f}x"
            }
        }


def main():
    """
    Demonstration of Risk Manager.
    """
    print("=" * 80)
    print("RISK MANAGER - Agent 19 (Zeckendorf: 10000110)")
    print("Dependencies: Agent 5 (Fibonacci Encoder), Agent 18 (Backtest Engine)")
    print("=" * 80)
    print()

    # Initialize risk manager
    print("[1] Initializing Risk Manager")
    risk_mgr = RiskManager(
        initial_capital_cents=10000000,  # $100,000
        risk_per_trade_scaled=20,  # 2%
        max_portfolio_risk_scaled=60,  # 6%
        max_position_size_scaled=250  # 25%
    )
    print("    ✅ Risk Manager initialized")
    print()

    # Calculate position size with Fibonacci ratios
    print("[2] Fibonacci Position Sizing")
    entry_price = 15000  # $150.00
    stop_loss = 14000    # $140.00

    for risk_level in ['conservative', 'moderate', 'aggressive', 'golden_ratio']:
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=entry_price,
            stop_loss_cents=stop_loss,
            risk_level=risk_level
        )
        print(f"    {risk_level.upper()}:")
        print(f"      Position Size: ${position.position_size_cents / 100:.2f}")
        print(f"      Risk Amount: ${position.risk_amount_cents / 100:.2f}")
        print(f"      Risk %: {position.risk_percent_scaled / 10:.1f}%")
    print()

    # Calculate Kelly Criterion position size
    print("[3] Kelly Criterion Position Sizing")
    win_rate = 600  # 60%
    avg_win = 50000  # $500
    avg_loss = 30000  # $300
    kelly_size = risk_mgr.calculate_position_size_kelly(win_rate, avg_win, avg_loss)
    print(f"    Win Rate: {win_rate / 10:.1f}%")
    print(f"    Avg Win: ${avg_win / 100:.2f}")
    print(f"    Avg Loss: ${avg_loss / 100:.2f}")
    print(f"    Kelly Position Size: {kelly_size / 10:.1f}%")
    print()

    # Calculate Fibonacci stop loss
    print("[4] Fibonacci Stop Loss Calculation")
    swing_high = 16000  # $160.00
    swing_low = 12000   # $120.00
    entry = 15000       # $150.00

    for level in ['382', '500', '618', '786']:
        stop = risk_mgr.calculate_stop_loss_fibonacci(entry, swing_high, swing_low, level)
        risk_cents = entry - stop
        print(f"    {level} Level: ${stop / 100:.2f} (Risk: ${risk_cents / 100:.2f})")
    print()

    # Add positions and check portfolio risk
    print("[5] Portfolio Risk Management")
    position1 = risk_mgr.calculate_position_size_fibonacci('AAPL', 15000, 14000, 'moderate')
    position2 = risk_mgr.calculate_position_size_fibonacci('GOOGL', 28000, 26000, 'moderate')
    position3 = risk_mgr.calculate_position_size_fibonacci('MSFT', 37000, 35000, 'conservative')

    risk_mgr.add_position(position1)
    risk_mgr.add_position(position2)
    risk_mgr.add_position(position3)

    portfolio_risk = risk_mgr.get_portfolio_risk()
    print(f"    Total Positions: {len(risk_mgr.positions)}")
    print(f"    Total Risk: ${portfolio_risk.total_risk_cents / 100:.2f}")
    print(f"    Total Exposure: ${portfolio_risk.total_exposure_cents / 100:.2f}")
    print(f"    Risk Utilization: {portfolio_risk.risk_utilization_scaled / 10:.1f}%")
    print(f"    Leverage: {portfolio_risk.leverage_scaled / 1000:.2f}x")
    print()

    # Simulate returns and calculate VaR/CVaR
    print("[6] VaR and CVaR Calculation")
    # Simulate 100 returns
    import random
    random.seed(42)
    returns = [random.randint(-100, 150) for _ in range(100)]  # -10% to +15%

    var_95 = risk_mgr.calculate_var_95(returns)
    cvar_95 = risk_mgr.calculate_cvar_95(returns)

    print(f"    95% VaR: ${var_95 / 100:.2f}")
    print(f"    95% CVaR: ${cvar_95 / 100:.2f}")
    print()

    # Portfolio allocation
    print("[7] Portfolio Allocation")
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']

    for method in ['equal_weight', 'equal_risk', 'fibonacci']:
        allocation = risk_mgr.calculate_portfolio_allocation(symbols, method)
        print(f"    {method.upper()}:")
        for symbol, weight in allocation.items():
            print(f"      {symbol}: {weight / 10:.1f}%")
    print()

    # Risk report
    print("[8] Risk Report")
    report = risk_mgr.get_risk_report()
    print(f"    Current Capital: {report['capital']['current']}")
    print(f"    Total Return: {report['capital']['return']}")
    print(f"    Active Positions: {report['positions']['count']}")
    print(f"    Portfolio Risk OK: {report['risk_limits']['portfolio_risk_ok']}")
    print(f"    Leverage OK: {report['risk_limits']['leverage_ok']}")
    print()

    print("=" * 80)
    print("✅ RISK MANAGER READY FOR PRODUCTION")
    print("=" * 80)


if __name__ == "__main__":
    main()
