# Lucas Sequence Time Analysis for Trading

## Overview

Lucas sequences provide mathematical frameworks for time-based analysis in trading, identifying market cycles, timing reversals, and predicting temporal symmetries in price movements.

---

## Lucas Sequence Definition

### Mathematical Foundation

```
L(0) = 2
L(1) = 1
L(n) = L(n-1) + L(n-2)

Sequence: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, ...
```

### Relationship to Fibonacci and Golden Ratio

**Key Properties:**
```
L(n) = F(n-1) + F(n+1)

where F(n) is the nth Fibonacci number

As n → ∞:
L(n+1) / L(n) → φ = 1.618... (golden ratio)

Binet's Formula for Lucas numbers:
L(n) = φ^n + ψ^n

where φ = (1 + √5)/2 ≈ 1.618
      ψ = (1 - √5)/2 ≈ -0.618
```

**Symmetry Property:**
Unlike Fibonacci, Lucas sequences exhibit perfect symmetry, making them ideal for cycle analysis.

---

## Lucas Time Series in Trading

### Concept

Lucas numbers are used to identify **time intervals** at which significant market events (reversals, breakouts, trend changes) are likely to occur.

**Foundation:**
- Time symmetries in markets follow Lucas patterns
- Lucas cycles fill gaps left by Fibonacci time sequences
- High-probability reversal points occur at Lucas time intervals

### Lucas Time Cycles

**Application:**
Count bars/candles from a significant market event (high, low, trend start):

```
Significant Event at bar 0
Check for reversal/change at bars:
2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, ...
```

**Example:**
- Swing low occurs on January 1st (bar 0)
- Monitor for potential reversal on:
  - Bar 2: January 3rd
  - Bar 3: January 4th
  - Bar 4: January 5th
  - Bar 7: January 8th
  - Bar 11: January 12th
  - Bar 18: January 19th
  - Bar 29: January 30th
  - etc.

---

## Integer-Only Implementation

### Lucas Number Generation

```python
def generate_lucas_sequence_integer(n):
    """
    Generate first n Lucas numbers using integer-only arithmetic.

    Args:
        n: Number of Lucas numbers to generate

    Returns:
        List of Lucas numbers
    """
    if n <= 0:
        return []
    if n == 1:
        return [2]

    lucas = [2, 1]

    for i in range(2, n):
        next_lucas = lucas[i-1] + lucas[i-2]
        lucas.append(next_lucas)

    return lucas

# Pre-compute Lucas numbers for trading
LUCAS_SEQUENCE = generate_lucas_sequence_integer(30)
# [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207, ...]
```

### Time-Based Signal Detection

```python
class LucasTimeAnalyzer:
    """
    Analyze market timing using Lucas sequence.
    All arithmetic is integer-only.
    """

    def __init__(self, reference_bar=0):
        """
        Args:
            reference_bar: Bar index of significant event (swing high/low)
        """
        self.reference_bar = reference_bar
        self.lucas_sequence = LUCAS_SEQUENCE

    def is_lucas_time_window(self, current_bar, tolerance=1):
        """
        Check if current bar is at a Lucas time interval from reference.

        Args:
            current_bar: Current bar index (integer)
            tolerance: Allowed variance in bars (±tolerance)

        Returns:
            (is_lucas_time, lucas_number, strength)
        """
        bars_from_reference = current_bar - self.reference_bar

        for i, lucas_num in enumerate(self.lucas_sequence):
            if abs(bars_from_reference - lucas_num) <= tolerance:
                # Strength increases with larger Lucas numbers
                strength = i  # 0 for L(0)=2, 1 for L(1)=1, etc.
                return (True, lucas_num, strength)

        return (False, 0, 0)

    def get_next_lucas_levels(self, current_bar, count=5):
        """
        Get next 'count' Lucas time levels after current bar.

        Returns:
            List of (bar_index, lucas_number) tuples
        """
        bars_from_reference = current_bar - self.reference_bar
        future_levels = []

        for lucas_num in self.lucas_sequence:
            if lucas_num > bars_from_reference:
                future_bar = self.reference_bar + lucas_num
                future_levels.append((future_bar, lucas_num))

                if len(future_levels) >= count:
                    break

        return future_levels

# Example usage:
# Swing low occurred at bar 100
analyzer = LucasTimeAnalyzer(reference_bar=100)

# Current bar is 129 (100 + 29)
current = 129
is_lucas, number, strength = analyzer.is_lucas_time_window(current, tolerance=1)

if is_lucas:
    print(f"Lucas time alert! Bar {current} is {number} bars from reference")
    print(f"Strength: {strength}")
    # Strength: 7 (L(7) = 29)
```

---

## Advanced: Multiple Lucas Cycle Analysis

### Concept

Monitor multiple Lucas cycles simultaneously from different reference points to find **time confluence zones**.

```python
class MultiCycleLucasAnalyzer:
    """
    Track multiple Lucas cycles from different significant events.
    Identify time confluence zones where multiple cycles align.
    """

    def __init__(self):
        self.analyzers = []  # List of LucasTimeAnalyzer instances

    def add_reference_point(self, bar_index, event_type):
        """
        Add a new reference point (swing high, swing low, trend start, etc.)

        Args:
            bar_index: Bar where significant event occurred
            event_type: String describing event ('swing_high', 'swing_low', etc.)
        """
        analyzer = LucasTimeAnalyzer(reference_bar=bar_index)
        self.analyzers.append({
            'analyzer': analyzer,
            'type': event_type,
            'bar': bar_index
        })

    def find_time_confluence(self, current_bar, tolerance=2):
        """
        Find if multiple Lucas cycles converge at current time.

        Args:
            current_bar: Current bar index
            tolerance: Bar tolerance for confluence

        Returns:
            Confluence strength (0 = none, higher = stronger)
        """
        confluence_count = 0
        active_cycles = []

        for item in self.analyzers:
            analyzer = item['analyzer']
            is_lucas, number, strength = analyzer.is_lucas_time_window(
                current_bar, tolerance
            )

            if is_lucas:
                confluence_count += 1
                active_cycles.append({
                    'reference_type': item['type'],
                    'reference_bar': item['bar'],
                    'lucas_number': number,
                    'strength': strength
                })

        return confluence_count, active_cycles

# Example:
multi_analyzer = MultiCycleLucasAnalyzer()

# Add reference points
multi_analyzer.add_reference_point(bar_index=50, event_type='swing_low')
multi_analyzer.add_reference_point(bar_index=100, event_type='swing_high')
multi_analyzer.add_reference_point(bar_index=120, event_type='trend_start')

# Check current bar 147
# Bar 147 is:
#   - 97 bars from bar 50 (close to Lucas 123)
#   - 47 bars from bar 100 (exact Lucas 47!)
#   - 27 bars from bar 120 (close to Lucas 29)

count, cycles = multi_analyzer.find_time_confluence(current_bar=147, tolerance=2)

if count >= 2:
    print(f"STRONG TIME CONFLUENCE! {count} Lucas cycles align")
    for cycle in cycles:
        print(f"  - {cycle['reference_type']} at bar {cycle['reference_bar']}")
        print(f"    Lucas interval: {cycle['lucas_number']}")
```

---

## Lucas vs Fibonacci Time Analysis

### Comparison

| Aspect | Lucas Sequence | Fibonacci Sequence |
|--------|----------------|-------------------|
| **Starting values** | L(0)=2, L(1)=1 | F(0)=0, F(1)=1 |
| **Symmetry** | Perfect symmetry | Asymmetric |
| **Application** | Time cycles | Price levels primarily |
| **Convergence to φ** | Yes (same rate) | Yes |
| **Trading use** | Timing, cycles | Retracements, extensions |

### Combined Approach

**Optimal Strategy:**
1. Use **Fibonacci** for price levels (retracements, extensions)
2. Use **Lucas** for time windows (reversal timing)
3. **Confluence:** When Fibonacci price level and Lucas time window align

```python
def find_price_time_confluence(current_bar, current_price,
                                 fib_levels, lucas_analyzers,
                                 price_tolerance=50, time_tolerance=1):
    """
    Find confluence of Fibonacci price levels AND Lucas time windows.

    Args:
        current_bar: Current bar index
        current_price: Current price (integer, scaled)
        fib_levels: Dict of Fibonacci price levels
        lucas_analyzers: List of LucasTimeAnalyzer instances
        price_tolerance: Price tolerance for Fibonacci levels
        time_tolerance: Bar tolerance for Lucas windows

    Returns:
        Confluence score and details
    """

    # Check if at Fibonacci price level
    at_fib_level = False
    fib_level_name = None

    for level_name, level_price in fib_levels.items():
        if abs(current_price - level_price) <= price_tolerance:
            at_fib_level = True
            fib_level_name = level_name
            break

    # Check if at Lucas time window
    lucas_confluence = 0
    active_lucas = []

    for analyzer in lucas_analyzers:
        is_lucas, number, strength = analyzer.is_lucas_time_window(
            current_bar, time_tolerance
        )
        if is_lucas:
            lucas_confluence += 1
            active_lucas.append(number)

    # Calculate total confluence score
    score = 0
    if at_fib_level:
        score += 5  # Fibonacci level worth 5 points
    score += lucas_confluence * 3  # Each Lucas cycle worth 3 points

    return {
        'score': score,
        'at_fibonacci': at_fib_level,
        'fibonacci_level': fib_level_name,
        'lucas_cycles': lucas_confluence,
        'active_lucas_numbers': active_lucas,
        'high_probability': score >= 10  # Threshold for trade signal
    }

# Example: Strong confluence signal
# Current price at 61.8% Fibonacci retracement (5 points)
# AND 2 Lucas time cycles active (6 points)
# Total score: 11 → HIGH PROBABILITY REVERSAL
```

---

## Trading Strategies with Lucas Time Analysis

### 1. Lucas Reversal Trading

**Setup:**
1. Identify significant swing high or swing low
2. Set up Lucas time analyzer from that point
3. Monitor price action at Lucas time intervals

**Entry Signal:**
- Current bar is at Lucas time window (±1-2 bars)
- Price shows reversal pattern (engulfing, pin bar, etc.)
- Confirmation from indicators (RSI divergence, MACD cross)

**Implementation:**
```python
# Trading system
class LucasReversalSystem:
    def __init__(self):
        self.lucas_analyzer = None
        self.last_significant_swing = None

    def update_reference(self, bar_index, swing_type):
        """Update reference point when new significant swing occurs."""
        self.lucas_analyzer = LucasTimeAnalyzer(reference_bar=bar_index)
        self.last_significant_swing = swing_type

    def check_entry_signal(self, current_bar, current_price,
                           has_reversal_pattern, time_tolerance=1):
        """
        Check if entry conditions met.

        Returns:
            (should_enter, signal_strength)
        """
        if self.lucas_analyzer is None:
            return (False, 0)

        is_lucas, number, strength = self.lucas_analyzer.is_lucas_time_window(
            current_bar, time_tolerance
        )

        if is_lucas and has_reversal_pattern:
            # Higher strength for larger Lucas numbers
            signal_strength = strength
            return (True, signal_strength)

        return (False, 0)

# Usage:
system = LucasReversalSystem()

# Major swing low at bar 1000
system.update_reference(bar_index=1000, swing_type='swing_low')

# Monitor each bar
for bar in range(1001, 1200):
    is_lucas, num, str = system.lucas_analyzer.is_lucas_time_window(bar, 1)

    if is_lucas:
        print(f"Bar {bar}: Lucas alert! ({num} bars from swing low)")
        # Check for reversal pattern, then enter if confirmed
```

### 2. Lucas Cycle Breakout

**Concept:** Breakouts often occur at Lucas time intervals from consolidation start.

**Application:**
1. Identify consolidation range (sideways movement)
2. Set Lucas analyzer from consolidation start
3. Expect breakout at Lucas time intervals
4. Enter on breakout confirmation at Lucas window

**Code:**
```python
def check_lucas_breakout(consolidation_start_bar, current_bar,
                          current_price, range_high, range_low,
                          time_tolerance=1):
    """
    Check for breakout at Lucas time window.

    Args:
        consolidation_start_bar: When consolidation began
        current_bar: Current bar
        current_price: Current price (integer)
        range_high: Top of consolidation range
        range_low: Bottom of consolidation range
        time_tolerance: Bar tolerance

    Returns:
        (is_breakout, direction, lucas_confirmation)
    """
    analyzer = LucasTimeAnalyzer(reference_bar=consolidation_start_bar)
    is_lucas, number, strength = analyzer.is_lucas_time_window(
        current_bar, time_tolerance
    )

    # Check for breakout
    is_breakout = False
    direction = 0  # 0=none, 1=bullish, -1=bearish

    if current_price > range_high:
        is_breakout = True
        direction = 1
    elif current_price < range_low:
        is_breakout = True
        direction = -1

    # Lucas confirmation adds conviction
    if is_breakout and is_lucas:
        return (True, direction, True)  # High probability
    elif is_breakout:
        return (True, direction, False)  # Normal breakout
    else:
        return (False, 0, is_lucas)
```

### 3. Lucas Time Targets

**Use:** Estimate when price targets will be reached.

**Method:**
After entry, project future Lucas intervals as potential exit times.

```python
def calculate_time_targets(entry_bar, max_periods=10):
    """
    Calculate future Lucas time targets from entry.

    Args:
        entry_bar: Bar index of trade entry
        max_periods: Number of future Lucas periods to project

    Returns:
        List of (bar_index, lucas_number) tuples
    """
    analyzer = LucasTimeAnalyzer(reference_bar=entry_bar)
    targets = analyzer.get_next_lucas_levels(entry_bar, count=max_periods)

    return targets

# Example:
# Enter trade at bar 500
entry = 500
targets = calculate_time_targets(entry, max_periods=5)

# Results:
# [(502, 2), (501, 1), (503, 3), (504, 4), (507, 7)]
# Exit zones: bar 502, 503, 504, 507, 511, etc.
```

---

## Research Findings

### Lucas in Practice

**From Literature:**
- Lucas time series helps fill gaps left by Fibonacci time sequences
- Symmetry of Lucas series cycles key to identifying high-probability market tendencies
- Lucas cycles have profound influence on all markets in all degrees of trend
- Time symmetries serve as important pattern-recognition tools
- Recognizing Lucas cycles helps anticipate where reversals/breakouts materialize

### Limitations

**Important Considerations:**
- Academic research on rigorous Lucas sequence frameworks is limited
- Primarily used in technical analysis rather than quantitative finance
- Effectiveness may be partly due to self-fulfilling prophecy (traders watching same levels)
- Requires combination with other analysis for reliable signals

---

## Integer Arithmetic Optimizations

### Pre-computed Lucas Table

```c
// C implementation for embedded systems
#define MAX_LUCAS 40

const uint64_t LUCAS_TABLE[MAX_LUCAS] = {
    2, 1, 3, 4, 7, 11, 18, 29, 47, 76,
    123, 199, 322, 521, 843, 1364, 2207, 3571, 5778, 9349,
    15127, 24476, 39603, 64079, 103682, 167761, 271443, 439204, 710647, 1149851,
    1860498, 3010349, 4870847, 7881196, 12752043, 20633239, 33385282, 54018521,
    87403803, 141422324
};

int is_lucas_time(int bars_elapsed, int tolerance) {
    for (int i = 0; i < MAX_LUCAS; i++) {
        int diff = abs(bars_elapsed - (int)LUCAS_TABLE[i]);
        if (diff <= tolerance) {
            return i;  // Return index (strength)
        }
    }
    return -1;  // Not Lucas time
}
```

### Efficient Search

```python
def binary_search_lucas(bars_elapsed, lucas_sequence, tolerance):
    """
    Binary search to find closest Lucas number.
    Faster than linear search for large sequences.

    Time complexity: O(log n)
    """
    left = 0
    right = len(lucas_sequence) - 1
    closest = -1
    min_diff = float('inf')

    while left <= right:
        mid = (left + right) // 2
        diff = abs(lucas_sequence[mid] - bars_elapsed)

        if diff <= tolerance:
            return mid  # Found within tolerance

        if diff < min_diff:
            min_diff = diff
            closest = mid

        if lucas_sequence[mid] < bars_elapsed:
            left = mid + 1
        else:
            right = mid - 1

    return -1 if min_diff > tolerance else closest
```

---

## Sources

- [Fibonacci & Lucas Trading Levels | BBN Times](https://www.bbntimes.com/financial/fibonacci-lucas-trading-levels)
- [Fibonacci Lucas Time Series Indicator | MotiveWave](https://motivewave.com/studies/fibonacci_lucas_time_series_indicator.htm)
- [Trading the Nasdaq with Lucas time series | Futures](http://admin.futuresmag.com/2008/02/12/trading-nasdaq-lucas-time-series)
- [Lucas Sequence - FasterCapital](https://fastercapital.com/keyword/lucas-sequence.html)
- [Lucas Wave International - Fibonacci Based Technical Analysis](https://www.lucaswaveinternational.com/)
