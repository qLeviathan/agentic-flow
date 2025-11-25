"""
Backtesting Engine - Agent 17 (Zeckendorf: 10000100)

Comprehensive backtesting framework using integer-only arithmetic.
Executes trading strategies on historical data with full performance metrics.

Features:
- Integer-only P&L calculations (cent precision)
- Sharpe ratio (integer approximation)
- Maximum drawdown analysis
- Win rate and risk-adjusted returns
- Trade logging and analysis
- Multiple strategy support

Dependencies:
- Agent 13: Strategy Integration (Fibonacci Strategy)
- Agent 14: Risk Management
- Agent 15: Position Manager
- Agent 16: Order Execution

All calculations use integer arithmetic with scaling factors.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import json
from pathlib import Path
import sys

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class TradeLog:
    """
    Trade execution log with integer-only values.

    All prices and P&L in cents.
    """
    trade_id: int
    timestamp: int  # Bar index
    action: str  # 'BUY' or 'SELL'
    price_cents: int
    position_size: int
    strategy_name: str
    entry_signal: Optional[str] = None
    exit_signal: Optional[str] = None
    pnl_cents: int = 0
    commission_cents: int = 0
    cumulative_pnl_cents: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'trade_id': self.trade_id,
            'timestamp': self.timestamp,
            'action': self.action,
            'price_cents': self.price_cents,
            'position_size': self.position_size,
            'strategy_name': self.strategy_name,
            'entry_signal': self.entry_signal,
            'exit_signal': self.exit_signal,
            'pnl_cents': self.pnl_cents,
            'commission_cents': self.commission_cents,
            'cumulative_pnl_cents': self.cumulative_pnl_cents,
            'price_dollars': f"${self.price_cents / 100:.2f}",
            'pnl_dollars': f"${self.pnl_cents / 100:.2f}",
            'cumulative_pnl_dollars': f"${self.cumulative_pnl_cents / 100:.2f}"
        }


@dataclass
class BacktestResult:
    """
    Comprehensive backtest results with integer-only metrics.

    All monetary values in cents, ratios scaled by 1000.
    """
    # Basic statistics
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate_scaled: int  # Scaled by 1000 (500 = 50%)

    # P&L metrics (in cents)
    total_pnl_cents: int
    gross_profit_cents: int
    gross_loss_cents: int
    average_win_cents: int
    average_loss_cents: int
    largest_win_cents: int
    largest_loss_cents: int

    # Risk-adjusted metrics (scaled by 1000)
    sharpe_ratio_scaled: int  # Scaled by 1000
    sortino_ratio_scaled: int  # Scaled by 1000
    profit_factor_scaled: int  # Scaled by 1000

    # Drawdown analysis (in cents)
    max_drawdown_cents: int
    max_drawdown_percent_scaled: int  # Scaled by 1000

    # Equity tracking
    initial_capital_cents: int
    final_capital_cents: int
    peak_capital_cents: int

    # Trade logs
    trades: List[TradeLog]
    equity_curve: List[int]  # Equity in cents at each timestamp

    # Execution details
    total_commission_cents: int
    strategy_name: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with human-readable values."""
        return {
            'summary': {
                'strategy_name': self.strategy_name,
                'total_trades': self.total_trades,
                'winning_trades': self.winning_trades,
                'losing_trades': self.losing_trades,
                'win_rate_percent': f"{self.win_rate_scaled / 10:.1f}%"
            },
            'pnl': {
                'total_pnl': f"${self.total_pnl_cents / 100:.2f}",
                'gross_profit': f"${self.gross_profit_cents / 100:.2f}",
                'gross_loss': f"${self.gross_loss_cents / 100:.2f}",
                'average_win': f"${self.average_win_cents / 100:.2f}",
                'average_loss': f"${self.average_loss_cents / 100:.2f}",
                'largest_win': f"${self.largest_win_cents / 100:.2f}",
                'largest_loss': f"${self.largest_loss_cents / 100:.2f}",
            },
            'risk_metrics': {
                'sharpe_ratio': f"{self.sharpe_ratio_scaled / 1000:.3f}",
                'sortino_ratio': f"{self.sortino_ratio_scaled / 1000:.3f}",
                'profit_factor': f"{self.profit_factor_scaled / 1000:.3f}",
                'max_drawdown': f"${self.max_drawdown_cents / 100:.2f}",
                'max_drawdown_percent': f"{self.max_drawdown_percent_scaled / 10:.1f}%"
            },
            'capital': {
                'initial': f"${self.initial_capital_cents / 100:.2f}",
                'final': f"${self.final_capital_cents / 100:.2f}",
                'peak': f"${self.peak_capital_cents / 100:.2f}",
                'return_percent': f"{((self.final_capital_cents - self.initial_capital_cents) * 1000 // self.initial_capital_cents) / 10:.1f}%"
            },
            'execution': {
                'total_commission': f"${self.total_commission_cents / 100:.2f}"
            }
        }


class BacktestEngine:
    """
    Integer-only backtesting engine for trading strategies.

    Executes strategies on historical data and calculates comprehensive
    performance metrics using only integer arithmetic.

    Commission model: Fixed cents per trade or percentage-based.
    """

    # Default parameters (scaled appropriately)
    DEFAULT_COMMISSION_CENTS = 0  # No commission by default
    SCALE_FACTOR = 1000  # For ratio calculations
    RISK_FREE_RATE_SCALED = 0  # 0% risk-free rate (scaled by 1000)

    def __init__(self,
                 initial_capital_cents: int = 10000000,  # $100,000
                 commission_cents: int = 0,
                 commission_percent_scaled: int = 0,  # Scaled by 1000 (10 = 1%)
                 slippage_cents: int = 0):
        """
        Initialize backtesting engine.

        Args:
            initial_capital_cents: Starting capital in cents
            commission_cents: Fixed commission per trade in cents
            commission_percent_scaled: Commission as percentage (scaled by 1000)
            slippage_cents: Slippage per trade in cents
        """
        self.initial_capital_cents = initial_capital_cents
        self.commission_cents = commission_cents
        self.commission_percent_scaled = commission_percent_scaled
        self.slippage_cents = slippage_cents

        # State tracking
        self.current_capital_cents = initial_capital_cents
        self.peak_capital_cents = initial_capital_cents
        self.trade_counter = 0
        self.trades: List[TradeLog] = []
        self.equity_curve: List[int] = [initial_capital_cents]

    def calculate_commission(self, price_cents: int, position_size: int) -> int:
        """
        Calculate commission for a trade.

        Args:
            price_cents: Trade price in cents per share
            position_size: Number of shares

        Returns:
            Commission in cents
        """
        # Fixed commission
        fixed_comm = self.commission_cents

        # Percentage-based commission
        # Trade value = price_cents * position_size (total value in cents)
        # For example: $150/share * 100 shares = $15,000 = 1,500,000 cents
        # Commission: 1% (10/1000) of 1,500,000 = 15,000 cents
        trade_value = price_cents * position_size
        percent_comm = (trade_value * self.commission_percent_scaled) // self.SCALE_FACTOR

        return fixed_comm + percent_comm

    def execute_trade(self,
                     timestamp: int,
                     action: str,
                     price_cents: int,
                     position_size: int,
                     strategy_name: str,
                     entry_signal: Optional[str] = None,
                     exit_signal: Optional[str] = None,
                     entry_price_cents: Optional[int] = None) -> TradeLog:
        """
        Execute a trade and update state.

        Args:
            timestamp: Bar index
            action: 'BUY' or 'SELL'
            price_cents: Execution price in cents
            position_size: Number of shares/contracts
            strategy_name: Name of strategy
            entry_signal: Entry signal type
            exit_signal: Exit signal type
            entry_price_cents: Entry price for P&L calculation

        Returns:
            TradeLog entry
        """
        self.trade_counter += 1

        # Apply slippage
        execution_price = price_cents
        if action == 'BUY':
            execution_price += self.slippage_cents
        else:
            execution_price -= self.slippage_cents

        # Calculate commission
        commission = self.calculate_commission(execution_price, position_size)

        # Calculate P&L for SELL orders
        pnl_cents = 0
        if action == 'SELL' and entry_price_cents is not None:
            # P&L = (exit_price - entry_price) * position_size / 100 - commission
            price_diff = execution_price - entry_price_cents
            pnl_cents = (price_diff * position_size) // 100 - commission
            self.current_capital_cents += pnl_cents
        elif action == 'BUY':
            # Deduct commission on entry
            self.current_capital_cents -= commission
            pnl_cents = -commission

        # Update peak capital
        if self.current_capital_cents > self.peak_capital_cents:
            self.peak_capital_cents = self.current_capital_cents

        # Create trade log
        trade = TradeLog(
            trade_id=self.trade_counter,
            timestamp=timestamp,
            action=action,
            price_cents=execution_price,
            position_size=position_size,
            strategy_name=strategy_name,
            entry_signal=entry_signal,
            exit_signal=exit_signal,
            pnl_cents=pnl_cents,
            commission_cents=commission,
            cumulative_pnl_cents=self.current_capital_cents - self.initial_capital_cents
        )

        self.trades.append(trade)
        self.equity_curve.append(self.current_capital_cents)

        return trade

    def run_backtest(self,
                     price_data: List[int],
                     strategy,
                     strategy_name: str = "Unknown Strategy",
                     lookback_period: int = 20) -> BacktestResult:
        """
        Run backtest on historical price data.

        Args:
            price_data: List of prices in cents
            strategy: Strategy object with check_entry_signal and check_exit_signal methods
            strategy_name: Name of the strategy
            lookback_period: Lookback period for swing point calculation

        Returns:
            BacktestResult with comprehensive metrics
        """
        if len(price_data) < lookback_period:
            raise ValueError(f"Need at least {lookback_period} price bars")

        # Reset state
        self.current_capital_cents = self.initial_capital_cents
        self.peak_capital_cents = self.initial_capital_cents
        self.trade_counter = 0
        self.trades = []
        self.equity_curve = [self.initial_capital_cents]

        # Track entry price for P&L calculation
        entry_price = 0
        entry_timestamp = 0
        position_size = 0

        # Run through price data
        for i in range(lookback_period, len(price_data)):
            # Get price window for swing point calculation
            window = price_data[i - lookback_period:i]
            swing_high = max(window)
            swing_low = min(window)
            current_price = price_data[i]

            # Update swing points if valid
            if swing_high > swing_low:
                try:
                    strategy.update_swing_points(swing_high, swing_low)
                except (ValueError, AttributeError):
                    continue

            # Check for exit if in position
            if strategy.in_position:
                exit_signal = strategy.check_exit_signal(current_price)
                if exit_signal:
                    # Execute exit
                    trade = self.execute_trade(
                        timestamp=i,
                        action='SELL',
                        price_cents=exit_signal['exit_price'],
                        position_size=position_size,
                        strategy_name=strategy_name,
                        exit_signal=exit_signal.get('exit_type', 'EXIT'),
                        entry_price_cents=entry_price
                    )

                    # Update strategy state
                    strategy.execute_exit(exit_signal)

                    entry_price = 0
                    position_size = 0

            # Check for entry if not in position
            if not strategy.in_position:
                entry_signal = strategy.check_entry_signal(current_price)
                if entry_signal:
                    # Execute entry
                    entry_price = entry_signal['entry_price']
                    position_size = entry_signal['position_size']
                    entry_timestamp = i

                    trade = self.execute_trade(
                        timestamp=i,
                        action='BUY',
                        price_cents=entry_price,
                        position_size=position_size,
                        strategy_name=strategy_name,
                        entry_signal=entry_signal.get('level', 'ENTRY')
                    )

                    # Update strategy state
                    strategy.execute_entry(entry_signal)

            # Update equity curve even if no trade
            if len(self.equity_curve) <= i:
                self.equity_curve.append(self.current_capital_cents)

        # Calculate performance metrics
        return self._calculate_metrics(strategy_name)

    def _calculate_metrics(self, strategy_name: str) -> BacktestResult:
        """
        Calculate comprehensive performance metrics.

        All calculations use integer arithmetic.

        Args:
            strategy_name: Name of strategy for reporting

        Returns:
            BacktestResult with all metrics
        """
        # Separate winning and losing trades
        winning_trades = [t for t in self.trades if t.action == 'SELL' and t.pnl_cents > 0]
        losing_trades = [t for t in self.trades if t.action == 'SELL' and t.pnl_cents < 0]

        total_closed_trades = len([t for t in self.trades if t.action == 'SELL'])
        num_winning = len(winning_trades)
        num_losing = len(losing_trades)

        # Win rate (scaled by 1000)
        win_rate_scaled = 0
        if total_closed_trades > 0:
            win_rate_scaled = (num_winning * self.SCALE_FACTOR) // total_closed_trades

        # P&L calculations
        gross_profit = sum(t.pnl_cents for t in winning_trades)
        gross_loss = abs(sum(t.pnl_cents for t in losing_trades))
        total_pnl = sum(t.pnl_cents for t in self.trades if t.action == 'SELL')

        # Average win/loss
        avg_win = gross_profit // max(1, num_winning) if num_winning > 0 else 0
        avg_loss = gross_loss // max(1, num_losing) if num_losing > 0 else 0

        # Largest win/loss
        largest_win = max([t.pnl_cents for t in winning_trades], default=0)
        largest_loss = min([t.pnl_cents for t in losing_trades], default=0)

        # Profit factor (scaled by 1000)
        profit_factor_scaled = 0
        if gross_loss > 0:
            profit_factor_scaled = (gross_profit * self.SCALE_FACTOR) // gross_loss
        elif gross_profit > 0:
            profit_factor_scaled = 99999  # Infinite profit factor (no losses)

        # Sharpe ratio (integer approximation)
        sharpe_ratio_scaled = self._calculate_sharpe_ratio()

        # Sortino ratio (integer approximation)
        sortino_ratio_scaled = self._calculate_sortino_ratio()

        # Maximum drawdown
        max_dd_cents, max_dd_percent_scaled = self._calculate_max_drawdown()

        # Total commission
        total_commission = sum(t.commission_cents for t in self.trades)

        return BacktestResult(
            total_trades=total_closed_trades,
            winning_trades=num_winning,
            losing_trades=num_losing,
            win_rate_scaled=win_rate_scaled,
            total_pnl_cents=total_pnl,
            gross_profit_cents=gross_profit,
            gross_loss_cents=gross_loss,
            average_win_cents=avg_win,
            average_loss_cents=avg_loss,
            largest_win_cents=largest_win,
            largest_loss_cents=largest_loss,
            sharpe_ratio_scaled=sharpe_ratio_scaled,
            sortino_ratio_scaled=sortino_ratio_scaled,
            profit_factor_scaled=profit_factor_scaled,
            max_drawdown_cents=max_dd_cents,
            max_drawdown_percent_scaled=max_dd_percent_scaled,
            initial_capital_cents=self.initial_capital_cents,
            final_capital_cents=self.current_capital_cents,
            peak_capital_cents=self.peak_capital_cents,
            trades=self.trades,
            equity_curve=self.equity_curve,
            total_commission_cents=total_commission,
            strategy_name=strategy_name
        )

    def _calculate_sharpe_ratio(self) -> int:
        """
        Calculate Sharpe ratio using integer arithmetic.

        Sharpe = (mean_return - risk_free_rate) / std_dev

        Returns:
            Sharpe ratio scaled by 1000
        """
        if len(self.equity_curve) < 2:
            return 0

        # Calculate returns (scaled by 1000 for precision)
        returns = []
        for i in range(1, len(self.equity_curve)):
            prev_equity = self.equity_curve[i-1]
            curr_equity = self.equity_curve[i]

            if prev_equity > 0:
                ret = ((curr_equity - prev_equity) * self.SCALE_FACTOR) // prev_equity
                returns.append(ret)

        if not returns or len(returns) < 2:
            return 0

        # Mean return
        mean_return = sum(returns) // len(returns)

        # Standard deviation (integer approximation)
        variance = sum((r - mean_return) ** 2 for r in returns) // len(returns)
        std_dev = self._integer_sqrt(variance)

        # Handle zero or near-zero volatility
        if std_dev <= 1:
            # If returns are positive with zero volatility, return high Sharpe
            if mean_return > 0:
                return 99999  # Max Sharpe ratio for zero volatility positive returns
            return 0

        # Sharpe ratio
        excess_return = mean_return - self.RISK_FREE_RATE_SCALED
        sharpe = (excess_return * self.SCALE_FACTOR) // std_dev

        return sharpe

    def _calculate_sortino_ratio(self) -> int:
        """
        Calculate Sortino ratio using integer arithmetic.

        Sortino = (mean_return - risk_free_rate) / downside_deviation

        Returns:
            Sortino ratio scaled by 1000
        """
        if len(self.equity_curve) < 2:
            return 0

        # Calculate returns
        returns = []
        for i in range(1, len(self.equity_curve)):
            prev_equity = self.equity_curve[i-1]
            curr_equity = self.equity_curve[i]

            if prev_equity > 0:
                ret = ((curr_equity - prev_equity) * self.SCALE_FACTOR) // prev_equity
                returns.append(ret)

        if not returns:
            return 0

        # Mean return
        mean_return = sum(returns) // len(returns)

        # Downside deviation (only negative returns)
        downside_returns = [r for r in returns if r < 0]
        if not downside_returns:
            return 99999  # Infinite Sortino (no downside)

        downside_variance = sum((r - 0) ** 2 for r in downside_returns) // len(downside_returns)
        downside_dev = self._integer_sqrt(downside_variance)

        if downside_dev == 0:
            return 0

        # Sortino ratio
        excess_return = mean_return - self.RISK_FREE_RATE_SCALED
        sortino = (excess_return * self.SCALE_FACTOR) // downside_dev

        return sortino

    def _calculate_max_drawdown(self) -> Tuple[int, int]:
        """
        Calculate maximum drawdown in cents and percentage.

        Returns:
            Tuple of (max_drawdown_cents, max_drawdown_percent_scaled)
        """
        if not self.equity_curve:
            return 0, 0

        max_dd_cents = 0
        max_dd_percent_scaled = 0
        peak = self.equity_curve[0]
        peak_for_max_dd = peak

        for equity in self.equity_curve:
            if equity > peak:
                peak = equity

            drawdown = peak - equity
            if drawdown > max_dd_cents:
                max_dd_cents = drawdown
                peak_for_max_dd = peak

        # Calculate percentage (scaled by 1000) using the peak where max DD occurred
        if peak_for_max_dd > 0:
            max_dd_percent_scaled = (max_dd_cents * self.SCALE_FACTOR) // peak_for_max_dd

        return max_dd_cents, max_dd_percent_scaled

    def _integer_sqrt(self, n: int) -> int:
        """
        Integer square root using Newton's method.

        Args:
            n: Integer to find square root of

        Returns:
            Integer square root
        """
        if n < 0:
            return 0
        if n == 0:
            return 0

        # Newton's method
        x = n
        while True:
            x1 = (x + n // x) // 2
            if x1 >= x:
                return x
            x = x1

    def export_results(self, result: BacktestResult, output_path: str) -> None:
        """
        Export backtest results to JSON file.

        Args:
            result: BacktestResult to export
            output_path: Output file path
        """
        output_data = {
            'summary': result.to_dict(),
            'trades': [t.to_dict() for t in result.trades],
            'equity_curve': result.equity_curve
        }

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

    def get_trade_analysis(self, result: BacktestResult) -> Dict[str, Any]:
        """
        Get detailed trade analysis.

        Args:
            result: BacktestResult to analyze

        Returns:
            Dictionary with trade statistics
        """
        if result.total_trades == 0:
            return {
                'max_consecutive_wins': 0,
                'max_consecutive_losses': 0,
                'total_trades': 0,
                'average_trade_pnl': '$0.00',
                'risk_reward_ratio': '0.00:1',
                'note': 'No trades executed'
            }

        # Consecutive wins/losses
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        current_wins = 0
        current_losses = 0

        for trade in result.trades:
            if trade.action == 'SELL':
                if trade.pnl_cents > 0:
                    current_wins += 1
                    current_losses = 0
                    max_consecutive_wins = max(max_consecutive_wins, current_wins)
                else:
                    current_losses += 1
                    current_wins = 0
                    max_consecutive_losses = max(max_consecutive_losses, current_losses)

        return {
            'max_consecutive_wins': max_consecutive_wins,
            'max_consecutive_losses': max_consecutive_losses,
            'total_trades': result.total_trades,
            'average_trade_pnl': f"${(result.total_pnl_cents // max(1, result.total_trades)) / 100:.2f}",
            'risk_reward_ratio': f"{result.profit_factor_scaled / 1000:.2f}:1"
        }


def main():
    """
    Demonstration of Backtesting Engine.
    """
    print("=" * 80)
    print("BACKTESTING ENGINE - Agent 17 (Zeckendorf: 10000100)")
    print("Dependencies: Agents 13, 14, 15, 16")
    print("=" * 80)
    print()

    # Import strategy
    from strategies.fibonacci_strategy import FibonacciRetracementStrategy

    # Generate sample price data (trending up with pullbacks)
    print("[1] Generating Sample Price Data")
    base_price = 10000  # $100.00
    price_data = []

    for i in range(100):
        # Trending up with Fibonacci-like oscillations
        trend = base_price + i * 50
        oscillation = (i % 13) * 100 - 600
        price = trend + oscillation
        price_data.append(max(5000, price))

    print(f"    Generated {len(price_data)} price bars")
    print(f"    Range: ${min(price_data)/100:.2f} to ${max(price_data)/100:.2f}")
    print()

    # Initialize strategy and engine
    print("[2] Initializing Backtesting Engine")
    strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
    engine = BacktestEngine(
        initial_capital_cents=10000000,  # $100,000
        commission_cents=0,
        slippage_cents=5  # 5 cents slippage
    )
    print("    ✅ Engine initialized")
    print()

    # Run backtest
    print("[3] Running Backtest")
    result = engine.run_backtest(
        price_data=price_data,
        strategy=strategy,
        strategy_name="Fibonacci Retracement Strategy",
        lookback_period=20
    )
    print(f"    ✅ Backtest complete: {result.total_trades} trades executed")
    print()

    # Display results
    print("[4] Backtest Results")
    results_dict = result.to_dict()

    print("    Summary:")
    for key, value in results_dict['summary'].items():
        print(f"      {key}: {value}")
    print()

    print("    P&L:")
    for key, value in results_dict['pnl'].items():
        print(f"      {key}: {value}")
    print()

    print("    Risk Metrics:")
    for key, value in results_dict['risk_metrics'].items():
        print(f"      {key}: {value}")
    print()

    print("    Capital:")
    for key, value in results_dict['capital'].items():
        print(f"      {key}: {value}")
    print()

    # Trade analysis
    print("[5] Trade Analysis")
    analysis = engine.get_trade_analysis(result)
    for key, value in analysis.items():
        print(f"    {key}: {value}")
    print()

    print("=" * 80)
    print("✅ BACKTESTING ENGINE READY FOR PRODUCTION")
    print("=" * 80)


if __name__ == "__main__":
    main()
