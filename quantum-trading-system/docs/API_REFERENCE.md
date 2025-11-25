# API Reference

**Complete API Documentation for Quantum Trading System**

---

## Table of Contents

1. [Encoders](#encoders)
2. [Models](#models)
3. [Strategies](#strategies)
4. [Data Fetchers](#data-fetchers)
5. [Backtesting](#backtesting)
6. [Visualization](#visualization)

---

## Encoders

### FibonacciEncoder

**Module**: `src.encoders.fibonacci_encoder`

Integer-only Fibonacci price encoder using OEIS A000045.

#### Class: `FibonacciEncoder`

```python
class FibonacciEncoder:
    def __init__(self, max_index: int = 50)
```

**Parameters**:
- `max_index` (int): Maximum Fibonacci index (default: 50)

#### Methods

##### `get_fibonacci(n: int) -> int`

Get nth Fibonacci number from OEIS A000045.

**Parameters**:
- `n` (int): Fibonacci index (0 to max_index)

**Returns**:
- `int`: F(n) from OEIS sequence

**Example**:
```python
encoder = FibonacciEncoder()
fib_10 = encoder.get_fibonacci(10)  # Returns 55
```

##### `encode_price(price_cents: int) -> int`

Encode price as Fibonacci index using binary search.

**Parameters**:
- `price_cents` (int): Price in cents (e.g., $123.45 = 12345)

**Returns**:
- `int`: Fibonacci index encoding

**Example**:
```python
index = encoder.encode_price(12345)  # Encodes $123.45
```

##### `decode_price(fib_index: int) -> int`

Decode Fibonacci index back to price.

**Parameters**:
- `fib_index` (int): Fibonacci sequence index

**Returns**:
- `int`: Price in cents

##### `calculate_retracements(high_cents: int, low_cents: int) -> Dict[str, int]`

Calculate Fibonacci retracement levels.

**Parameters**:
- `high_cents` (int): Swing high price in cents
- `low_cents` (int): Swing low price in cents

**Returns**:
- `Dict[str, int]`: Dictionary of retracement levels

**Keys**:
- `level_236`: 23.6% retracement
- `level_382`: 38.2% retracement
- `level_500`: 50.0% retracement
- `level_618`: 61.8% retracement (golden ratio)
- `level_786`: 78.6% retracement
- `level_1000`: 100% retracement
- `golden_pocket_high`: 50% level
- `golden_pocket_low`: 61.8% level

**Example**:
```python
retracements = encoder.calculate_retracements(15000, 10000)
golden_level = retracements['level_618']  # 61.8% retracement
```

##### `calculate_extensions(high_cents: int, low_cents: int) -> Dict[str, int]`

Calculate Fibonacci extension levels (profit targets).

**Parameters**:
- `high_cents` (int): Swing high price
- `low_cents` (int): Swing low price

**Returns**:
- `Dict[str, int]`: Extension levels

**Keys**:
- `ext_618`: 0.618 extension
- `ext_1000`: 1.0 extension
- `ext_1618`: 1.618 extension (golden extension)
- `ext_2618`: 2.618 extension

##### `find_support_resistance(price_cents: int, levels: int = 3) -> Tuple[List[int], List[int]]`

Find support and resistance levels at Fibonacci numbers.

**Parameters**:
- `price_cents` (int): Current price in cents
- `levels` (int): Number of levels to return (default: 3)

**Returns**:
- `Tuple[List[int], List[int]]`: (support_levels, resistance_levels)

---

### LucasEncoder

**Module**: `src.encoders.lucas_encoder`

Time interval encoder using Lucas numbers (OEIS A000032).

#### Class: `LucasEncoder`

```python
class LucasEncoder:
    def __init__(self, max_n: int = 50)
```

**Parameters**:
- `max_n` (int): Maximum Lucas number index

#### Methods

##### `get_lucas(n: int) -> int`

Get nth Lucas number.

**Parameters**:
- `n` (int): Index in Lucas sequence

**Returns**:
- `int`: L(n) as integer

**Example**:
```python
encoder = LucasEncoder()
lucas_5 = encoder.get_lucas(5)  # Returns 11
```

##### `encode_nash_exit_times(entry_timestamp: int, num_exits: int = 5) -> List[Dict]`

Generate Nash equilibrium exit timestamps using Lucas intervals.

**Parameters**:
- `entry_timestamp` (int): Entry time (Unix timestamp in seconds)
- `num_exits` (int): Number of exit points to generate

**Returns**:
- `List[Dict]`: List of exit dictionaries

**Dictionary keys**:
- `exit_index`: Exit number (1, 2, 3...)
- `lucas_index`: Lucas sequence index
- `lucas_days`: Days from entry
- `timestamp`: Exit timestamp
- `days_from_entry`: Total days

**Example**:
```python
from datetime import datetime
entry = int(datetime(2024, 1, 1).timestamp())
exits = encoder.encode_nash_exit_times(entry, num_exits=5)
```

---

## Models

### XiPsiModel

**Module**: `src.models.xi_psi`

Phase space dynamics model with Xi/Psi operators.

#### Class: `XiPsiModel`

```python
class XiPsiModel:
    def __init__(self, scale: int = 10000)
```

**Parameters**:
- `scale` (int): Scaling factor for integer arithmetic (default: 10000)

#### Methods

##### `compute_phase_point(price_series: List[int], time_index: int) -> PhasePoint`

Compute phase space point (ξ, ψ) at given time.

**Parameters**:
- `price_series` (List[int]): Historical prices (scaled)
- `time_index` (int): Current time index

**Returns**:
- `PhasePoint`: Phase space point with fields:
  - `xi` (int): Position
  - `psi` (int): Momentum
  - `time` (int): Lucas time
  - `coherence` (int): Quantum coherence (0-10000)
  - `state` (PhaseState): Market state

**Example**:
```python
from src.models.xi_psi import XiPsiModel, SCALE

model = XiPsiModel(scale=SCALE)
prices = [100*SCALE, 105*SCALE, 110*SCALE]
point = model.compute_phase_point(prices, time_index=2)
```

##### `evolve_phase_space(price_series: List[int], num_steps: int = 10) -> PhasePortrait`

Evolve phase space over Lucas time steps.

**Parameters**:
- `price_series` (List[int]): Price history
- `num_steps` (int): Number of time steps

**Returns**:
- `PhasePortrait`: Complete phase portrait with:
  - `points`: List of PhasePoint
  - `trajectories`: Phase space trajectories
  - `attractors`: Attractor locations
  - `coherence_map`: 2D coherence grid
  - `lucas_times`: Lucas time sequence

##### `nash_equilibrium_exit(current_price: int, entry_price: int, time_held: int) -> Tuple[bool, int]`

Determine Nash equilibrium exit point.

**Parameters**:
- `current_price` (int): Current price (scaled)
- `entry_price` (int): Entry price (scaled)
- `time_held` (int): Days held

**Returns**:
- `Tuple[bool, int]`: (should_exit, nearest_lucas_time)

---

### QFNN (Quantum Field Neural Network)

**Module**: `src.models.qfnn`

Integer-only neural network with quantum field operators.

#### Class: `QFNN`

```python
class QFNN:
    def __init__(self, input_dim: int = 10, hidden_dim: int = 20,
                 output_dim: int = 3, num_heads: int = 4, scale: int = 10000)
```

**Parameters**:
- `input_dim` (int): Input dimension
- `hidden_dim` (int): Hidden layer dimension
- `output_dim` (int): Output dimension
- `num_heads` (int): Number of attention heads
- `scale` (int): Integer scaling factor

#### Methods

##### `forward(x: np.ndarray) -> np.ndarray`

Forward pass through QFNN.

**Parameters**:
- `x` (np.ndarray): Input vector (scaled integers)

**Returns**:
- `np.ndarray`: Output vector

##### `train(X_train: List[np.ndarray], y_train: List[np.ndarray], epochs: int = 100, learning_rate: int = 100) -> List[int]`

Train QFNN on Fibonacci-encoded price data.

**Parameters**:
- `X_train` (List[np.ndarray]): Training inputs
- `y_train` (List[np.ndarray]): Training targets
- `epochs` (int): Number of epochs
- `learning_rate` (int): Learning rate (scaled by 1000)

**Returns**:
- `List[int]`: Loss values per epoch

##### `save_checkpoint(filepath: str) -> None`

Save model checkpoint to file.

##### `load_checkpoint(filepath: str) -> None`

Load model checkpoint from file.

---

## Strategies

### FibonacciRetracementStrategy

**Module**: `src.strategies.fibonacci_strategy`

Trading strategy using Fibonacci retracement levels.

#### Class: `FibonacciRetracementStrategy`

```python
class FibonacciRetracementStrategy:
    def __init__(self, max_position_cents: int = 1000000, scale: int = 1000)
```

**Parameters**:
- `max_position_cents` (int): Maximum position size in cents
- `scale` (int): Scaling factor for ratio calculations

#### Methods

##### `update_swing_points(high_cents: int, low_cents: int) -> None`

Update swing high/low points and recalculate retracement levels.

**Parameters**:
- `high_cents` (int): Recent swing high
- `low_cents` (int): Recent swing low

##### `check_entry_signal(current_price: int) -> Optional[Dict[str, any]]`

Check if current price provides a Fibonacci entry signal.

**Parameters**:
- `current_price` (int): Current market price in cents

**Returns**:
- `Optional[Dict]`: Signal dictionary if entry criteria met, None otherwise

**Signal Dictionary Keys**:
- `action`: 'BUY'
- `entry_price`: Entry price in cents
- `level`: Level name ('382_shallow', '500_midpoint', '618_golden_ratio', 'golden_pocket')
- `signal_strength`: 1-4 (higher is stronger)
- `position_size`: Position size in cents
- `stop_loss`: Stop loss price
- `take_profit_1`: First take profit target
- `take_profit_2`: Second take profit target
- `risk_reward_1`: Risk/reward ratio for TP1 (scaled by 1000)
- `risk_reward_2`: Risk/reward ratio for TP2 (scaled by 1000)

**Example**:
```python
strategy = FibonacciRetracementStrategy()
strategy.update_swing_points(15000, 10000)
signal = strategy.check_entry_signal(11910)  # Check at 61.8% level
if signal:
    print(f"Entry at {signal['level']} with strength {signal['signal_strength']}")
```

##### `check_exit_signal(current_price: int) -> Optional[Dict[str, any]]`

Check if current price triggers an exit.

**Parameters**:
- `current_price` (int): Current market price

**Returns**:
- `Optional[Dict]`: Exit signal if triggered

**Exit Signal Keys**:
- `action`: 'SELL'
- `exit_type`: 'STOP_LOSS', 'TAKE_PROFIT_1', or 'TAKE_PROFIT_2'
- `exit_price`: Exit price
- `pnl_cents`: Profit/loss in cents

##### `backtest_price_series(price_data: List[int], lookback_period: int = 20) -> Dict`

Backtest strategy on historical price data.

**Parameters**:
- `price_data` (List[int]): Historical prices
- `lookback_period` (int): Period for swing identification

**Returns**:
- `Dict`: Backtest results with metrics

---

## Data Fetchers

### FREDDataFetcher

**Module**: `src.data.fred_fetcher`

Fetch economic data from FRED API.

#### Class: `FREDDataFetcher`

```python
class FREDDataFetcher:
    def __init__(self, api_key: str, output_dir: str = 'src/data/fred_raw')
```

**Parameters**:
- `api_key` (str): FRED API key
- `output_dir` (str): Output directory for CSV files

#### Methods

##### `fetch_series(symbol: str, start_date: str = '2000-01-01') -> List[Dict]`

Fetch single FRED time series.

**Parameters**:
- `symbol` (str): FRED series symbol (e.g., 'UNRATE')
- `start_date` (str): Start date in YYYY-MM-DD format

**Returns**:
- `List[Dict]`: List of data points with keys:
  - `date`: ISO date string
  - `value_scaled`: Integer value (scaled)

**Example**:
```python
import os
fetcher = FREDDataFetcher(api_key=os.getenv('FRED_API_KEY'))
unemployment = fetcher.fetch_series('UNRATE', start_date='2020-01-01')
```

##### `fetch_all_indicators() -> Dict`

Fetch all 178 FRED-compatible indicators.

**Returns**:
- `Dict`: Summary statistics

##### `save_to_csv(data: List[Dict], symbol: str, metadata: Dict) -> None`

Save series data to CSV with metadata.

---

## Backtesting

### BacktestEngine

**Module**: `src.backtesting.backtest_engine`

Integer-only backtesting engine.

#### Class: `BacktestEngine`

```python
class BacktestEngine:
    def __init__(self, initial_capital_cents: int = 10000000,
                 commission_cents: int = 0,
                 commission_percent_scaled: int = 0,
                 slippage_cents: int = 0)
```

**Parameters**:
- `initial_capital_cents` (int): Starting capital
- `commission_cents` (int): Fixed commission per trade
- `commission_percent_scaled` (int): Commission percentage (scaled by 1000)
- `slippage_cents` (int): Slippage per trade

#### Methods

##### `run_backtest(price_data: List[int], strategy, strategy_name: str, lookback_period: int = 20) -> BacktestResult`

Run backtest on historical price data.

**Parameters**:
- `price_data` (List[int]): Prices in cents
- `strategy`: Strategy object with check_entry_signal/check_exit_signal methods
- `strategy_name` (str): Strategy name
- `lookback_period` (int): Lookback for swing calculation

**Returns**:
- `BacktestResult`: Comprehensive results

**BacktestResult Fields**:
- `total_trades` (int)
- `winning_trades` (int)
- `losing_trades` (int)
- `win_rate_scaled` (int): Win rate scaled by 1000
- `total_pnl_cents` (int)
- `gross_profit_cents` (int)
- `gross_loss_cents` (int)
- `sharpe_ratio_scaled` (int)
- `sortino_ratio_scaled` (int)
- `profit_factor_scaled` (int)
- `max_drawdown_cents` (int)
- `trades` (List[TradeLog])
- `equity_curve` (List[int])

**Example**:
```python
engine = BacktestEngine(initial_capital_cents=10000000)
result = engine.run_backtest(prices, strategy, "My Strategy")
print(f"Sharpe: {result.sharpe_ratio_scaled / 1000:.3f}")
```

##### `export_results(result: BacktestResult, output_path: str) -> None`

Export backtest results to JSON file.

---

### BacktestValidator

**Module**: `src.backtesting.backtest_validator`

Validate backtest integrity.

#### Class: `BacktestValidator`

```python
class BacktestValidator:
    def __init__(self)
```

#### Methods

##### `validate_backtest(backtest_result: BacktestResult, price_data: List[int], strategy, backtest_name: str) -> ValidationReport`

Validate backtest results.

**Parameters**:
- `backtest_result`: Results to validate
- `price_data`: Original price data
- `strategy`: Strategy used
- `backtest_name`: Name for report

**Returns**:
- `ValidationReport`: Validation report

**ValidationReport Fields**:
- `backtest_name` (str)
- `total_checks` (int)
- `passed_checks` (int)
- `failed_checks` (int)
- `warnings` (int)
- `critical_failures` (int)
- `overall_passed` (bool)
- `results` (List[ValidationResult])
- `summary` (str)

**Validation Checks**:
1. Integer-only operations
2. Look-ahead bias detection
3. Trade execution logic
4. Performance metrics accuracy
5. Signal timing
6. P&L calculations
7. Commission/slippage
8. Equity curve consistency
9. Price data integrity
10. Drawdown calculations

**Example**:
```python
validator = BacktestValidator()
report = validator.validate_backtest(result, prices, strategy, "Production")
if not report.overall_passed:
    print(f"Failed {report.critical_failures} checks")
```

---

## Visualization

### Dashboard

**Module**: `src.visualization.dashboard`

Create HTML dashboards with Plotly.

#### Function: `create_backtest_dashboard`

```python
def create_backtest_dashboard(result: BacktestResult, output_path: str) -> None
```

**Parameters**:
- `result`: Backtest result
- `output_path`: Output HTML file path

**Generates**:
- Equity curve chart
- Drawdown chart
- Trade distribution
- Performance metrics table

---

**End of API Reference**

For more details, see:
- [Mathematical Framework](MATHEMATICAL_FRAMEWORK.md)
- [Strategies Guide](STRATEGIES.md)
- [Quick Start](QUICK_START.md)

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25
