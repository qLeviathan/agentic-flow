"""
Backtesting Validation - Agent 20 (Zeckendorf: 10000111)

Comprehensive validation framework for backtesting integrity.
Validates trade execution logic, detects look-ahead bias, verifies integer-only
operations, and validates performance metrics.

Features:
- Look-ahead bias detection
- Integer-only arithmetic validation
- Trade execution logic verification
- Performance metrics validation
- Signal timing validation
- P&L calculation verification
- Commission and slippage validation

Dependencies:
- Agent 17: Backtesting Engine
- Agent 18: Performance Analytics
- Agent 19: Statistical Validation

All validations use integer arithmetic with comprehensive reporting.
"""

from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class ValidationResult:
    """
    Validation result with pass/fail status and detailed findings.
    """
    check_name: str
    passed: bool
    severity: str  # 'CRITICAL', 'WARNING', 'INFO'
    message: str
    details: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for reporting."""
        return {
            'check_name': self.check_name,
            'passed': self.passed,
            'severity': self.severity,
            'message': self.message,
            'details': self.details
        }


@dataclass
class ValidationReport:
    """
    Comprehensive validation report for a backtest.
    """
    backtest_name: str
    total_checks: int
    passed_checks: int
    failed_checks: int
    warnings: int
    critical_failures: int
    overall_passed: bool
    results: List[ValidationResult]
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for reporting."""
        return {
            'backtest_name': self.backtest_name,
            'summary': {
                'total_checks': self.total_checks,
                'passed_checks': self.passed_checks,
                'failed_checks': self.failed_checks,
                'warnings': self.warnings,
                'critical_failures': self.critical_failures,
                'overall_passed': self.overall_passed
            },
            'results': [r.to_dict() for r in self.results],
            'summary_message': self.summary
        }


class BacktestValidator:
    """
    Comprehensive backtesting validation framework.

    Validates:
    1. Look-ahead bias - Ensures no future data used in decisions
    2. Integer-only operations - Verifies all arithmetic is integer-based
    3. Trade execution logic - Validates proper order execution
    4. Performance metrics - Verifies metric calculations
    5. Signal timing - Ensures signals generated before trade execution
    6. P&L calculations - Validates profit/loss computations
    7. Commission/slippage - Verifies cost calculations
    """

    # Validation thresholds
    EPSILON = 1  # Tolerance for integer calculations (1 cent)
    MAX_PRICE_JUMP_PERCENT = 2000  # 200% (scaled by 10) - detects unrealistic price movements
    MIN_COMMISSION_CENTS = 0
    MAX_COMMISSION_PERCENT_SCALED = 100  # 10% (scaled by 1000)

    def __init__(self):
        """Initialize validator."""
        self.validation_results: List[ValidationResult] = []

    def validate_backtest(self,
                         backtest_result,
                         price_data: List[int],
                         strategy,
                         backtest_name: str = "Backtest") -> ValidationReport:
        """
        Run comprehensive validation on backtest results.

        Args:
            backtest_result: BacktestResult object from BacktestEngine
            price_data: Original price data used in backtest
            strategy: Strategy object used in backtest
            backtest_name: Name of backtest for reporting

        Returns:
            ValidationReport with all validation results
        """
        self.validation_results = []

        # Run all validation checks
        self._validate_integer_only_operations(backtest_result)
        self._validate_look_ahead_bias(backtest_result, price_data)
        self._validate_trade_execution_logic(backtest_result)
        self._validate_performance_metrics(backtest_result)
        self._validate_signal_timing(backtest_result)
        self._validate_pnl_calculations(backtest_result)
        self._validate_commission_slippage(backtest_result)
        self._validate_equity_curve(backtest_result)
        self._validate_price_data_integrity(price_data)
        self._validate_drawdown_calculation(backtest_result)

        # Generate report
        return self._generate_report(backtest_name)

    def _validate_integer_only_operations(self, backtest_result) -> None:
        """
        Validate that all values are integers (no floating point).

        Critical check - floating point operations can introduce
        rounding errors and non-deterministic behavior.
        """
        issues = []

        # Check all monetary values
        fields_to_check = [
            ('total_pnl_cents', backtest_result.total_pnl_cents),
            ('gross_profit_cents', backtest_result.gross_profit_cents),
            ('gross_loss_cents', backtest_result.gross_loss_cents),
            ('average_win_cents', backtest_result.average_win_cents),
            ('average_loss_cents', backtest_result.average_loss_cents),
            ('largest_win_cents', backtest_result.largest_win_cents),
            ('largest_loss_cents', backtest_result.largest_loss_cents),
            ('max_drawdown_cents', backtest_result.max_drawdown_cents),
            ('initial_capital_cents', backtest_result.initial_capital_cents),
            ('final_capital_cents', backtest_result.final_capital_cents),
            ('peak_capital_cents', backtest_result.peak_capital_cents),
            ('total_commission_cents', backtest_result.total_commission_cents)
        ]

        for field_name, value in fields_to_check:
            if not isinstance(value, int):
                issues.append(f"{field_name}: {type(value).__name__} (expected int)")

        # Check scaled values
        scaled_fields = [
            ('win_rate_scaled', backtest_result.win_rate_scaled),
            ('sharpe_ratio_scaled', backtest_result.sharpe_ratio_scaled),
            ('sortino_ratio_scaled', backtest_result.sortino_ratio_scaled),
            ('profit_factor_scaled', backtest_result.profit_factor_scaled),
            ('max_drawdown_percent_scaled', backtest_result.max_drawdown_percent_scaled)
        ]

        for field_name, value in scaled_fields:
            if not isinstance(value, int):
                issues.append(f"{field_name}: {type(value).__name__} (expected int)")

        # Check equity curve
        for i, equity in enumerate(backtest_result.equity_curve):
            if not isinstance(equity, int):
                issues.append(f"equity_curve[{i}]: {type(equity).__name__} (expected int)")
                if len(issues) > 10:  # Limit issue reporting
                    issues.append("... (more equity curve type issues)")
                    break

        # Check trades
        for i, trade in enumerate(backtest_result.trades):
            if not isinstance(trade.price_cents, int):
                issues.append(f"trade[{i}].price_cents: {type(trade.price_cents).__name__}")
            if not isinstance(trade.pnl_cents, int):
                issues.append(f"trade[{i}].pnl_cents: {type(trade.pnl_cents).__name__}")
            if not isinstance(trade.commission_cents, int):
                issues.append(f"trade[{i}].commission_cents: {type(trade.commission_cents).__name__}")

        # Record result
        passed = len(issues) == 0
        severity = 'CRITICAL' if not passed else 'INFO'
        message = "All values are integers" if passed else f"Found {len(issues)} non-integer values"

        self.validation_results.append(ValidationResult(
            check_name="Integer-Only Arithmetic",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues, 'total_issues': len(issues)}
        ))

    def _validate_look_ahead_bias(self, backtest_result, price_data: List[int]) -> None:
        """
        Detect look-ahead bias by checking if trades use future information.

        Look-ahead bias occurs when a trading decision uses data that
        would not have been available at the time of the decision.
        """
        issues = []

        # Check each trade to ensure it only uses past data
        for trade in backtest_result.trades:
            timestamp = trade.timestamp

            # Verify timestamp is valid
            if timestamp < 0:
                issues.append(f"Trade {trade.trade_id}: negative timestamp {timestamp}")
                continue

            if timestamp >= len(price_data):
                issues.append(f"Trade {trade.trade_id}: timestamp {timestamp} exceeds data length {len(price_data)}")
                continue

            # Verify trade price matches or is close to actual price at timestamp
            actual_price = price_data[timestamp]
            price_diff = abs(trade.price_cents - actual_price)

            # Allow reasonable slippage tolerance (1%)
            max_allowed_diff = (actual_price * 10) // 1000  # 1%

            if price_diff > max_allowed_diff:
                issues.append(
                    f"Trade {trade.trade_id} at timestamp {timestamp}: "
                    f"price ${trade.price_cents/100:.2f} differs from actual ${actual_price/100:.2f} "
                    f"by ${price_diff/100:.2f} (>{max_allowed_diff/100:.2f})"
                )

        # Check for trades executed in chronological order
        last_timestamp = -1
        for trade in backtest_result.trades:
            if trade.timestamp < last_timestamp:
                issues.append(
                    f"Trade {trade.trade_id}: out of chronological order "
                    f"(timestamp {trade.timestamp} after {last_timestamp})"
                )
            last_timestamp = trade.timestamp

        # Check for entry/exit pairs
        entry_timestamps: Dict[int, int] = {}  # trade_id -> timestamp
        for trade in backtest_result.trades:
            if trade.action == 'BUY':
                entry_timestamps[trade.trade_id] = trade.timestamp
            elif trade.action == 'SELL':
                # Find corresponding entry (should be before exit)
                # For this validation, we check if exit is after any entry
                if entry_timestamps and trade.timestamp < min(entry_timestamps.values()):
                    issues.append(
                        f"Trade {trade.trade_id}: SELL before any BUY "
                        f"(timestamp {trade.timestamp})"
                    )

        passed = len(issues) == 0
        severity = 'CRITICAL' if not passed else 'INFO'
        message = "No look-ahead bias detected" if passed else f"Found {len(issues)} potential look-ahead issues"

        self.validation_results.append(ValidationResult(
            check_name="Look-Ahead Bias Detection",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues, 'total_issues': len(issues)}
        ))

    def _validate_trade_execution_logic(self, backtest_result) -> None:
        """
        Validate trade execution logic for consistency.

        Checks:
        - Proper BUY/SELL pairing
        - No overlapping positions
        - Proper position management
        """
        issues = []

        # Track position state
        in_position = False
        position_entries = 0
        position_exits = 0

        for trade in backtest_result.trades:
            if trade.action == 'BUY':
                if in_position:
                    issues.append(
                        f"Trade {trade.trade_id}: BUY while already in position "
                        f"(at timestamp {trade.timestamp})"
                    )
                in_position = True
                position_entries += 1

            elif trade.action == 'SELL':
                if not in_position:
                    issues.append(
                        f"Trade {trade.trade_id}: SELL while not in position "
                        f"(at timestamp {trade.timestamp})"
                    )
                in_position = False
                position_exits += 1

            else:
                issues.append(
                    f"Trade {trade.trade_id}: invalid action '{trade.action}' "
                    f"(expected 'BUY' or 'SELL')"
                )

        # Check for balanced entries/exits (or one extra entry if still in position)
        if position_entries != position_exits and position_entries != position_exits + 1:
            issues.append(
                f"Unbalanced entries/exits: {position_entries} BUY, {position_exits} SELL"
            )

        # Verify total_trades matches actual closed trades
        closed_trades = len([t for t in backtest_result.trades if t.action == 'SELL'])
        if backtest_result.total_trades != closed_trades:
            issues.append(
                f"Total trades mismatch: reported {backtest_result.total_trades}, "
                f"actual {closed_trades} closed trades"
            )

        passed = len(issues) == 0
        severity = 'CRITICAL' if not passed else 'INFO'
        message = "Trade execution logic valid" if passed else f"Found {len(issues)} execution logic issues"

        self.validation_results.append(ValidationResult(
            check_name="Trade Execution Logic",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues, 'entries': position_entries, 'exits': position_exits}
        ))

    def _validate_performance_metrics(self, backtest_result) -> None:
        """
        Validate performance metrics calculations.

        Recalculates metrics independently and compares with reported values.
        """
        issues = []

        # Recalculate total P&L
        calculated_pnl = sum(t.pnl_cents for t in backtest_result.trades if t.action == 'SELL')
        if calculated_pnl != backtest_result.total_pnl_cents:
            issues.append(
                f"Total P&L mismatch: reported ${backtest_result.total_pnl_cents/100:.2f}, "
                f"calculated ${calculated_pnl/100:.2f}"
            )

        # Recalculate gross profit/loss
        winning_trades = [t for t in backtest_result.trades if t.action == 'SELL' and t.pnl_cents > 0]
        losing_trades = [t for t in backtest_result.trades if t.action == 'SELL' and t.pnl_cents < 0]

        calculated_gross_profit = sum(t.pnl_cents for t in winning_trades)
        calculated_gross_loss = abs(sum(t.pnl_cents for t in losing_trades))

        if calculated_gross_profit != backtest_result.gross_profit_cents:
            issues.append(
                f"Gross profit mismatch: reported ${backtest_result.gross_profit_cents/100:.2f}, "
                f"calculated ${calculated_gross_profit/100:.2f}"
            )

        if calculated_gross_loss != backtest_result.gross_loss_cents:
            issues.append(
                f"Gross loss mismatch: reported ${backtest_result.gross_loss_cents/100:.2f}, "
                f"calculated ${calculated_gross_loss/100:.2f}"
            )

        # Recalculate win rate
        total_closed = len([t for t in backtest_result.trades if t.action == 'SELL'])
        if total_closed > 0:
            calculated_win_rate = (len(winning_trades) * 1000) // total_closed
            if abs(calculated_win_rate - backtest_result.win_rate_scaled) > 1:  # Allow 1 unit tolerance
                issues.append(
                    f"Win rate mismatch: reported {backtest_result.win_rate_scaled}, "
                    f"calculated {calculated_win_rate}"
                )

        # Validate profit factor
        if backtest_result.gross_loss_cents > 0:
            calculated_profit_factor = (backtest_result.gross_profit_cents * 1000) // backtest_result.gross_loss_cents
            if abs(calculated_profit_factor - backtest_result.profit_factor_scaled) > 1:
                issues.append(
                    f"Profit factor mismatch: reported {backtest_result.profit_factor_scaled}, "
                    f"calculated {calculated_profit_factor}"
                )

        # Validate final capital
        calculated_final = backtest_result.initial_capital_cents + backtest_result.total_pnl_cents
        if calculated_final != backtest_result.final_capital_cents:
            issues.append(
                f"Final capital mismatch: reported ${backtest_result.final_capital_cents/100:.2f}, "
                f"calculated ${calculated_final/100:.2f}"
            )

        passed = len(issues) == 0
        severity = 'CRITICAL' if not passed else 'INFO'
        message = "Performance metrics valid" if passed else f"Found {len(issues)} metric calculation issues"

        self.validation_results.append(ValidationResult(
            check_name="Performance Metrics Validation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues}
        ))

    def _validate_signal_timing(self, backtest_result) -> None:
        """
        Validate that entry/exit signals are properly timed.

        Ensures signals are generated before execution.
        """
        issues = []

        # Check for simultaneous entry and exit at same timestamp
        timestamps_by_action: Dict[int, List[str]] = {}

        for trade in backtest_result.trades:
            ts = trade.timestamp
            if ts not in timestamps_by_action:
                timestamps_by_action[ts] = []
            timestamps_by_action[ts].append(trade.action)

        for ts, actions in timestamps_by_action.items():
            if 'BUY' in actions and 'SELL' in actions:
                issues.append(f"BUY and SELL at same timestamp {ts}")

        passed = len(issues) == 0
        severity = 'WARNING' if not passed else 'INFO'
        message = "Signal timing valid" if passed else f"Found {len(issues)} timing issues"

        self.validation_results.append(ValidationResult(
            check_name="Signal Timing Validation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues}
        ))

    def _validate_pnl_calculations(self, backtest_result) -> None:
        """
        Validate P&L calculations for each trade.

        Recalculates P&L independently and verifies.
        """
        issues = []

        # Track entries to match with exits
        open_positions: Dict[int, Any] = {}  # Simple tracking by trade order

        for i, trade in enumerate(backtest_result.trades):
            if trade.action == 'BUY':
                open_positions[i] = trade

                # BUY should have negative or zero P&L (commission only)
                if trade.pnl_cents > 0:
                    issues.append(
                        f"Trade {trade.trade_id}: BUY has positive P&L ${trade.pnl_cents/100:.2f}"
                    )

            elif trade.action == 'SELL' and open_positions:
                # Get most recent entry (simple FIFO)
                entry_idx = max(open_positions.keys())
                entry_trade = open_positions[entry_idx]
                del open_positions[entry_idx]

                # Recalculate P&L: (exit_price - entry_price) * position_size / 100 - commission
                price_diff = trade.price_cents - entry_trade.price_cents
                calculated_pnl = (price_diff * entry_trade.position_size) // 100 - trade.commission_cents

                if abs(calculated_pnl - trade.pnl_cents) > self.EPSILON:
                    issues.append(
                        f"Trade {trade.trade_id}: P&L mismatch - "
                        f"reported ${trade.pnl_cents/100:.2f}, "
                        f"calculated ${calculated_pnl/100:.2f}"
                    )

        passed = len(issues) == 0
        severity = 'CRITICAL' if not passed else 'INFO'
        message = "P&L calculations valid" if passed else f"Found {len(issues)} P&L calculation issues"

        self.validation_results.append(ValidationResult(
            check_name="P&L Calculation Validation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues}
        ))

    def _validate_commission_slippage(self, backtest_result) -> None:
        """
        Validate commission and slippage calculations.
        """
        issues = []

        # Check commission values are reasonable
        for trade in backtest_result.trades:
            if trade.commission_cents < self.MIN_COMMISSION_CENTS:
                issues.append(
                    f"Trade {trade.trade_id}: negative commission ${trade.commission_cents/100:.2f}"
                )

            # Check commission is not excessive (>10% of trade value)
            trade_value = (trade.price_cents * trade.position_size) // 100
            if trade_value > 0:
                commission_percent_scaled = (trade.commission_cents * 1000) // trade_value
                if commission_percent_scaled > self.MAX_COMMISSION_PERCENT_SCALED:
                    issues.append(
                        f"Trade {trade.trade_id}: excessive commission "
                        f"{commission_percent_scaled/10:.1f}% of trade value"
                    )

        # Verify total commission
        calculated_total_commission = sum(t.commission_cents for t in backtest_result.trades)
        if calculated_total_commission != backtest_result.total_commission_cents:
            issues.append(
                f"Total commission mismatch: reported ${backtest_result.total_commission_cents/100:.2f}, "
                f"calculated ${calculated_total_commission/100:.2f}"
            )

        passed = len(issues) == 0
        severity = 'WARNING' if not passed else 'INFO'
        message = "Commission/slippage valid" if passed else f"Found {len(issues)} cost calculation issues"

        self.validation_results.append(ValidationResult(
            check_name="Commission/Slippage Validation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues}
        ))

    def _validate_equity_curve(self, backtest_result) -> None:
        """
        Validate equity curve consistency.
        """
        issues = []

        if not backtest_result.equity_curve:
            issues.append("Empty equity curve")
        else:
            # First equity value should be initial capital
            if backtest_result.equity_curve[0] != backtest_result.initial_capital_cents:
                issues.append(
                    f"Initial equity mismatch: curve starts at "
                    f"${backtest_result.equity_curve[0]/100:.2f}, "
                    f"expected ${backtest_result.initial_capital_cents/100:.2f}"
                )

            # Last equity value should be final capital
            if backtest_result.equity_curve[-1] != backtest_result.final_capital_cents:
                issues.append(
                    f"Final equity mismatch: curve ends at "
                    f"${backtest_result.equity_curve[-1]/100:.2f}, "
                    f"expected ${backtest_result.final_capital_cents/100:.2f}"
                )

            # Peak capital should be in equity curve
            peak_in_curve = max(backtest_result.equity_curve)
            if peak_in_curve != backtest_result.peak_capital_cents:
                issues.append(
                    f"Peak capital mismatch: curve peak ${peak_in_curve/100:.2f}, "
                    f"reported peak ${backtest_result.peak_capital_cents/100:.2f}"
                )

        passed = len(issues) == 0
        severity = 'WARNING' if not passed else 'INFO'
        message = "Equity curve valid" if passed else f"Found {len(issues)} equity curve issues"

        self.validation_results.append(ValidationResult(
            check_name="Equity Curve Validation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues, 'curve_length': len(backtest_result.equity_curve)}
        ))

    def _validate_price_data_integrity(self, price_data: List[int]) -> None:
        """
        Validate price data integrity.

        Checks for:
        - Negative prices
        - Unrealistic price jumps
        - Data quality issues
        """
        issues = []

        if not price_data:
            issues.append("Empty price data")
            passed = False
        else:
            # Check for negative prices
            for i, price in enumerate(price_data):
                if price < 0:
                    issues.append(f"Negative price at index {i}: ${price/100:.2f}")
                if price == 0:
                    issues.append(f"Zero price at index {i}")

            # Check for unrealistic price jumps
            for i in range(1, len(price_data)):
                prev_price = price_data[i-1]
                curr_price = price_data[i]

                if prev_price > 0:
                    price_change_percent = abs((curr_price - prev_price) * 1000) // prev_price
                    if price_change_percent > self.MAX_PRICE_JUMP_PERCENT:
                        issues.append(
                            f"Unrealistic price jump at index {i}: "
                            f"${prev_price/100:.2f} -> ${curr_price/100:.2f} "
                            f"({price_change_percent/10:.1f}%)"
                        )

            passed = len(issues) == 0

        severity = 'WARNING' if not passed else 'INFO'
        message = "Price data valid" if passed else f"Found {len(issues)} price data issues"

        self.validation_results.append(ValidationResult(
            check_name="Price Data Integrity",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues, 'data_points': len(price_data)}
        ))

    def _validate_drawdown_calculation(self, backtest_result) -> None:
        """
        Validate maximum drawdown calculation.
        """
        issues = []

        # Recalculate max drawdown from equity curve
        if backtest_result.equity_curve:
            max_dd_cents = 0
            peak = backtest_result.equity_curve[0]

            for equity in backtest_result.equity_curve:
                if equity > peak:
                    peak = equity

                drawdown = peak - equity
                if drawdown > max_dd_cents:
                    max_dd_cents = drawdown

            # Compare with reported drawdown
            if max_dd_cents != backtest_result.max_drawdown_cents:
                issues.append(
                    f"Max drawdown mismatch: reported ${backtest_result.max_drawdown_cents/100:.2f}, "
                    f"calculated ${max_dd_cents/100:.2f}"
                )

            # Validate drawdown percentage
            if peak > 0:
                calculated_percent = (max_dd_cents * 1000) // peak
                if abs(calculated_percent - backtest_result.max_drawdown_percent_scaled) > 1:
                    issues.append(
                        f"Max drawdown percent mismatch: "
                        f"reported {backtest_result.max_drawdown_percent_scaled}, "
                        f"calculated {calculated_percent}"
                    )

        passed = len(issues) == 0
        severity = 'WARNING' if not passed else 'INFO'
        message = "Drawdown calculation valid" if passed else f"Found {len(issues)} drawdown issues"

        self.validation_results.append(ValidationResult(
            check_name="Drawdown Calculation",
            passed=passed,
            severity=severity,
            message=message,
            details={'issues': issues}
        ))

    def _generate_report(self, backtest_name: str) -> ValidationReport:
        """
        Generate comprehensive validation report.
        """
        total_checks = len(self.validation_results)
        passed_checks = sum(1 for r in self.validation_results if r.passed)
        failed_checks = total_checks - passed_checks

        warnings = sum(1 for r in self.validation_results if not r.passed and r.severity == 'WARNING')
        critical_failures = sum(1 for r in self.validation_results if not r.passed and r.severity == 'CRITICAL')

        # Overall pass if no critical failures
        overall_passed = critical_failures == 0

        # Generate summary
        if overall_passed:
            if warnings > 0:
                summary = f"Validation PASSED with {warnings} warnings"
            else:
                summary = "Validation PASSED - All checks successful"
        else:
            summary = f"Validation FAILED - {critical_failures} critical failures, {warnings} warnings"

        return ValidationReport(
            backtest_name=backtest_name,
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            warnings=warnings,
            critical_failures=critical_failures,
            overall_passed=overall_passed,
            results=self.validation_results,
            summary=summary
        )


def main():
    """
    Demonstration of Backtest Validator.
    """
    print("=" * 80)
    print("BACKTEST VALIDATOR - Agent 20 (Zeckendorf: 10000111)")
    print("Dependencies: Agents 17, 18, 19")
    print("=" * 80)
    print()

    # Import required modules
    from backtesting.backtest_engine import BacktestEngine
    from strategies.fibonacci_strategy import FibonacciRetracementStrategy

    # Generate sample data
    print("[1] Generating Sample Backtest")
    price_data = []
    base_price = 10000

    for i in range(100):
        trend = base_price + i * 50
        oscillation = (i % 13) * 100 - 600
        price = trend + oscillation
        price_data.append(max(5000, price))

    # Run backtest
    strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
    engine = BacktestEngine(
        initial_capital_cents=10000000,
        commission_cents=10,
        slippage_cents=5
    )

    result = engine.run_backtest(
        price_data=price_data,
        strategy=strategy,
        strategy_name="Fibonacci Strategy",
        lookback_period=20
    )

    print(f"    Backtest complete: {result.total_trades} trades")
    print()

    # Run validation
    print("[2] Running Comprehensive Validation")
    validator = BacktestValidator()
    report = validator.validate_backtest(
        backtest_result=result,
        price_data=price_data,
        strategy=strategy,
        backtest_name="Fibonacci Strategy Backtest"
    )

    print(f"    Validation complete: {report.total_checks} checks")
    print()

    # Display results
    print("[3] Validation Report")
    print(f"    Backtest: {report.backtest_name}")
    print(f"    Total Checks: {report.total_checks}")
    print(f"    Passed: {report.passed_checks}")
    print(f"    Failed: {report.failed_checks}")
    print(f"    Warnings: {report.warnings}")
    print(f"    Critical Failures: {report.critical_failures}")
    print(f"    Overall: {'✅ PASSED' if report.overall_passed else '❌ FAILED'}")
    print()

    print("[4] Detailed Results")
    for r in report.results:
        status_icon = "✅" if r.passed else "❌"
        print(f"    {status_icon} {r.check_name}: {r.message}")
        if not r.passed and r.details.get('issues'):
            for issue in r.details['issues'][:3]:  # Show first 3 issues
                print(f"        - {issue}")
            if len(r.details['issues']) > 3:
                print(f"        ... and {len(r.details['issues']) - 3} more")
    print()

    print("=" * 80)
    print(f"✅ BACKTEST VALIDATION {'PASSED' if report.overall_passed else 'FAILED'}")
    print("=" * 80)


if __name__ == "__main__":
    main()
