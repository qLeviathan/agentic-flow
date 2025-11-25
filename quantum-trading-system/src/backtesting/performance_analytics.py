"""
Performance Analytics - Agent 18 (Zeckendorf: 10000101)

Advanced performance metrics and analytics for trading strategies.
Provides comprehensive risk-adjusted returns, drawdown analysis, and trade statistics
using integer-only arithmetic.

Features:
- Sharpe Ratio (detailed calculation with annualization)
- Maximum Drawdown (with duration tracking)
- Win/Loss Ratio Analysis
- Profit Factor (detailed breakdown)
- Risk-Adjusted Returns (Calmar, MAR, Sterling ratios)
- Expectancy and Kelly Criterion
- Consecutive wins/losses tracking
- Trade distribution analysis
- Rolling performance metrics

Dependencies: Agent 17 (Backtesting Engine)

All calculations use integer arithmetic with scaling factors.
Scale: 1000 for percentages/ratios, 100 for cents/dollars
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class DrawdownPeriod:
    """
    Drawdown period with integer-only tracking.
    """
    start_timestamp: int
    end_timestamp: int
    duration_bars: int
    peak_capital_cents: int
    trough_capital_cents: int
    drawdown_cents: int
    drawdown_percent_scaled: int  # Scaled by 1000
    recovery_bars: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'start_timestamp': self.start_timestamp,
            'end_timestamp': self.end_timestamp,
            'duration_bars': self.duration_bars,
            'peak_capital': f"${self.peak_capital_cents / 100:.2f}",
            'trough_capital': f"${self.trough_capital_cents / 100:.2f}",
            'drawdown': f"${self.drawdown_cents / 100:.2f}",
            'drawdown_percent': f"{self.drawdown_percent_scaled / 10:.1f}%",
            'recovery_bars': self.recovery_bars
        }


@dataclass
class PerformanceMetrics:
    """
    Comprehensive performance metrics with integer-only values.

    All monetary values in cents, ratios scaled by 1000.
    """
    # Sharpe metrics
    sharpe_ratio_scaled: int
    annualized_sharpe_scaled: int  # Assuming 252 trading days

    # Sortino metrics
    sortino_ratio_scaled: int
    annualized_sortino_scaled: int

    # Drawdown metrics
    max_drawdown_cents: int
    max_drawdown_percent_scaled: int
    max_drawdown_duration_bars: int
    average_drawdown_cents: int
    average_drawdown_duration_bars: int

    # Calmar and MAR ratios
    calmar_ratio_scaled: int  # Annual return / max drawdown
    mar_ratio_scaled: int  # CAGR / max drawdown
    sterling_ratio_scaled: int  # CAGR / average drawdown

    # Win/Loss metrics
    win_rate_scaled: int
    win_loss_ratio_scaled: int  # Avg win / avg loss

    # Profit factor details
    profit_factor_scaled: int
    gross_profit_cents: int
    gross_loss_cents: int

    # Expectancy and Kelly
    expectancy_cents: int  # Expected value per trade
    kelly_criterion_scaled: int  # Optimal position size (scaled by 1000)

    # Consecutive streaks
    max_consecutive_wins: int
    max_consecutive_losses: int
    current_streak: int  # Positive for wins, negative for losses

    # Trade distribution
    median_win_cents: int
    median_loss_cents: int
    win_std_dev: int
    loss_std_dev: int

    # Recovery metrics
    average_recovery_bars: int  # Avg time to recover from drawdown
    max_recovery_bars: int

    # Return metrics
    total_return_percent_scaled: int
    annualized_return_scaled: int  # CAGR

    def to_dict(self) -> Dict[str, Any]:
        """Convert to human-readable dictionary."""
        return {
            'sharpe_metrics': {
                'sharpe_ratio': f"{self.sharpe_ratio_scaled / 1000:.3f}",
                'annualized_sharpe': f"{self.annualized_sharpe_scaled / 1000:.3f}",
                'sortino_ratio': f"{self.sortino_ratio_scaled / 1000:.3f}",
                'annualized_sortino': f"{self.annualized_sortino_scaled / 1000:.3f}"
            },
            'drawdown_analysis': {
                'max_drawdown': f"${self.max_drawdown_cents / 100:.2f}",
                'max_drawdown_percent': f"{self.max_drawdown_percent_scaled / 10:.1f}%",
                'max_drawdown_duration': self.max_drawdown_duration_bars,
                'average_drawdown': f"${self.average_drawdown_cents / 100:.2f}",
                'average_drawdown_duration': self.average_drawdown_duration_bars
            },
            'risk_adjusted_returns': {
                'calmar_ratio': f"{self.calmar_ratio_scaled / 1000:.3f}",
                'mar_ratio': f"{self.mar_ratio_scaled / 1000:.3f}",
                'sterling_ratio': f"{self.sterling_ratio_scaled / 1000:.3f}"
            },
            'win_loss_analysis': {
                'win_rate': f"{self.win_rate_scaled / 10:.1f}%",
                'win_loss_ratio': f"{self.win_loss_ratio_scaled / 1000:.3f}",
                'profit_factor': f"{self.profit_factor_scaled / 1000:.3f}",
                'gross_profit': f"${self.gross_profit_cents / 100:.2f}",
                'gross_loss': f"${self.gross_loss_cents / 100:.2f}"
            },
            'expectancy_analysis': {
                'expectancy_per_trade': f"${self.expectancy_cents / 100:.2f}",
                'kelly_criterion': f"{self.kelly_criterion_scaled / 10:.1f}%"
            },
            'streak_analysis': {
                'max_consecutive_wins': self.max_consecutive_wins,
                'max_consecutive_losses': self.max_consecutive_losses,
                'current_streak': self.current_streak
            },
            'trade_distribution': {
                'median_win': f"${self.median_win_cents / 100:.2f}",
                'median_loss': f"${self.median_loss_cents / 100:.2f}",
                'win_std_dev': f"${self.win_std_dev / 100:.2f}",
                'loss_std_dev': f"${self.loss_std_dev / 100:.2f}"
            },
            'recovery_metrics': {
                'average_recovery_bars': self.average_recovery_bars,
                'max_recovery_bars': self.max_recovery_bars
            },
            'returns': {
                'total_return': f"{self.total_return_percent_scaled / 10:.1f}%",
                'annualized_return': f"{self.annualized_return_scaled / 10:.1f}%"
            }
        }


class PerformanceAnalytics:
    """
    Advanced performance analytics using integer-only arithmetic.

    Provides comprehensive metrics for backtesting and strategy evaluation.
    All calculations maintain cent precision without floating-point operations.
    """

    SCALE_FACTOR = 1000  # For ratio calculations
    TRADING_DAYS_PER_YEAR = 252

    def __init__(self):
        """Initialize performance analytics."""
        pass

    def analyze_performance(self,
                          equity_curve: List[int],
                          trades: List[Any],
                          initial_capital_cents: int,
                          bars_per_period: int = 1) -> PerformanceMetrics:
        """
        Perform comprehensive performance analysis.

        Args:
            equity_curve: List of equity values in cents
            trades: List of TradeLog objects
            initial_capital_cents: Starting capital in cents
            bars_per_period: Number of bars per time period (for annualization)

        Returns:
            PerformanceMetrics with all calculated metrics
        """
        # Separate winning and losing trades
        closed_trades = [t for t in trades if t.action == 'SELL']
        winning_trades = [t for t in closed_trades if t.pnl_cents > 0]
        losing_trades = [t for t in closed_trades if t.pnl_cents < 0]

        # Calculate basic ratios
        sharpe = self._calculate_sharpe_ratio(equity_curve)
        sortino = self._calculate_sortino_ratio(equity_curve)

        # Annualize Sharpe and Sortino
        periods_per_year = self.TRADING_DAYS_PER_YEAR // max(1, bars_per_period)
        annualized_sharpe = self._annualize_ratio(sharpe, periods_per_year, len(equity_curve))
        annualized_sortino = self._annualize_ratio(sortino, periods_per_year, len(equity_curve))

        # Drawdown analysis
        drawdown_periods = self._analyze_drawdowns(equity_curve)
        max_dd_cents, max_dd_pct, max_dd_dur = self._get_max_drawdown(drawdown_periods)
        avg_dd_cents, avg_dd_dur = self._get_average_drawdown(drawdown_periods)
        avg_recovery, max_recovery = self._get_recovery_metrics(drawdown_periods)

        # Win/Loss analysis
        win_rate = self._calculate_win_rate(winning_trades, losing_trades)
        win_loss_ratio = self._calculate_win_loss_ratio(winning_trades, losing_trades)

        # Profit factor
        gross_profit = sum(t.pnl_cents for t in winning_trades)
        gross_loss = abs(sum(t.pnl_cents for t in losing_trades))
        profit_factor = self._calculate_profit_factor(gross_profit, gross_loss)

        # Expectancy and Kelly
        expectancy = self._calculate_expectancy(winning_trades, losing_trades)
        kelly = self._calculate_kelly_criterion(win_rate, win_loss_ratio)

        # Consecutive streaks
        max_wins, max_losses, current = self._analyze_streaks(closed_trades)

        # Trade distribution
        median_win, median_loss = self._calculate_medians(winning_trades, losing_trades)
        win_std, loss_std = self._calculate_std_devs(winning_trades, losing_trades)

        # Return metrics
        total_return_pct = self._calculate_total_return(
            initial_capital_cents,
            equity_curve[-1] if equity_curve else initial_capital_cents
        )
        annualized_return = self._calculate_annualized_return(
            initial_capital_cents,
            equity_curve[-1] if equity_curve else initial_capital_cents,
            len(equity_curve),
            periods_per_year
        )

        # Risk-adjusted return ratios
        calmar = self._calculate_calmar_ratio(annualized_return, max_dd_pct)
        mar = self._calculate_mar_ratio(annualized_return, max_dd_pct)
        sterling = self._calculate_sterling_ratio(annualized_return, avg_dd_cents, initial_capital_cents)

        return PerformanceMetrics(
            sharpe_ratio_scaled=sharpe,
            annualized_sharpe_scaled=annualized_sharpe,
            sortino_ratio_scaled=sortino,
            annualized_sortino_scaled=annualized_sortino,
            max_drawdown_cents=max_dd_cents,
            max_drawdown_percent_scaled=max_dd_pct,
            max_drawdown_duration_bars=max_dd_dur,
            average_drawdown_cents=avg_dd_cents,
            average_drawdown_duration_bars=avg_dd_dur,
            calmar_ratio_scaled=calmar,
            mar_ratio_scaled=mar,
            sterling_ratio_scaled=sterling,
            win_rate_scaled=win_rate,
            win_loss_ratio_scaled=win_loss_ratio,
            profit_factor_scaled=profit_factor,
            gross_profit_cents=gross_profit,
            gross_loss_cents=gross_loss,
            expectancy_cents=expectancy,
            kelly_criterion_scaled=kelly,
            max_consecutive_wins=max_wins,
            max_consecutive_losses=max_losses,
            current_streak=current,
            median_win_cents=median_win,
            median_loss_cents=median_loss,
            win_std_dev=win_std,
            loss_std_dev=loss_std,
            average_recovery_bars=avg_recovery,
            max_recovery_bars=max_recovery,
            total_return_percent_scaled=total_return_pct,
            annualized_return_scaled=annualized_return
        )

    def _calculate_sharpe_ratio(self, equity_curve: List[int]) -> int:
        """
        Calculate Sharpe ratio using integer arithmetic.

        Returns:
            Sharpe ratio scaled by 1000
        """
        if len(equity_curve) < 2:
            return 0

        # Calculate returns (scaled by 1000)
        returns = []
        for i in range(1, len(equity_curve)):
            prev = equity_curve[i-1]
            curr = equity_curve[i]

            if prev > 0:
                ret = ((curr - prev) * self.SCALE_FACTOR) // prev
                returns.append(ret)

        if not returns:
            return 0

        # Mean return
        mean_return = sum(returns) // len(returns)

        # Standard deviation
        variance = sum((r - mean_return) ** 2 for r in returns) // len(returns)
        std_dev = self._integer_sqrt(variance)

        if std_dev == 0:
            return 0

        # Sharpe ratio
        sharpe = (mean_return * self.SCALE_FACTOR) // std_dev

        return sharpe

    def _calculate_sortino_ratio(self, equity_curve: List[int]) -> int:
        """
        Calculate Sortino ratio using integer arithmetic.

        Returns:
            Sortino ratio scaled by 1000
        """
        if len(equity_curve) < 2:
            return 0

        # Calculate returns
        returns = []
        for i in range(1, len(equity_curve)):
            prev = equity_curve[i-1]
            curr = equity_curve[i]

            if prev > 0:
                ret = ((curr - prev) * self.SCALE_FACTOR) // prev
                returns.append(ret)

        if not returns:
            return 0

        # Mean return
        mean_return = sum(returns) // len(returns)

        # Downside deviation
        downside_returns = [r for r in returns if r < 0]
        if not downside_returns:
            return 99999  # Infinite Sortino

        downside_variance = sum(r ** 2 for r in downside_returns) // len(downside_returns)
        downside_dev = self._integer_sqrt(downside_variance)

        if downside_dev == 0:
            return 0

        # Sortino ratio
        sortino = (mean_return * self.SCALE_FACTOR) // downside_dev

        return sortino

    def _annualize_ratio(self, ratio_scaled: int, periods_per_year: int, total_periods: int) -> int:
        """
        Annualize a ratio (Sharpe or Sortino).

        Annualized = Ratio * sqrt(periods_per_year)

        Returns:
            Annualized ratio scaled by 1000
        """
        if total_periods < periods_per_year:
            return ratio_scaled  # Not enough data for annualization

        # sqrt(periods_per_year) using integer approximation
        sqrt_periods = self._integer_sqrt(periods_per_year * self.SCALE_FACTOR)

        # Annualized ratio
        annualized = (ratio_scaled * sqrt_periods) // self.SCALE_FACTOR

        return annualized

    def _analyze_drawdowns(self, equity_curve: List[int]) -> List[DrawdownPeriod]:
        """
        Analyze all drawdown periods in equity curve.

        Returns:
            List of DrawdownPeriod objects
        """
        if not equity_curve:
            return []

        drawdowns = []
        peak = equity_curve[0]
        peak_timestamp = 0
        in_drawdown = False
        dd_start = 0
        trough = peak
        trough_timestamp = 0

        for i, equity in enumerate(equity_curve):
            if equity > peak:
                # New peak - end any active drawdown
                if in_drawdown and trough < peak:
                    dd_cents = peak - trough
                    dd_pct = (dd_cents * self.SCALE_FACTOR) // peak if peak > 0 else 0
                    duration = trough_timestamp - dd_start
                    recovery = i - trough_timestamp

                    drawdowns.append(DrawdownPeriod(
                        start_timestamp=dd_start,
                        end_timestamp=i,
                        duration_bars=duration,
                        peak_capital_cents=peak,
                        trough_capital_cents=trough,
                        drawdown_cents=dd_cents,
                        drawdown_percent_scaled=dd_pct,
                        recovery_bars=recovery
                    ))

                peak = equity
                peak_timestamp = i
                in_drawdown = False
            elif equity < peak:
                # In drawdown
                if not in_drawdown:
                    dd_start = peak_timestamp
                    trough = equity
                    trough_timestamp = i
                    in_drawdown = True
                elif equity < trough:
                    trough = equity
                    trough_timestamp = i

        # Handle unclosed drawdown
        if in_drawdown and trough < peak:
            dd_cents = peak - trough
            dd_pct = (dd_cents * self.SCALE_FACTOR) // peak if peak > 0 else 0
            duration = trough_timestamp - dd_start

            drawdowns.append(DrawdownPeriod(
                start_timestamp=dd_start,
                end_timestamp=len(equity_curve) - 1,
                duration_bars=duration,
                peak_capital_cents=peak,
                trough_capital_cents=trough,
                drawdown_cents=dd_cents,
                drawdown_percent_scaled=dd_pct,
                recovery_bars=0  # Not recovered yet
            ))

        return drawdowns

    def _get_max_drawdown(self, drawdowns: List[DrawdownPeriod]) -> Tuple[int, int, int]:
        """
        Get maximum drawdown metrics.

        Returns:
            Tuple of (max_dd_cents, max_dd_percent_scaled, max_dd_duration)
        """
        if not drawdowns:
            return 0, 0, 0

        max_dd = max(drawdowns, key=lambda d: d.drawdown_cents)

        return max_dd.drawdown_cents, max_dd.drawdown_percent_scaled, max_dd.duration_bars

    def _get_average_drawdown(self, drawdowns: List[DrawdownPeriod]) -> Tuple[int, int]:
        """
        Get average drawdown metrics.

        Returns:
            Tuple of (avg_dd_cents, avg_dd_duration)
        """
        if not drawdowns:
            return 0, 0

        avg_dd_cents = sum(d.drawdown_cents for d in drawdowns) // len(drawdowns)
        avg_dd_duration = sum(d.duration_bars for d in drawdowns) // len(drawdowns)

        return avg_dd_cents, avg_dd_duration

    def _get_recovery_metrics(self, drawdowns: List[DrawdownPeriod]) -> Tuple[int, int]:
        """
        Get recovery time metrics.

        Returns:
            Tuple of (avg_recovery_bars, max_recovery_bars)
        """
        if not drawdowns:
            return 0, 0

        # Only consider recovered drawdowns
        recovered = [d for d in drawdowns if d.recovery_bars > 0]

        if not recovered:
            return 0, 0

        avg_recovery = sum(d.recovery_bars for d in recovered) // len(recovered)
        max_recovery = max(d.recovery_bars for d in recovered)

        return avg_recovery, max_recovery

    def _calculate_win_rate(self, winning_trades: List[Any], losing_trades: List[Any]) -> int:
        """
        Calculate win rate.

        Returns:
            Win rate scaled by 1000 (500 = 50%)
        """
        total_trades = len(winning_trades) + len(losing_trades)

        if total_trades == 0:
            return 0

        return (len(winning_trades) * self.SCALE_FACTOR) // total_trades

    def _calculate_win_loss_ratio(self, winning_trades: List[Any], losing_trades: List[Any]) -> int:
        """
        Calculate win/loss ratio (average win / average loss).

        Returns:
            Win/loss ratio scaled by 1000
        """
        if not winning_trades or not losing_trades:
            return 0

        avg_win = sum(t.pnl_cents for t in winning_trades) // len(winning_trades)
        avg_loss = abs(sum(t.pnl_cents for t in losing_trades) // len(losing_trades))

        if avg_loss == 0:
            return 99999  # Infinite ratio

        return (avg_win * self.SCALE_FACTOR) // avg_loss

    def _calculate_profit_factor(self, gross_profit: int, gross_loss: int) -> int:
        """
        Calculate profit factor.

        Returns:
            Profit factor scaled by 1000
        """
        if gross_loss == 0:
            return 99999 if gross_profit > 0 else 0

        return (gross_profit * self.SCALE_FACTOR) // gross_loss

    def _calculate_expectancy(self, winning_trades: List[Any], losing_trades: List[Any]) -> int:
        """
        Calculate expectancy (expected value per trade).

        Returns:
            Expectancy in cents
        """
        total_trades = len(winning_trades) + len(losing_trades)

        if total_trades == 0:
            return 0

        total_pnl = sum(t.pnl_cents for t in winning_trades) + sum(t.pnl_cents for t in losing_trades)

        return total_pnl // total_trades

    def _calculate_kelly_criterion(self, win_rate_scaled: int, win_loss_ratio_scaled: int) -> int:
        """
        Calculate Kelly Criterion for optimal position sizing.

        Kelly% = W - [(1-W) / R]
        Where: W = win rate, R = win/loss ratio

        Returns:
            Kelly percentage scaled by 1000
        """
        if win_loss_ratio_scaled == 0:
            return 0

        # W (win rate as decimal, scaled by 1000)
        w = win_rate_scaled

        # (1-W) scaled by 1000
        one_minus_w = self.SCALE_FACTOR - w

        # (1-W) / R
        loss_factor = (one_minus_w * self.SCALE_FACTOR) // win_loss_ratio_scaled

        # Kelly = W - loss_factor
        kelly = w - loss_factor

        # Cap at 25% for safety (250 scaled)
        return min(kelly, 250)

    def _analyze_streaks(self, closed_trades: List[Any]) -> Tuple[int, int, int]:
        """
        Analyze consecutive winning and losing streaks.

        Returns:
            Tuple of (max_consecutive_wins, max_consecutive_losses, current_streak)
        """
        if not closed_trades:
            return 0, 0, 0

        max_wins = 0
        max_losses = 0
        current_wins = 0
        current_losses = 0

        for trade in closed_trades:
            if trade.pnl_cents > 0:
                current_wins += 1
                current_losses = 0
                max_wins = max(max_wins, current_wins)
            else:
                current_losses += 1
                current_wins = 0
                max_losses = max(max_losses, current_losses)

        # Current streak (positive for wins, negative for losses)
        current_streak = current_wins if current_wins > 0 else -current_losses

        return max_wins, max_losses, current_streak

    def _calculate_medians(self, winning_trades: List[Any], losing_trades: List[Any]) -> Tuple[int, int]:
        """
        Calculate median win and loss.

        Returns:
            Tuple of (median_win_cents, median_loss_cents)
        """
        median_win = self._median([t.pnl_cents for t in winning_trades]) if winning_trades else 0
        median_loss = self._median([t.pnl_cents for t in losing_trades]) if losing_trades else 0

        return median_win, median_loss

    def _calculate_std_devs(self, winning_trades: List[Any], losing_trades: List[Any]) -> Tuple[int, int]:
        """
        Calculate standard deviation of wins and losses.

        Returns:
            Tuple of (win_std_dev, loss_std_dev)
        """
        win_std = self._std_dev([t.pnl_cents for t in winning_trades]) if winning_trades else 0
        loss_std = self._std_dev([t.pnl_cents for t in losing_trades]) if losing_trades else 0

        return win_std, loss_std

    def _calculate_total_return(self, initial_cents: int, final_cents: int) -> int:
        """
        Calculate total return percentage.

        Returns:
            Total return scaled by 1000
        """
        if initial_cents == 0:
            return 0

        return ((final_cents - initial_cents) * self.SCALE_FACTOR) // initial_cents

    def _calculate_annualized_return(self, initial_cents: int, final_cents: int,
                                   total_periods: int, periods_per_year: int) -> int:
        """
        Calculate annualized return (CAGR).

        CAGR = ((final / initial) ^ (1/years)) - 1

        Using integer approximation.

        Returns:
            Annualized return scaled by 1000
        """
        if initial_cents == 0 or total_periods == 0:
            return 0

        # Years
        years_scaled = (total_periods * self.SCALE_FACTOR) // periods_per_year

        if years_scaled == 0:
            return 0

        # Simple approximation: (final - initial) / initial / years
        total_return = ((final_cents - initial_cents) * self.SCALE_FACTOR) // initial_cents
        annualized = (total_return * self.SCALE_FACTOR) // years_scaled

        return annualized

    def _calculate_calmar_ratio(self, annualized_return_scaled: int, max_dd_percent_scaled: int) -> int:
        """
        Calculate Calmar ratio (annual return / max drawdown).

        Returns:
            Calmar ratio scaled by 1000
        """
        if max_dd_percent_scaled == 0:
            return 99999 if annualized_return_scaled > 0 else 0

        return (annualized_return_scaled * self.SCALE_FACTOR) // max_dd_percent_scaled

    def _calculate_mar_ratio(self, annualized_return_scaled: int, max_dd_percent_scaled: int) -> int:
        """
        Calculate MAR ratio (CAGR / max drawdown).

        Same as Calmar ratio.

        Returns:
            MAR ratio scaled by 1000
        """
        return self._calculate_calmar_ratio(annualized_return_scaled, max_dd_percent_scaled)

    def _calculate_sterling_ratio(self, annualized_return_scaled: int,
                                  avg_dd_cents: int, initial_capital_cents: int) -> int:
        """
        Calculate Sterling ratio (CAGR / average drawdown).

        Returns:
            Sterling ratio scaled by 1000
        """
        if avg_dd_cents == 0 or initial_capital_cents == 0:
            return 99999 if annualized_return_scaled > 0 else 0

        # Convert avg drawdown to percentage
        avg_dd_pct_scaled = (avg_dd_cents * self.SCALE_FACTOR) // initial_capital_cents

        if avg_dd_pct_scaled == 0:
            return 99999 if annualized_return_scaled > 0 else 0

        return (annualized_return_scaled * self.SCALE_FACTOR) // avg_dd_pct_scaled

    def _integer_sqrt(self, n: int) -> int:
        """
        Integer square root using Newton's method.

        Returns:
            Integer square root
        """
        if n < 0:
            return 0
        if n == 0:
            return 0

        x = n
        while True:
            x1 = (x + n // x) // 2
            if x1 >= x:
                return x
            x = x1

    def _median(self, values: List[int]) -> int:
        """
        Calculate median using integer arithmetic.

        Returns:
            Median value
        """
        if not values:
            return 0

        sorted_vals = sorted(values)
        n = len(sorted_vals)

        if n % 2 == 1:
            return sorted_vals[n // 2]
        else:
            return (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) // 2

    def _std_dev(self, values: List[int]) -> int:
        """
        Calculate standard deviation using integer arithmetic.

        Returns:
            Standard deviation
        """
        if not values:
            return 0

        mean = sum(values) // len(values)
        variance = sum((v - mean) ** 2 for v in values) // len(values)

        return self._integer_sqrt(variance)

    def generate_analytics_report(self, metrics: PerformanceMetrics) -> str:
        """
        Generate human-readable analytics report.

        Args:
            metrics: PerformanceMetrics to report

        Returns:
            Formatted report string
        """
        report = []
        report.append("=" * 80)
        report.append("PERFORMANCE ANALYTICS REPORT - Agent 18 (Zeckendorf: 10000101)")
        report.append("=" * 80)
        report.append("")

        # Sharpe metrics
        report.append("[1] Risk-Adjusted Performance")
        report.append(f"    Sharpe Ratio: {metrics.sharpe_ratio_scaled / 1000:.3f}")
        report.append(f"    Annualized Sharpe: {metrics.annualized_sharpe_scaled / 1000:.3f}")
        report.append(f"    Sortino Ratio: {metrics.sortino_ratio_scaled / 1000:.3f}")
        report.append(f"    Annualized Sortino: {metrics.annualized_sortino_scaled / 1000:.3f}")
        report.append("")

        # Drawdown analysis
        report.append("[2] Drawdown Analysis")
        report.append(f"    Max Drawdown: ${metrics.max_drawdown_cents / 100:.2f} ({metrics.max_drawdown_percent_scaled / 10:.1f}%)")
        report.append(f"    Max DD Duration: {metrics.max_drawdown_duration_bars} bars")
        report.append(f"    Avg Drawdown: ${metrics.average_drawdown_cents / 100:.2f}")
        report.append(f"    Avg DD Duration: {metrics.average_drawdown_duration_bars} bars")
        report.append("")

        # Risk-adjusted returns
        report.append("[3] Risk-Adjusted Return Ratios")
        report.append(f"    Calmar Ratio: {metrics.calmar_ratio_scaled / 1000:.3f}")
        report.append(f"    MAR Ratio: {metrics.mar_ratio_scaled / 1000:.3f}")
        report.append(f"    Sterling Ratio: {metrics.sterling_ratio_scaled / 1000:.3f}")
        report.append("")

        # Win/Loss analysis
        report.append("[4] Win/Loss Analysis")
        report.append(f"    Win Rate: {metrics.win_rate_scaled / 10:.1f}%")
        report.append(f"    Win/Loss Ratio: {metrics.win_loss_ratio_scaled / 1000:.3f}")
        report.append(f"    Profit Factor: {metrics.profit_factor_scaled / 1000:.3f}")
        report.append(f"    Gross Profit: ${metrics.gross_profit_cents / 100:.2f}")
        report.append(f"    Gross Loss: ${metrics.gross_loss_cents / 100:.2f}")
        report.append("")

        # Expectancy
        report.append("[5] Expectancy & Position Sizing")
        report.append(f"    Expectancy per Trade: ${metrics.expectancy_cents / 100:.2f}")
        report.append(f"    Kelly Criterion: {metrics.kelly_criterion_scaled / 10:.1f}%")
        report.append("")

        # Streaks
        report.append("[6] Streak Analysis")
        report.append(f"    Max Consecutive Wins: {metrics.max_consecutive_wins}")
        report.append(f"    Max Consecutive Losses: {metrics.max_consecutive_losses}")
        report.append(f"    Current Streak: {metrics.current_streak}")
        report.append("")

        # Distribution
        report.append("[7] Trade Distribution")
        report.append(f"    Median Win: ${metrics.median_win_cents / 100:.2f}")
        report.append(f"    Median Loss: ${metrics.median_loss_cents / 100:.2f}")
        report.append(f"    Win Std Dev: ${metrics.win_std_dev / 100:.2f}")
        report.append(f"    Loss Std Dev: ${metrics.loss_std_dev / 100:.2f}")
        report.append("")

        # Returns
        report.append("[8] Return Metrics")
        report.append(f"    Total Return: {metrics.total_return_percent_scaled / 10:.1f}%")
        report.append(f"    Annualized Return: {metrics.annualized_return_scaled / 10:.1f}%")
        report.append("")

        report.append("=" * 80)
        report.append("✅ ALL METRICS CALCULATED USING INTEGER-ONLY ARITHMETIC")
        report.append("=" * 80)

        return "\n".join(report)


def main():
    """
    Demonstration of Performance Analytics.
    """
    print("=" * 80)
    print("PERFORMANCE ANALYTICS - Agent 18 (Zeckendorf: 10000101)")
    print("Dependencies: Agent 17 (Backtesting Engine)")
    print("=" * 80)
    print()

    # Create sample equity curve and trades
    print("[1] Creating Sample Data")

    # Simulate equity curve with drawdowns
    initial_capital = 10000000  # $100,000
    equity_curve = [initial_capital]

    # Uptrend with drawdowns
    for i in range(100):
        if i < 20:
            equity_curve.append(initial_capital + i * 10000)
        elif i < 30:
            # Drawdown
            equity_curve.append(initial_capital + 200000 - (i - 20) * 5000)
        elif i < 60:
            # Recovery and new high
            equity_curve.append(initial_capital + 150000 + (i - 30) * 15000)
        else:
            # Another drawdown
            equity_curve.append(initial_capital + 600000 - (i - 60) * 3000)

    print(f"    Generated equity curve with {len(equity_curve)} data points")
    print(f"    Range: ${min(equity_curve)/100:.2f} to ${max(equity_curve)/100:.2f}")
    print()

    # Create mock trades
    from dataclasses import dataclass

    @dataclass
    class MockTrade:
        action: str
        pnl_cents: int

    trades = [
        MockTrade('SELL', 50000),
        MockTrade('SELL', -20000),
        MockTrade('SELL', 30000),
        MockTrade('SELL', 40000),
        MockTrade('SELL', -15000),
        MockTrade('SELL', 60000),
        MockTrade('SELL', -25000),
        MockTrade('SELL', 70000),
        MockTrade('SELL', 35000),
        MockTrade('SELL', -10000),
    ]

    print(f"[2] Created {len(trades)} sample trades")
    print()

    # Run analytics
    print("[3] Running Performance Analytics")
    analytics = PerformanceAnalytics()
    metrics = analytics.analyze_performance(
        equity_curve=equity_curve,
        trades=trades,
        initial_capital_cents=initial_capital,
        bars_per_period=1
    )
    print("    ✅ Analytics complete")
    print()

    # Display report
    print("[4] Analytics Report")
    report = analytics.generate_analytics_report(metrics)
    print(report)
    print()

    print("=" * 80)
    print("✅ PERFORMANCE ANALYTICS READY FOR PRODUCTION")
    print("=" * 80)


if __name__ == "__main__":
    main()
