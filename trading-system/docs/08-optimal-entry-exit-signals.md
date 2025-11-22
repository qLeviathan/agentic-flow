# Optimal Entry and Exit Signals - Mathematical Formulations

## Overview

Mathematical frameworks for determining optimal entry and exit points in trading, with focus on integer-only implementations and rigorous quantitative approaches.

---

## Optimal Stopping Theory

### Mathematical Foundation

**Problem:** Determine optimal time τ* to enter or exit a position to maximize expected value.

**Framework:**
```
Optimal stopping time τ* = arg max E[V(τ)]

where:
V(τ) = Value function at time τ
E[·] = Expected value operator
τ ∈ {0, 1, 2, ..., T} for discrete time
```

### Sequential Optimal Stopping

**From Research:** Recent approaches formulate sequences of optimal stopping problems to identify advantageous moments for market entry and exit.

**Implementation:**
```python
class OptimalStoppingEntry:
    """
    Optimal entry/exit using sequential stopping framework.
    Integer-only arithmetic.
    """

    SCALE = 1_000_000

    def __init__(self, max_wait_periods=100):
        """
        Args:
            max_wait_periods: Maximum periods to wait for entry
        """
        self.max_wait_periods = max_wait_periods
        self.value_function = [0] * (max_wait_periods + 1)

    def calculate_value_function(self, expected_returns, entry_cost,
                                   discount_factor=995_000):  # 0.995 discount
        """
        Calculate value function using backward induction.

        Args:
            expected_returns: List of expected returns at each period (scaled)
            entry_cost: Cost to enter position (scaled)
            discount_factor: Time discount factor (scaled by SCALE)

        Returns:
            Value function array
        """
        T = min(len(expected_returns), self.max_wait_periods)

        # Backward induction from T to 0
        for t in range(T - 1, -1, -1):
            # Value of entering now
            enter_value = expected_returns[t] - entry_cost

            # Value of waiting (discounted future value)
            if t < T - 1:
                wait_value = (self.value_function[t + 1] * discount_factor) // self.SCALE
            else:
                wait_value = 0

            # Optimal: max(enter, wait)
            self.value_function[t] = max(enter_value, wait_value)

        return self.value_function

    def get_optimal_entry_time(self, expected_returns, entry_cost,
                                 discount_factor=995_000):
        """
        Determine optimal entry time.

        Args:
            expected_returns: Expected returns at each period (scaled)
            entry_cost: Entry cost (scaled)
            discount_factor: Discount factor (scaled)

        Returns:
            Optimal entry period (0-indexed)
        """
        self.calculate_value_function(expected_returns, entry_cost, discount_factor)

        # Find first period where entering is better than waiting
        for t in range(len(self.value_function) - 1):
            enter_value = expected_returns[t] - entry_cost

            if t < len(self.value_function) - 1:
                wait_value = (self.value_function[t + 1] * discount_factor) // self.SCALE
            else:
                wait_value = 0

            if enter_value >= wait_value:
                return t

        return 0  # Enter immediately if no better time found

# Example:
entry_optimizer = OptimalStoppingEntry(max_wait_periods=50)

# Expected returns for next 50 periods (scaled by 1_000_000)
# Assume mean-reverting: low now, increasing then decreasing
expected_returns = [50_000] * 10 + [100_000] * 10 + [150_000] * 10 + \
                   [100_000] * 10 + [50_000] * 10

entry_cost = 20_000  # 2% entry cost

optimal_time = entry_optimizer.get_optimal_entry_time(expected_returns, entry_cost)
print(f"Optimal entry time: Period {optimal_time}")
print(f"Expected return at that time: {expected_returns[optimal_time]/10_000:.2f}%")
```

---

## Mean Reversion Entry/Exit

### Mathematical Model

**Ornstein-Uhlenbeck Process:**
```
dX_t = θ(μ - X_t)dt + σdW_t

where:
θ = Mean reversion speed
μ = Long-term mean
σ = Volatility
X_t = Price at time t
```

**Optimal Entry/Exit Levels:**
From research on mean-reverting prices:
- **Entry trigger** exceeds variable cost plus interest on entry cost
- **Exit trigger** is less than variable cost minus interest on exit cost
- Creates "hysteresis" effect

### Integer Implementation

```python
class MeanReversionOptimal:
    """
    Optimal entry/exit for mean-reverting assets.
    Integer-only arithmetic.
    """

    SCALE = 1_000_000

    def __init__(self):
        self.mean_price = None
        self.reversion_speed = None
        self.volatility = None

    def estimate_parameters(self, price_history):
        """
        Estimate mean reversion parameters from price history.

        Args:
            price_history: List of historical prices (scaled)

        Returns:
            (mean, reversion_speed, volatility) all scaled
        """
        n = len(price_history)

        # Calculate mean
        mean_sum = sum(price_history)
        mean = mean_sum // n

        # Calculate variance
        var_sum = 0
        for price in price_history:
            diff = price - mean
            var_sum += (diff * diff) // self.SCALE

        variance = var_sum // n

        # Estimate reversion speed using lag-1 autocorrelation
        # θ ≈ -ln(ρ) where ρ is autocorrelation
        # Simplified: assume θ = 0.1 for daily data (scaled = 100_000)
        reversion_speed = 100_000  # 0.1 scaled

        # Volatility = sqrt(variance)
        # Use integer sqrt approximation
        volatility = self._integer_sqrt(variance)

        self.mean_price = mean
        self.reversion_speed = reversion_speed
        self.volatility = volatility

        return (mean, reversion_speed, volatility)

    def _integer_sqrt(self, n):
        """Integer square root using Newton's method."""
        if n == 0:
            return 0

        x = n
        y = (x + 1) // 2

        while y < x:
            x = y
            y = (x + n // x) // 2

        return x

    def calculate_entry_threshold(self, mean, volatility, num_std=2):
        """
        Calculate entry threshold (mean ± N standard deviations).

        Args:
            mean: Mean price (scaled)
            volatility: Volatility (scaled)
            num_std: Number of standard deviations

        Returns:
            (upper_threshold, lower_threshold) for short/long entry
        """
        # Upper threshold = mean + num_std × volatility
        upper = mean + num_std * volatility

        # Lower threshold = mean - num_std × volatility
        lower = mean - num_std * volatility

        return (upper, lower)

    def calculate_exit_threshold(self, mean, volatility, num_std=0):
        """
        Calculate exit threshold (typically at mean or slightly beyond).

        Args:
            mean: Mean price (scaled)
            volatility: Volatility (scaled)
            num_std: Standard deviations from mean for exit

        Returns:
            (upper_exit, lower_exit)
        """
        upper = mean + num_std * volatility
        lower = mean - num_std * volatility

        return (upper, lower)

    def get_entry_signal(self, current_price, mean, upper_thresh, lower_thresh):
        """
        Generate entry signal based on current price.

        Args:
            current_price: Current price (scaled)
            mean: Mean price (scaled)
            upper_thresh: Upper entry threshold (scaled)
            lower_thresh: Lower entry threshold (scaled)

        Returns:
            Signal: 1 (long), -1 (short), 0 (no signal)
        """
        if current_price <= lower_thresh:
            return 1  # Long (price below mean)
        elif current_price >= upper_thresh:
            return -1  # Short (price above mean)
        else:
            return 0  # No signal

    def get_exit_signal(self, current_price, position, upper_exit, lower_exit):
        """
        Generate exit signal for existing position.

        Args:
            current_price: Current price (scaled)
            position: Current position (1=long, -1=short)
            upper_exit: Upper exit threshold (scaled)
            lower_exit: Lower exit threshold (scaled)

        Returns:
            Boolean: True if should exit
        """
        if position == 1:  # Long position
            # Exit if price returns to mean or above
            return current_price >= lower_exit
        elif position == -1:  # Short position
            # Exit if price returns to mean or below
            return current_price <= upper_exit
        else:
            return False

# Example:
mr_optimizer = MeanReversionOptimal()

# Price history (mean-reverting around 10000 = $100.00)
import random
random.seed(42)

mean_price = 10_000_000  # $100.00 scaled
prices = []
price = mean_price

for i in range(100):
    # Simulate mean reversion
    reversion = (mean_price - price) // 10  # 10% reversion per period
    noise = random.randint(-200_000, 200_000)
    price = price + reversion + noise
    prices.append(price)

# Estimate parameters
mean, theta, vol = mr_optimizer.estimate_parameters(prices)
print(f"Estimated mean: ${mean/1_000_000:.2f}")
print(f"Estimated volatility: ${vol/1_000_000:.2f}")

# Calculate thresholds
upper_entry, lower_entry = mr_optimizer.calculate_entry_threshold(mean, vol, num_std=2)
upper_exit, lower_exit = mr_optimizer.calculate_exit_threshold(mean, vol, num_std=0)

print(f"\nEntry thresholds:")
print(f"  Long below: ${lower_entry/1_000_000:.2f}")
print(f"  Short above: ${upper_entry/1_000_000:.2f}")

print(f"\nExit at mean: ${mean/1_000_000:.2f}")

# Current price
current = prices[-1]
signal = mr_optimizer.get_entry_signal(current, mean, upper_entry, lower_entry)

signals = {1: "LONG", -1: "SHORT", 0: "NO ENTRY"}
print(f"\nCurrent price: ${current/1_000_000:.2f}")
print(f"Signal: {signals[signal]}")
```

---

## Statistical Arbitrage Entry/Exit

### Pairs Trading Framework

**Concept:** Trade the spread between two cointegrated assets.

**Entry:** When spread exceeds 2-3 standard deviations
**Exit:** When spread returns to mean

```python
class PairsTradingOptimal:
    """
    Optimal entry/exit for pairs trading.
    Integer-only arithmetic.
    """

    SCALE = 1_000_000

    def __init__(self):
        self.spread_mean = None
        self.spread_std = None

    def calculate_spread(self, price_a, price_b, hedge_ratio=1_000_000):
        """
        Calculate spread between two assets.

        Args:
            price_a: Price of asset A (scaled)
            price_b: Price of asset B (scaled)
            hedge_ratio: Hedge ratio (scaled by SCALE, default 1.0)

        Returns:
            Spread (scaled)
        """
        # Spread = price_a - hedge_ratio × price_b / SCALE
        spread = price_a - (hedge_ratio * price_b) // self.SCALE

        return spread

    def estimate_spread_parameters(self, spread_history):
        """
        Estimate spread mean and standard deviation.

        Args:
            spread_history: List of historical spreads (scaled)

        Returns:
            (mean, std_dev) both scaled
        """
        n = len(spread_history)

        # Mean
        mean_sum = sum(spread_history)
        mean = mean_sum // n

        # Standard deviation
        var_sum = 0
        for spread in spread_history:
            diff = spread - mean
            var_sum += (diff * diff) // self.SCALE

        variance = var_sum // n

        # Integer sqrt
        std_dev = self._integer_sqrt(variance)

        self.spread_mean = mean
        self.spread_std = std_dev

        return (mean, std_dev)

    def _integer_sqrt(self, n):
        """Integer square root."""
        if n == 0:
            return 0

        x = n
        y = (x + 1) // 2

        while y < x:
            x = y
            y = (x + n // x) // 2

        return x

    def get_pairs_signal(self, current_spread, entry_threshold=2,
                          exit_threshold=0):
        """
        Generate pairs trading signal.

        Args:
            current_spread: Current spread value (scaled)
            entry_threshold: Entry at N standard deviations
            exit_threshold: Exit at N standard deviations from mean

        Returns:
            (entry_signal, exit_signal)
            entry_signal: 1 (long spread), -1 (short spread), 0 (no entry)
            exit_signal: True if should exit
        """
        if self.spread_mean is None or self.spread_std is None:
            return (0, False)

        # Z-score = (spread - mean) / std
        # Scaled: z_score = ((spread - mean) × SCALE) / std
        z_score_numerator = (current_spread - self.spread_mean) * self.SCALE
        z_score = z_score_numerator // self.spread_std

        # Entry signals
        entry_signal = 0
        if z_score <= -entry_threshold * self.SCALE:
            entry_signal = 1  # Long spread (buy A, sell B)
        elif z_score >= entry_threshold * self.SCALE:
            entry_signal = -1  # Short spread (sell A, buy B)

        # Exit signal (spread returns to mean ± threshold)
        exit_signal = False
        if abs(z_score) <= exit_threshold * self.SCALE:
            exit_signal = True

        return (entry_signal, exit_signal)

    def calculate_position_sizes(self, entry_signal, capital, price_a, price_b,
                                   hedge_ratio=1_000_000):
        """
        Calculate position sizes for pairs trade.

        Args:
            entry_signal: 1 (long spread) or -1 (short spread)
            capital: Capital to allocate (cents)
            price_a: Current price of asset A (cents)
            price_b: Current price of asset B (cents)
            hedge_ratio: Hedge ratio (scaled)

        Returns:
            (shares_a, shares_b)
        """
        if entry_signal == 0:
            return (0, 0)

        # Split capital equally between two legs
        capital_per_leg = capital // 2

        if entry_signal == 1:  # Long spread: buy A, sell B
            shares_a = capital_per_leg // price_a
            # Hedge: shares_b = shares_a × hedge_ratio / SCALE
            shares_b = -(shares_a * hedge_ratio) // self.SCALE
        else:  # Short spread: sell A, buy B
            shares_a = -(capital_per_leg // price_a)
            shares_b = (-shares_a * hedge_ratio) // self.SCALE

        return (shares_a, shares_b)

# Example:
pairs_trader = PairsTradingOptimal()

# Simulate cointegrated pair
random.seed(42)

price_a_history = []
price_b_history = []
spread_history = []

price_a = 10_000_000  # $100.00
price_b = 10_000_000  # $100.00

for i in range(100):
    # Common factor
    common = random.randint(-50_000, 50_000)

    # Individual noise
    noise_a = random.randint(-30_000, 30_000)
    noise_b = random.randint(-30_000, 30_000)

    price_a = price_a + common + noise_a
    price_b = price_b + common + noise_b

    price_a_history.append(price_a)
    price_b_history.append(price_b)

    spread = pairs_trader.calculate_spread(price_a, price_b)
    spread_history.append(spread)

# Estimate spread parameters
mean, std = pairs_trader.estimate_spread_parameters(spread_history)
print(f"Spread mean: ${mean/1_000_000:.2f}")
print(f"Spread std: ${std/1_000_000:.2f}")

# Current prices
current_price_a = price_a_history[-1]
current_price_b = price_b_history[-1]
current_spread = spread_history[-1]

print(f"\nCurrent prices:")
print(f"  Asset A: ${current_price_a/1_000_000:.2f}")
print(f"  Asset B: ${current_price_b/1_000_000:.2f}")
print(f"  Spread: ${current_spread/1_000_000:.2f}")

# Get signal
entry_sig, exit_sig = pairs_trader.get_pairs_signal(current_spread,
                                                      entry_threshold=2,
                                                      exit_threshold=0)

signals = {1: "LONG SPREAD (Buy A, Sell B)",
           -1: "SHORT SPREAD (Sell A, Buy B)",
           0: "NO ENTRY"}

print(f"\nSignal: {signals[entry_sig]}")
print(f"Exit signal: {exit_sig}")

# Position sizes
if entry_sig != 0:
    capital = 10_000_00  # $10,000
    shares_a, shares_b = pairs_trader.calculate_position_sizes(
        entry_sig, capital, current_price_a, current_price_b
    )

    print(f"\nPosition sizes for $10,000 capital:")
    print(f"  Asset A: {shares_a} shares")
    print(f"  Asset B: {shares_b} shares")
```

---

## Breakout Entry Optimization

### Donchian Channel Breakout

```python
class BreakoutOptimal:
    """
    Optimal breakout entry using Donchian channels.
    Integer-only arithmetic.
    """

    def __init__(self, lookback_period=20):
        """
        Args:
            lookback_period: Periods for high/low calculation
        """
        self.lookback_period = lookback_period
        self.price_history = []

    def add_price(self, high, low, close):
        """
        Add price bar to history.

        Args:
            high, low, close: Prices (scaled integers)
        """
        self.price_history.append({
            'high': high,
            'low': low,
            'close': close
        })

        # Keep only lookback + 1 periods
        if len(self.price_history) > self.lookback_period + 1:
            self.price_history.pop(0)

    def calculate_donchian_levels(self):
        """
        Calculate Donchian channel high/low.

        Returns:
            (channel_high, channel_low)
        """
        if len(self.price_history) < self.lookback_period:
            return (None, None)

        # Get last lookback_period bars (excluding current)
        lookback_bars = self.price_history[:-1][-self.lookback_period:]

        channel_high = max(bar['high'] for bar in lookback_bars)
        channel_low = min(bar['low'] for bar in lookback_bars)

        return (channel_high, channel_low)

    def get_breakout_signal(self, current_close, atr_value=None,
                             min_atr_multiple=1):
        """
        Generate breakout signal with volatility filter.

        Args:
            current_close: Current closing price (scaled)
            atr_value: Average True Range (optional, for filtering)
            min_atr_multiple: Minimum breakout size as multiple of ATR

        Returns:
            Signal: 1 (long breakout), -1 (short breakout), 0 (no signal)
        """
        channel_high, channel_low = self.calculate_donchian_levels()

        if channel_high is None or channel_low is None:
            return 0

        # Breakout above channel high
        if current_close > channel_high:
            # Optional: filter by ATR
            if atr_value is not None:
                breakout_size = current_close - channel_high
                if breakout_size < atr_value * min_atr_multiple:
                    return 0  # Breakout too small

            return 1  # Long

        # Breakdown below channel low
        elif current_close < channel_low:
            # Optional: filter by ATR
            if atr_value is not None:
                breakout_size = channel_low - current_close
                if breakout_size < atr_value * min_atr_multiple:
                    return 0  # Breakout too small

            return -1  # Short

        else:
            return 0  # No breakout

    def calculate_breakout_target(self, entry_price, channel_high, channel_low):
        """
        Calculate profit target based on channel width.

        Args:
            entry_price: Entry price (scaled)
            channel_high: Channel high (scaled)
            channel_low: Channel low (scaled)

        Returns:
            Target price (scaled)
        """
        channel_width = channel_high - channel_low

        # Target = entry + channel_width (for long)
        # or entry - channel_width (for short)

        if entry_price > channel_high:  # Long breakout
            target = entry_price + channel_width
        else:  # Short breakout
            target = entry_price - channel_width

        return target

# Example:
breakout_trader = BreakoutOptimal(lookback_period=20)

# Simulate consolidation then breakout
for i in range(25):
    if i < 20:
        # Consolidation: range-bound
        high = 10_200_000 + random.randint(-50_000, 50_000)
        low = 9_800_000 + random.randint(-50_000, 50_000)
        close = (high + low) // 2
    else:
        # Breakout: trending up
        high = 10_200_000 + (i - 19) * 100_000
        low = high - 200_000
        close = high - 50_000

    breakout_trader.add_price(high, low, close)

# Check for breakout
channel_high, channel_low = breakout_trader.calculate_donchian_levels()
current_close = breakout_trader.price_history[-1]['close']

print(f"Donchian Channel:")
print(f"  High: ${channel_high/1_000_000:.2f}")
print(f"  Low: ${channel_low/1_000_000:.2f}")
print(f"Current close: ${current_close/1_000_000:.2f}")

signal = breakout_trader.get_breakout_signal(current_close)

signals = {1: "LONG BREAKOUT", -1: "SHORT BREAKDOWN", 0: "NO SIGNAL"}
print(f"\nSignal: {signals[signal]}")

if signal != 0:
    target = breakout_trader.calculate_breakout_target(
        current_close, channel_high, channel_low
    )
    print(f"Target price: ${target/1_000_000:.2f}")
```

---

## Multi-Signal Confluence

### Combining Multiple Entry Signals

```python
def calculate_multi_signal_score(signals_dict, weights_dict):
    """
    Combine multiple entry signals with weights.

    Args:
        signals_dict: Dict of signals {name: signal_value}
                     signal_value in range [-100, +100]
        weights_dict: Dict of weights {name: weight}
                     weights should sum to 1000

    Returns:
        Composite score (scaled by 10)
    """
    SCALE = 1000

    composite = 0

    for signal_name, signal_value in signals_dict.items():
        if signal_name in weights_dict:
            weight = weights_dict[signal_name]
            weighted_signal = (signal_value * weight) // SCALE
            composite += weighted_signal

    return composite

# Example: Combine multiple entry signals
signals = {
    'fibonacci_level': 80,      # At 61.8% golden zone
    'lucas_time': 60,           # At Lucas time window
    'mean_reversion': 70,       # 2 std below mean
    'momentum': -20,            # Negative momentum (contrarian)
    'volume': 50                # Above average volume
}

weights = {
    'fibonacci_level': 300,     # 30%
    'lucas_time': 200,          # 20%
    'mean_reversion': 250,      # 25%
    'momentum': 100,            # 10%
    'volume': 150               # 15%
}

composite_score = calculate_multi_signal_score(signals, weights)
print(f"Composite entry score: {composite_score/10}")

# Entry threshold
ENTRY_THRESHOLD = 500  # 50 scaled by 10

if composite_score >= ENTRY_THRESHOLD:
    print("STRONG ENTRY SIGNAL - ENTER POSITION")
else:
    print("Weak signal - wait for better setup")
```

---

## Sources

- [Optimal Entry and Exit Decisions Under Uncertainty | Operations Research Forum](https://link.springer.com/article/10.1007/s43069-022-00161-9)
- [Optimal Entry and Exit with Signature in Statistical Arbitrage (arXiv)](https://arxiv.org/html/2309.16008v4)
- [Pairs Trading with Optimized Positions & Exit Rules | Towards Data Science](https://towardsdatascience.com/pairs-trading-with-optimized-positions-exit-rules-811fa0c6be91/)
- [Entry and Exit Decisions under Uncertainty | Journal of Political Economy](https://www.journals.uchicago.edu/doi/abs/10.1086/261619)
- [Ultimate Insights on Entry-Exit Models in Economic Theory](https://www.numberanalytics.com/blog/ultimate-insights-entry-exit-economic-theory)
- [Deep Dive into Entry-Exit Dynamics in Global Markets](https://www.numberanalytics.com/blog/deep-dive-entry-exit-dynamics-global-markets)
