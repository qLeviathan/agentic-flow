# Fibonacci and Golden Ratio Trading Strategies

## Overview

Fibonacci retracement and extension levels, derived from the golden ratio (φ ≈ 1.618), provide mathematical frameworks for identifying support/resistance levels and optimal entry/exit points in trading.

---

## The Golden Ratio (φ)

### Mathematical Foundation

```
φ = (1 + √5) / 2 ≈ 1.618033988749...

Key relationships:
φ - 1 = 1/φ ≈ 0.618
φ² = φ + 1 ≈ 2.618
1/φ = φ - 1 ≈ 0.618
```

### Integer Representation

For integer-only calculations, use rational approximations:

```
φ ≈ 1618 / 1000  (accurate to 3 decimal places)
φ ≈ 161803 / 100000  (accurate to 5 decimal places)

Alternative: Use Fibonacci ratio approximations
F(n+1) / F(n) → φ as n → ∞

F(13)/F(12) = 233/144 = 1.618055556...
F(14)/F(13) = 377/233 = 1.618025751...
F(20)/F(19) = 6765/4181 = 1.618033963...  (accurate to 6 decimals)
```

---

## Fibonacci Retracement Levels

### Standard Levels

**Primary levels derived from golden ratio:**
- **23.6%** = 1 - φ^(-2) ≈ 1 - 0.382 = 0.618... (actually derived differently)
- **38.2%** = 1 - 1/φ = 1 - 0.618... ≈ 0.382
- **50.0%** = Simple midpoint (not Fibonacci-derived, but widely used)
- **61.8%** = 1/φ ≈ 0.618 (**GOLDEN RETRACEMENT**)
- **78.6%** = √(1/φ) ≈ 0.786

### The Golden Zone/Golden Pocket

**Definition:** The area between 50% and 61.8% retracement levels.

**Significance:**
- Most powerful reversal zone
- Highest probability for trend continuation after pullback
- Nicknamed "golden pocket" due to trading success rate
- Combines harmonic proportion with psychological 50% level

**Trading Application:**
In an uptrend:
1. Identify swing low and swing high
2. Wait for price to retrace into golden zone (50-61.8%)
3. Look for reversal signals (candlestick patterns, volume)
4. Enter long position with stop below 78.6% level
5. Target previous high or Fibonacci extension levels

---

## Integer-Only Implementation

### Price Level Calculation

```python
# Calculate Fibonacci retracement levels using integer arithmetic

def calculate_fibonacci_levels_integer(high, low, scale=100000):
    """
    Calculate Fibonacci levels using integer-only arithmetic.
    Prices are pre-scaled (e.g., $123.45 → 12345000)

    Args:
        high: Highest price (integer, pre-scaled)
        low: Lowest price (integer, pre-scaled)
        scale: Scaling factor for calculations

    Returns:
        Dictionary of Fibonacci levels (integers)
    """

    price_range = high - low

    # Fibonacci ratios as integers (scaled by 100000)
    FIB_236 = 23600   # 23.6%
    FIB_382 = 38200   # 38.2%
    FIB_500 = 50000   # 50.0%
    FIB_618 = 61800   # 61.8% (GOLDEN RATIO)
    FIB_786 = 78600   # 78.6%

    # Calculate levels using integer arithmetic
    # Formula: level = high - (range × fib_ratio / scale)

    levels = {
        'level_236': high - (price_range * FIB_236) // scale,
        'level_382': high - (price_range * FIB_382) // scale,
        'level_500': high - (price_range * FIB_500) // scale,
        'level_618': high - (price_range * FIB_618) // scale,  # Golden ratio
        'level_786': high - (price_range * FIB_786) // scale,
        'golden_pocket_high': high - (price_range * FIB_500) // scale,
        'golden_pocket_low': high - (price_range * FIB_618) // scale
    }

    return levels

# Example usage:
# Price swing: $100.00 to $150.00
# Scaled representation (cents): 10000 to 15000
high_price = 15000  # $150.00 in cents
low_price = 10000   # $100.00 in cents

levels = calculate_fibonacci_levels_integer(high_price, low_price, 100000)

# Results (in cents):
# level_618 = 15000 - (5000 × 61800 / 100000) = 15000 - 3090 = 11910 ($119.10)
# golden_pocket range: $125.00 to $119.10
```

### Fibonacci Extensions (Targets)

```python
def calculate_fibonacci_extensions_integer(high, low, retracement_low, scale=100000):
    """
    Calculate Fibonacci extension levels for profit targets.
    Used after a retracement to project future price targets.
    """

    price_range = high - low
    extension_base = high  # For uptrend

    # Extension ratios
    EXT_618 = 61800   # 0.618 × range
    EXT_1000 = 100000  # 1.0 × range (100%)
    EXT_1618 = 161800  # 1.618 × range (GOLDEN EXTENSION)
    EXT_2618 = 261800  # 2.618 × range

    extensions = {
        'ext_618': extension_base + (price_range * EXT_618) // scale,
        'ext_1000': extension_base + (price_range * EXT_1000) // scale,
        'ext_1618': extension_base + (price_range * EXT_1618) // scale,  # Primary target
        'ext_2618': extension_base + (price_range * EXT_2618) // scale
    }

    return extensions
```

---

## Advanced: Zeckendorf Representation for Price Encoding

### Concept

Represent prices using sums of non-consecutive Fibonacci numbers (Zeckendorf's theorem).

**Advantages:**
- Compact bit representation
- Natural compression using Fibonacci base
- Efficient for price level comparisons
- Aligns with Fibonacci-based trading philosophy

### Implementation

```python
# Fibonacci numbers for Zeckendorf representation
FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597,
             2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]

def price_to_zeckendorf(price_scaled):
    """
    Convert integer price to Zeckendorf representation.
    Returns list of Fibonacci numbers that sum to price.
    """
    result = []
    remaining = price_scaled

    # Greedy algorithm: use largest Fibonacci numbers first
    for fib in reversed(FIBONACCI):
        if fib <= remaining:
            result.append(fib)
            remaining -= fib
            if remaining == 0:
                break

    return result

def zeckendorf_to_price(zeck_list):
    """Convert Zeckendorf representation back to integer price."""
    return sum(zeck_list)

# Example:
# Price $123.45 → 12345 (in cents)
# Zeckendorf: 10946 + 987 + 377 + 34 + 1 = 12345
# Binary-like representation: [1,0,0,1,0,0,1,0,1,0,0,0,0,0,0,1]
```

### Price Comparison in Zeckendorf Space

```python
def is_at_fibonacci_level(current_price, target_level, tolerance=1):
    """
    Check if current price is at a Fibonacci level.
    More efficient in Zeckendorf representation.

    Args:
        current_price: Current price (Zeckendorf list)
        target_level: Target Fibonacci level (Zeckendorf list)
        tolerance: Allowed difference (integer)

    Returns:
        Boolean indicating if at level
    """
    current_value = sum(current_price)
    target_value = sum(target_level)

    return abs(current_value - target_value) <= tolerance
```

---

## Trading Strategies Using Golden Ratio

### 1. Golden Retracement Entry

**Setup:**
- Strong trend (uptrend or downtrend)
- Clear swing high and swing low
- Price begins retracement

**Entry Signal:**
1. Price enters golden zone (50-61.8% retracement)
2. Bullish reversal pattern forms (in uptrend)
3. Volume confirmation
4. Other indicators align (RSI oversold, MACD divergence)

**Position Management:**
- Entry: Within golden pocket zone
- Stop Loss: Below 78.6% level
- First Target: Previous swing high
- Second Target: 1.618 extension level

**Integer Calculation:**
```python
# Entry zone
golden_high = level_500  # 50% level
golden_low = level_618   # 61.8% level

# Check if current price in zone
if golden_low <= current_price <= golden_high:
    # Confirm with additional signals
    if has_reversal_pattern and volume_increasing:
        enter_position()
```

### 2. Golden Extension Targets

**Use Case:** Profit targets after successful retracement entry

**Target Levels:**
- **0.618 Extension:** Conservative target (61.8% of original move)
- **1.0 Extension:** Full extension (100% projection)
- **1.618 Extension:** Golden extension (PRIMARY TARGET)
- **2.618 Extension:** Extended target (high probability reversal)

**Risk-Reward Optimization:**
```python
# Calculate risk-reward using integer arithmetic
entry_price = 12000  # $120.00
stop_loss = 11500    # $115.00 (below 78.6%)
target_1618 = 15500  # $155.00 (1.618 extension)

risk = entry_price - stop_loss  # 500 ($5.00)
reward = target_1618 - entry_price  # 3500 ($35.00)

# Risk-reward ratio (scaled by 100)
rr_ratio = (reward * 100) // risk  # = 700, meaning 7:1 ratio
```

### 3. Multiple Timeframe Fibonacci

**Concept:** Confluence of Fibonacci levels across multiple timeframes increases probability.

**Implementation:**
1. Calculate Fibonacci levels on daily chart
2. Calculate Fibonacci levels on 4-hour chart
3. Calculate Fibonacci levels on 1-hour chart
4. Identify zones where multiple timeframe levels overlap

```python
def find_fibonacci_confluence(tf1_levels, tf2_levels, tf3_levels, tolerance=50):
    """
    Find price zones where Fibonacci levels from multiple timeframes converge.

    Args:
        tf1_levels, tf2_levels, tf3_levels: Dict of levels from different timeframes
        tolerance: Price difference tolerance (in scaled units)

    Returns:
        List of confluence zones
    """
    confluence_zones = []

    all_levels = []
    for levels in [tf1_levels, tf2_levels, tf3_levels]:
        all_levels.extend(levels.values())

    # Sort all levels
    all_levels.sort()

    # Find clusters
    i = 0
    while i < len(all_levels):
        cluster = [all_levels[i]]
        j = i + 1

        while j < len(all_levels) and all_levels[j] - all_levels[i] <= tolerance:
            cluster.append(all_levels[j])
            j += 1

        if len(cluster) >= 2:  # At least 2 levels converge
            avg_level = sum(cluster) // len(cluster)
            confluence_zones.append({
                'price': avg_level,
                'strength': len(cluster)
            })

        i = j

    return confluence_zones
```

---

## Mathematical Proof: Why φ = 1.618 Works

### Fibonacci Sequence Convergence

```
F(n) = F(n-1) + F(n-2)

Sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...

Ratios:
F(2)/F(1) = 1/1 = 1.000000
F(3)/F(2) = 2/1 = 2.000000
F(4)/F(3) = 3/2 = 1.500000
F(5)/F(4) = 5/3 = 1.666667
F(6)/F(5) = 8/5 = 1.600000
F(7)/F(6) = 13/8 = 1.625000
F(8)/F(7) = 21/13 = 1.615385
...
F(20)/F(19) = 6765/4181 = 1.618034  ← Converges to φ
```

### Why Markets Respect φ

**Hypotheses:**
1. **Self-similarity:** Markets exhibit fractal patterns; φ appears in natural fractals
2. **Behavioral:** Traders collectively trade these levels, creating self-fulfilling prophecy
3. **Mathematical harmony:** φ represents optimal balance between extremes
4. **Pattern recognition:** Human psychology naturally recognizes golden ratio proportions

---

## Practical Trading Rules

### Entry Criteria (All must be true)

1. ✓ Price in golden zone (50-61.8% retracement)
2. ✓ Trend direction confirmed (higher timeframe)
3. ✓ Reversal pattern present
4. ✓ Volume confirmation
5. ✓ Risk-reward ratio ≥ 3:1
6. ✓ No major resistance overhead (in uptrend)

### Exit Criteria

**Profit Taking:**
- 50% position at 1.0 extension
- 30% position at 1.618 extension
- 20% position at 2.618 extension (runner)

**Stop Loss Management:**
- Initial: Below 78.6% retracement
- After price reaches 1.0 extension: Move to breakeven
- After 1.618 hit: Trail with 38.2% of current swing

---

## Performance Expectations

**Based on Research:**
- Golden zone (50-61.8%) provides highest probability reversal area
- Combining Fibonacci with other indicators significantly improves win rate
- Best performance in trending markets with clear swing structure
- 61.8% level (golden ratio) most reliable single level
- Multiple timeframe confluence increases probability by ~25-40%

---

## Sources

- [Fibonacci Retracements Explained | LuxAlgo](https://www.luxalgo.com/blog/fibonacci-retracements-and-explained/)
- [Fibonacci Retracement Settings: The Golden Zone | Mind Math Money](https://www.mindmathmoney.com/articles/fibonacci-tradingview-settings-the-golden-zone)
- [What is Fibonacci Retracement? | ATFX](https://www.atfx.com/en/analysis/trading-strategies/fibonacci-retracement)
- [Fibonacci Trading Strategy | Dukascopy Bank](https://www.dukascopy.com/swiss/english/marketwatch/articles/fibonacci-trading-strategy/)
- [What is the Golden Ratio and How to Use the Golden Pocket | OSL](https://www.osl.com/hk-en/academy/article/what-is-the-golden-ratio-and-how-to-use-the-golden-pocket)
- [Stock Market Analysis, Phi and the Fibonacci Sequence](https://www.goldennumber.net/fibonacci-stock-market-analysis/)
- [The Golden Ratio In Forex Trading | HedgeThink](https://www.hedgethink.com/the-golden-ratio-in-forex-trading-a-comprehensive-guide/)
