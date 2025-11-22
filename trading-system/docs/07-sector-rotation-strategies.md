# Sector Rotation Strategies

## Overview

Sector rotation involves systematically allocating capital across market sectors based on business cycle phases, momentum signals, and quantitative models. This document provides integer-based implementations for sector rotation trading.

---

## Business Cycle and Sector Performance

### Four Phases of Business Cycle

```
1. EARLY CYCLE (Recovery)
   - Characteristics: GDP accelerating, low interest rates, rising consumer confidence
   - Leading sectors: Technology, Consumer Discretionary, Financials
   - Lagging sectors: Utilities, Consumer Staples

2. MID CYCLE (Expansion)
   - Characteristics: Steady GDP growth, moderate rates, peak employment
   - Leading sectors: Industrials, Materials, Energy
   - Lagging sectors: Financials

3. LATE CYCLE (Slowdown)
   - Characteristics: Decelerating GDP, rising rates, inflation concerns
   - Leading sectors: Energy, Staples, Healthcare
   - Lagging sectors: Technology, Consumer Discretionary

4. RECESSION (Contraction)
   - Characteristics: Negative GDP, falling rates, high unemployment
   - Leading sectors: Utilities, Consumer Staples, Healthcare (Defensives)
   - Lagging sectors: All cyclicals
```

### Integer-Based Cycle Detection

```python
class BusinessCycleDetector:
    """
    Detect current business cycle phase using economic indicators.
    All arithmetic is integer-based.
    """

    SCALE = 1000

    # Cycle codes
    EARLY_CYCLE = 1
    MID_CYCLE = 2
    LATE_CYCLE = 3
    RECESSION = 4

    def __init__(self):
        self.current_cycle = None

    def detect_cycle(self, gdp_growth, gdp_momentum, unemployment_rate,
                     interest_rate_direction, inflation_rate):
        """
        Detect business cycle phase from economic indicators.

        Args:
            gdp_growth: GDP growth rate YoY (scaled by 1000)
            gdp_momentum: GDP acceleration (current - previous, scaled)
            unemployment_rate: Unemployment rate (scaled)
            interest_rate_direction: 1 (hiking), -1 (cutting), 0 (neutral)
            inflation_rate: Inflation rate (scaled)

        Returns:
            Cycle code (1-4)
        """

        # RECESSION: Negative GDP or very high unemployment
        if gdp_growth < 0 or unemployment_rate > 7000:
            self.current_cycle = self.RECESSION
            return self.current_cycle

        # EARLY CYCLE: Positive GDP, accelerating, low rates, cutting
        if (gdp_growth > 0 and gdp_momentum > 0 and
            interest_rate_direction <= 0 and unemployment_rate > 5000):
            self.current_cycle = self.EARLY_CYCLE
            return self.current_cycle

        # LATE CYCLE: Decelerating GDP, rising rates, high inflation
        if (gdp_momentum < -200 or
            (interest_rate_direction == 1 and inflation_rate > 3000)):
            self.current_cycle = self.LATE_CYCLE
            return self.current_cycle

        # MID CYCLE: Default for steady growth
        self.current_cycle = self.MID_CYCLE
        return self.current_cycle

    def get_cycle_name(self, cycle_code=None):
        """Get cycle name string."""
        if cycle_code is None:
            cycle_code = self.current_cycle

        names = {
            self.EARLY_CYCLE: "Early Cycle (Recovery)",
            self.MID_CYCLE: "Mid Cycle (Expansion)",
            self.LATE_CYCLE: "Late Cycle (Slowdown)",
            self.RECESSION: "Recession"
        }

        return names.get(cycle_code, "Unknown")

# Example:
detector = BusinessCycleDetector()

# Current economic data
gdp = 1600           # 1.6% growth
gdp_mom = -1200      # Decelerating from 2.8%
unemp = 3800         # 3.8%
rate_dir = -1        # Cutting rates
inflation = 3000     # 3.0%

cycle = detector.detect_cycle(gdp, gdp_mom, unemp, rate_dir, inflation)
print(f"Current Cycle: {detector.get_cycle_name(cycle)}")
# Output: "Late Cycle (Slowdown)" (due to decelerating GDP)
```

---

## Sector Allocation Framework

### Sector Weights by Business Cycle

```python
class SectorRotationStrategy:
    """
    Systematic sector rotation based on business cycle.
    Integer-only arithmetic for all calculations.
    """

    SCALE = 1000  # Weights sum to 1000 (100%)

    # Sector definitions
    SECTORS = [
        'Technology', 'Consumer Discretionary', 'Financials',
        'Industrials', 'Materials', 'Energy',
        'Healthcare', 'Consumer Staples', 'Utilities',
        'Real Estate', 'Communication Services'
    ]

    # Optimal weights by cycle (scaled by 1000)
    CYCLE_WEIGHTS = {
        BusinessCycleDetector.EARLY_CYCLE: {
            'Technology': 200,              # 20%
            'Consumer Discretionary': 180,  # 18%
            'Financials': 150,              # 15%
            'Industrials': 120,             # 12%
            'Materials': 80,                # 8%
            'Energy': 60,                   # 6%
            'Healthcare': 80,               # 8%
            'Consumer Staples': 60,         # 6%
            'Utilities': 30,                # 3%
            'Real Estate': 20,              # 2%
            'Communication Services': 20    # 2%
        },
        BusinessCycleDetector.MID_CYCLE: {
            'Technology': 150,
            'Consumer Discretionary': 130,
            'Financials': 100,
            'Industrials': 180,             # 18% (lead mid-cycle)
            'Materials': 150,               # 15%
            'Energy': 120,                  # 12%
            'Healthcare': 80,
            'Consumer Staples': 60,
            'Utilities': 30,
            'Real Estate': 50,
            'Communication Services': 50
        },
        BusinessCycleDetector.LATE_CYCLE: {
            'Technology': 80,
            'Consumer Discretionary': 60,
            'Financials': 70,
            'Industrials': 100,
            'Materials': 90,
            'Energy': 180,                  # 18% (defensive commodity)
            'Healthcare': 150,              # 15%
            'Consumer Staples': 150,        # 15%
            'Utilities': 70,
            'Real Estate': 30,
            'Communication Services': 20
        },
        BusinessCycleDetector.RECESSION: {
            'Technology': 50,
            'Consumer Discretionary': 30,
            'Financials': 40,
            'Industrials': 50,
            'Materials': 40,
            'Energy': 60,
            'Healthcare': 200,              # 20% (defensive)
            'Consumer Staples': 230,        # 23% (defensive)
            'Utilities': 200,               # 20% (defensive)
            'Real Estate': 50,
            'Communication Services': 50
        }
    }

    def __init__(self):
        self.current_weights = None
        self.target_weights = None

    def get_target_weights(self, cycle_code):
        """
        Get target sector weights for given cycle.

        Args:
            cycle_code: Business cycle code (1-4)

        Returns:
            Dict of sector weights (scaled by 1000)
        """
        self.target_weights = self.CYCLE_WEIGHTS.get(cycle_code, None)
        return self.target_weights

    def calculate_rebalance_trades(self, current_weights, target_weights,
                                     portfolio_value):
        """
        Calculate trades needed to rebalance to target weights.

        Args:
            current_weights: Current sector weights (dict, scaled)
            target_weights: Target sector weights (dict, scaled)
            portfolio_value: Total portfolio value (cents)

        Returns:
            Dict of trades {sector: amount_to_buy/sell}
        """
        trades = {}

        for sector in self.SECTORS:
            current_weight = current_weights.get(sector, 0)
            target_weight = target_weights.get(sector, 0)

            weight_diff = target_weight - current_weight

            # Convert weight difference to dollar amount
            # amount = portfolio_value × weight_diff / SCALE
            trade_amount = (portfolio_value * weight_diff) // self.SCALE

            if trade_amount != 0:
                trades[sector] = trade_amount

        return trades

    def gradual_rotation(self, current_weights, target_weights, rotation_speed=300):
        """
        Gradually rotate toward target weights (not immediate rebalance).

        Args:
            current_weights: Current weights (dict, scaled)
            target_weights: Target weights (dict, scaled)
            rotation_speed: Speed of rotation (scaled by 1000, 300 = 30% per period)

        Returns:
            New weights after partial rotation
        """
        new_weights = {}

        for sector in self.SECTORS:
            current = current_weights.get(sector, 0)
            target = target_weights.get(sector, 0)

            # Move current toward target by rotation_speed %
            # new = current + (target - current) × speed / SCALE
            diff = target - current
            adjustment = (diff * rotation_speed) // self.SCALE
            new_weight = current + adjustment

            new_weights[sector] = new_weight

        # Normalize to ensure sum = SCALE
        total_weight = sum(new_weights.values())
        if total_weight != self.SCALE:
            # Adjust largest sector to make sum exact
            largest_sector = max(new_weights, key=new_weights.get)
            new_weights[largest_sector] += (self.SCALE - total_weight)

        return new_weights

# Example:
rotator = SectorRotationStrategy()

# Detect cycle and get target weights
cycle = BusinessCycleDetector.LATE_CYCLE
target_weights = rotator.get_target_weights(cycle)

print(f"Target weights for {detector.get_cycle_name(cycle)}:")
for sector, weight in sorted(target_weights.items(), key=lambda x: -x[1]):
    print(f"  {sector:25} {weight/10:5.1f}%")

# Current portfolio weights (early cycle allocation)
current_weights = rotator.CYCLE_WEIGHTS[BusinessCycleDetector.EARLY_CYCLE]

# Calculate rebalance trades
portfolio_val = 100_000_00  # $100,000
trades = rotator.calculate_rebalance_trades(current_weights, target_weights, portfolio_val)

print("\nRebalance trades needed:")
for sector, amount in sorted(trades.items(), key=lambda x: -abs(x[1])):
    action = "BUY" if amount > 0 else "SELL"
    print(f"  {action:4} ${abs(amount)/100:8.2f} {sector}")
```

---

## Momentum-Based Sector Rotation

### Relative Strength Sector Selection

```python
class MomentumSectorRotation:
    """
    Select sectors based on relative strength momentum.
    Integer-only arithmetic.
    """

    SCALE = 1000

    def __init__(self, lookback_period=60):
        """
        Args:
            lookback_period: Number of bars for momentum calculation
        """
        self.lookback_period = lookback_period
        self.sector_prices = {}  # {sector: [price_history]}

    def add_price_data(self, sector, price):
        """
        Add price data for sector.

        Args:
            sector: Sector name
            price: Current price (cents)
        """
        if sector not in self.sector_prices:
            self.sector_prices[sector] = []

        self.sector_prices[sector].append(price)

        # Keep only lookback_period + 1 bars
        if len(self.sector_prices[sector]) > self.lookback_period + 1:
            self.sector_prices[sector].pop(0)

    def calculate_momentum(self, sector):
        """
        Calculate momentum for sector.
        Momentum = (current_price / price_N_bars_ago) × SCALE

        Args:
            sector: Sector name

        Returns:
            Momentum value (scaled by 1000)
        """
        if sector not in self.sector_prices:
            return self.SCALE  # Neutral if no data

        prices = self.sector_prices[sector]

        if len(prices) < self.lookback_period:
            return self.SCALE  # Not enough data

        current_price = prices[-1]
        past_price = prices[0]

        if past_price == 0:
            return self.SCALE

        # momentum = (current / past) × SCALE
        momentum = (current_price * self.SCALE) // past_price

        return momentum

    def rank_sectors_by_momentum(self):
        """
        Rank all sectors by momentum.

        Returns:
            List of (sector, momentum) tuples, sorted by momentum descending
        """
        sector_momentums = []

        for sector in self.sector_prices.keys():
            momentum = self.calculate_momentum(sector)
            sector_momentums.append((sector, momentum))

        # Sort by momentum (highest first)
        sector_momentums.sort(key=lambda x: -x[1])

        return sector_momentums

    def select_top_sectors(self, num_sectors=3):
        """
        Select top N sectors by momentum.

        Args:
            num_sectors: Number of sectors to select

        Returns:
            List of top sector names
        """
        ranked = self.rank_sectors_by_momentum()
        top_sectors = [sector for sector, _ in ranked[:num_sectors]]

        return top_sectors

    def calculate_equal_weight_allocation(self, selected_sectors):
        """
        Calculate equal weight for selected sectors.

        Args:
            selected_sectors: List of sector names

        Returns:
            Dict of weights (scaled by 1000)
        """
        if not selected_sectors:
            return {}

        weight_per_sector = self.SCALE // len(selected_sectors)
        weights = {sector: weight_per_sector for sector in selected_sectors}

        # Adjust last sector to ensure sum = SCALE
        last_sector = selected_sectors[-1]
        weights[last_sector] = self.SCALE - sum(weights.values()) + weights[last_sector]

        return weights

# Example:
momentum_rotator = MomentumSectorRotation(lookback_period=60)

# Simulate 60 days of price data for sectors
import random
random.seed(42)

sectors = ['Technology', 'Healthcare', 'Energy', 'Financials', 'Consumer Staples']

for day in range(65):
    for sector in sectors:
        # Simulate different momentum for each sector
        if sector == 'Technology':
            base_price = 10000 + day * 50  # Strong uptrend
        elif sector == 'Healthcare':
            base_price = 10000 + day * 30  # Moderate uptrend
        elif sector == 'Energy':
            base_price = 10000 - day * 20  # Downtrend
        elif sector == 'Financials':
            base_price = 10000 + day * 10  # Weak uptrend
        else:
            base_price = 10000  # Flat

        # Add noise
        noise = random.randint(-100, 100)
        price = base_price + noise

        momentum_rotator.add_price_data(sector, price)

# Rank sectors
ranked = momentum_rotator.rank_sectors_by_momentum()

print("Sector Momentum Rankings:")
for sector, momentum in ranked:
    pct_change = (momentum - 1000) / 10  # Convert to %
    print(f"  {sector:20} Momentum: {momentum/10:5.1f}% ({pct_change:+.1f}%)")

# Select top 3
top_3 = momentum_rotator.select_top_sectors(num_sectors=3)
print(f"\nTop 3 sectors: {top_3}")

# Allocate equally
allocation = momentum_rotator.calculate_equal_weight_allocation(top_3)
print("\nEqual weight allocation:")
for sector, weight in allocation.items():
    print(f"  {sector:20} {weight/10:5.1f}%")
```

---

## Mean Reversion Sector Rotation

### Relative Valuation Approach

```python
class MeanReversionSectorRotation:
    """
    Rotate to undervalued sectors based on mean reversion.
    Uses price-to-moving-average ratios.
    """

    SCALE = 1000

    def __init__(self, ma_period=200):
        """
        Args:
            ma_period: Moving average period for mean calculation
        """
        self.ma_period = ma_period
        self.sector_prices = {}

    def add_price_data(self, sector, price):
        """Add price data for sector."""
        if sector not in self.sector_prices:
            self.sector_prices[sector] = []

        self.sector_prices[sector].append(price)

        if len(self.sector_prices[sector]) > self.ma_period + 10:
            self.sector_prices[sector].pop(0)

    def calculate_price_to_ma_ratio(self, sector):
        """
        Calculate price / moving_average ratio.

        Args:
            sector: Sector name

        Returns:
            P/MA ratio (scaled by 1000)
        """
        if sector not in self.sector_prices:
            return self.SCALE

        prices = self.sector_prices[sector]

        if len(prices) < self.ma_period:
            return self.SCALE

        # Calculate moving average
        ma_sum = sum(prices[-self.ma_period:])
        ma = ma_sum // self.ma_period

        current_price = prices[-1]

        if ma == 0:
            return self.SCALE

        # ratio = (price / ma) × SCALE
        ratio = (current_price * self.SCALE) // ma

        return ratio

    def rank_sectors_by_undervaluation(self):
        """
        Rank sectors by undervaluation (lowest P/MA = most undervalued).

        Returns:
            List of (sector, p/ma_ratio) tuples, sorted by ratio ascending
        """
        sector_ratios = []

        for sector in self.sector_prices.keys():
            ratio = self.calculate_price_to_ma_ratio(sector)
            sector_ratios.append((sector, ratio))

        # Sort by ratio (lowest first = most undervalued)
        sector_ratios.sort(key=lambda x: x[1])

        return sector_ratios

    def select_undervalued_sectors(self, num_sectors=3, max_ratio=950):
        """
        Select undervalued sectors (P/MA < threshold).

        Args:
            num_sectors: Number of sectors to select
            max_ratio: Maximum P/MA ratio (scaled by 1000, e.g., 950 = 95%)

        Returns:
            List of undervalued sector names
        """
        ranked = self.rank_sectors_by_undervaluation()

        undervalued = []
        for sector, ratio in ranked:
            if ratio < max_ratio:
                undervalued.append(sector)
                if len(undervalued) >= num_sectors:
                    break

        return undervalued

# Example usage combines with momentum to avoid "value traps"
def combined_momentum_value_rotation(momentum_rotator, value_rotator,
                                      momentum_weight=700):  # 70% momentum, 30% value
    """
    Combine momentum and value for sector selection.

    Args:
        momentum_rotator: MomentumSectorRotation instance
        value_rotator: MeanReversionSectorRotation instance
        momentum_weight: Weight for momentum (scaled by 1000)

    Returns:
        Combined sector scores
    """
    SCALE = 1000
    value_weight = SCALE - momentum_weight

    momentum_ranks = momentum_rotator.rank_sectors_by_momentum()
    value_ranks = value_rotator.rank_sectors_by_undervaluation()

    # Create normalized scores
    sector_scores = {}

    # Momentum scores (higher is better, normalize to 0-1000)
    num_sectors = len(momentum_ranks)
    for i, (sector, _) in enumerate(momentum_ranks):
        # Score decreases from 1000 to 0 based on rank
        score = ((num_sectors - i) * SCALE) // num_sectors
        sector_scores[sector] = (score * momentum_weight) // SCALE

    # Value scores (lower P/MA is better, normalize to 0-1000)
    for i, (sector, _) in enumerate(value_ranks):
        score = ((num_sectors - i) * SCALE) // num_sectors
        existing_score = sector_scores.get(sector, 0)
        sector_scores[sector] = existing_score + (score * value_weight) // SCALE

    # Sort by combined score
    sorted_sectors = sorted(sector_scores.items(), key=lambda x: -x[1])

    return sorted_sectors
```

---

## Critical Research Findings

### Academic Perspective

**Important:** Recent academic research (2023-2024) challenges traditional sector rotation effectiveness.

**Key Finding:**
> "No evidence of systematic sector performance where popular belief anticipates it will occur. Conventional sector rotation generates modest outperformance, which quickly diminishes after allowing for transaction costs and incorrectly timing the business cycle."

**Implications:**
1. Traditional cycle-based rotation may not work as expected
2. Transaction costs significantly impact returns
3. Timing the business cycle accurately is difficult
4. Modern quantitative approaches (momentum, mean reversion) may be more effective

**Recommendation:**
Combine multiple approaches:
- Use momentum overlays on cycle-based rotation
- Implement gradual rotation to reduce transaction costs
- Apply machine learning for cycle prediction
- Focus on factor-based models (momentum, value, quality)

---

## Implementation Best Practices

### Transaction Cost Management

```python
def calculate_turnover_cost(trades, cost_per_trade_bps=10):
    """
    Calculate transaction costs from rebalancing.

    Args:
        trades: Dict of {sector: trade_amount} (cents)
        cost_per_trade_bps: Cost in basis points (10 = 0.10%)

    Returns:
        Total transaction cost (cents)
    """
    SCALE = 10000  # For basis points

    total_cost = 0

    for sector, amount in trades.items():
        # Cost = |amount| × cost_bps / SCALE
        cost = (abs(amount) * cost_per_trade_bps) // SCALE
        total_cost += cost

    return total_cost

def should_rebalance(expected_benefit, transaction_cost):
    """
    Decide if rebalancing is worthwhile.

    Args:
        expected_benefit: Expected return improvement (cents)
        transaction_cost: Cost of rebalancing (cents)

    Returns:
        Boolean (True if benefit > cost × safety_margin)
    """
    # Require benefit to exceed cost by 3x
    return expected_benefit > transaction_cost * 3
```

---

## Sources

- [Sector Rotation Strategies | Fidelity](https://www.fidelity.com/learning-center/trading-investing/markets-sectors/intro-sector-rotation-strats)
- [The myth of business cycle sector rotation | Molchanov (2024)](https://onlinelibrary.wiley.com/doi/full/10.1002/ijfe.2882)
- [Your Complete Guide to Sector Rotation | YCharts](https://get.ycharts.com/resources/blog/your-complete-guide-to-sector-rotation/)
- [Sector Rotation Investing: A Data-Driven Strategy | Medium](https://ultimamarkets.medium.com/sector-rotation-investing-a-data-driven-investing-strategy-93d9d8906ed5)
- [Turning sector rotation into strategy | Tejwin](https://www.tejwin.com/en/insight/turning-sector-rotation-into-strategy-applying-industry-sequencing-to-build-a-quantitative-backtesting-model/)
- [Sector rotation - Wikipedia](https://en.wikipedia.org/wiki/Sector_rotation)
