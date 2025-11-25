"""
Backtesting Module - Agent 17 (Zeckendorf: 10000100)

Integer-only backtesting engine for quantum trading strategies.
Supports multiple strategies with comprehensive performance metrics.

Dependencies: Agents 13, 14, 15, 16
"""

from .backtest_engine import BacktestEngine, BacktestResult, TradeLog

__all__ = ['BacktestEngine', 'BacktestResult', 'TradeLog']
