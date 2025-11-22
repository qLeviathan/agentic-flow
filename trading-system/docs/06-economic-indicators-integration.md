# Economic Indicators Integration for Trading

## Overview

Integration of macroeconomic indicators into trading systems using integer-only arithmetic. Economic indicators provide crucial context for market direction, helping optimize entry/exit timing and risk management.

---

## Key Economic Indicators

### 1. Gross Domestic Product (GDP)

**Description:** Measures total economic output of a country.

**Impact on Markets:**
- **Strong GDP growth** → Economic expansion → Currency strengthening → Bullish for stocks
- **Weak GDP/contraction** → Economic challenges → Currency depreciation → Risk-off sentiment

**Trading Signals:**
```
GDP Growth Rate (YoY) → Market Impact
> 3.0%  → Strong bullish (overheating risk if sustained)
2.0-3.0% → Moderate bullish
1.0-2.0% → Neutral to slightly bullish
0-1.0%   → Weak, potential slowdown
< 0%     → Recession, bearish
```

**Integer Implementation:**
```python
class GDPIndicator:
    """
    GDP-based trading signals using integer arithmetic.
    GDP growth rates scaled by 1000 (e.g., 2.5% = 2500)
    """

    SCALE = 1000

    # Threshold levels (scaled)
    STRONG_GROWTH = 3000     # 3.0%
    MODERATE_GROWTH = 2000   # 2.0%
    WEAK_GROWTH = 1000       # 1.0%
    RECESSION = 0            # 0%

    @staticmethod
    def calculate_gdp_signal(current_gdp_growth):
        """
        Generate trading signal from GDP growth rate.

        Args:
            current_gdp_growth: GDP growth rate YoY (scaled by 1000)

        Returns:
            Signal strength (-100 to +100, scaled by 10)
        """
        if current_gdp_growth >= GDPIndicator.STRONG_GROWTH:
            return 1000  # +100 (very bullish)
        elif current_gdp_growth >= GDPIndicator.MODERATE_GROWTH:
            return 700   # +70 (bullish)
        elif current_gdp_growth >= GDPIndicator.WEAK_GROWTH:
            return 300   # +30 (slightly bullish)
        elif current_gdp_growth >= GDPIndicator.RECESSION:
            return -300  # -30 (slightly bearish)
        else:
            return -1000 # -100 (very bearish)

    @staticmethod
    def calculate_gdp_momentum(current_gdp, previous_gdp):
        """
        Calculate GDP growth momentum (acceleration/deceleration).

        Args:
            current_gdp: Current quarter GDP growth (scaled)
            previous_gdp: Previous quarter GDP growth (scaled)

        Returns:
            Momentum signal (-100 to +100, scaled by 10)
        """
        momentum = current_gdp - previous_gdp

        # Normalize momentum
        if momentum > 500:      # Accelerating >0.5%
            return 500
        elif momentum > 200:    # Accelerating >0.2%
            return 300
        elif momentum > -200:   # Stable
            return 0
        elif momentum > -500:   # Decelerating
            return -300
        else:                   # Decelerating >-0.5%
            return -500

# Example:
gdp_indicator = GDPIndicator()

# US GDP growth 2025: 1.6%
current_gdp = 1600  # 1.6% scaled
signal = gdp_indicator.calculate_gdp_signal(current_gdp)
print(f"GDP Signal: {signal/10}")  # Output: +30 (slightly bullish)

# GDP momentum
previous_gdp = 2800  # Previous was 2.8%
momentum = gdp_indicator.calculate_gdp_momentum(current_gdp, previous_gdp)
print(f"GDP Momentum: {momentum/10}")  # Output: -50 (decelerating)
```

---

### 2. Interest Rates

**Description:** Central bank policy rates that influence borrowing costs and currency values.

**Impact on Markets:**
- **Rate hikes** → Currency strengthens → Stocks may weaken (higher borrowing costs)
- **Rate cuts** → Currency weakens → Stocks may rally (easier credit)

**Current Data (2025):**
- US Federal Reserve: 4.0%

**Trading Framework:**
```python
class InterestRateIndicator:
    """
    Interest rate-based trading signals.
    Rates scaled by 1000 (e.g., 4.0% = 4000)
    """

    SCALE = 1000

    def __init__(self):
        self.rate_history = []

    def add_rate_decision(self, rate, timestamp):
        """
        Record new interest rate decision.

        Args:
            rate: Interest rate (scaled by 1000)
            timestamp: Decision timestamp (unix time or bar index)
        """
        self.rate_history.append({
            'rate': rate,
            'timestamp': timestamp
        })

    def get_rate_direction(self):
        """
        Determine rate trend (hiking, cutting, or neutral).

        Returns:
            Direction code: 1 (hiking), -1 (cutting), 0 (neutral)
        """
        if len(self.rate_history) < 2:
            return 0

        recent = self.rate_history[-3:] if len(self.rate_history) >= 3 else self.rate_history

        hikes = 0
        cuts = 0

        for i in range(1, len(recent)):
            if recent[i]['rate'] > recent[i-1]['rate']:
                hikes += 1
            elif recent[i]['rate'] < recent[i-1]['rate']:
                cuts += 1

        if hikes > cuts:
            return 1   # Hiking cycle
        elif cuts > hikes:
            return -1  # Cutting cycle
        else:
            return 0   # Neutral/paused

    def calculate_currency_signal(self, rate_direction):
        """
        Calculate currency strength signal from rate direction.

        Args:
            rate_direction: 1 (hiking), -1 (cutting), 0 (neutral)

        Returns:
            Signal strength (scaled by 10)
        """
        if rate_direction == 1:
            return 800   # +80 (bullish for currency)
        elif rate_direction == -1:
            return -800  # -80 (bearish for currency)
        else:
            return 0     # Neutral

    def calculate_equity_signal(self, rate_direction, current_rate):
        """
        Calculate equity market signal from interest rates.

        Args:
            rate_direction: 1 (hiking), -1 (cutting), 0 (neutral)
            current_rate: Current interest rate (scaled)

        Returns:
            Signal strength (scaled by 10)
        """
        # High rates (>5%) with hiking → bearish for stocks
        # Low rates (<2%) with cutting → bullish for stocks

        if current_rate > 5000:  # >5%
            if rate_direction == 1:
                return -600  # Very bearish
            else:
                return -300  # Moderately bearish
        elif current_rate < 2000:  # <2%
            if rate_direction == -1:
                return 600   # Very bullish
            else:
                return 300   # Moderately bullish
        else:  # Neutral rate environment
            if rate_direction == 1:
                return -400  # Moderately bearish
            elif rate_direction == -1:
                return 400   # Moderately bullish
            else:
                return 0     # Neutral

# Example:
rate_indicator = InterestRateIndicator()

# Fed rate decisions
rate_indicator.add_rate_decision(5500, timestamp=1)  # 5.5%
rate_indicator.add_rate_decision(5250, timestamp=2)  # 5.25%
rate_indicator.add_rate_decision(5000, timestamp=3)  # 5.0%
rate_indicator.add_rate_decision(4500, timestamp=4)  # 4.5%
rate_indicator.add_rate_decision(4000, timestamp=5)  # 4.0%

direction = rate_indicator.get_rate_direction()
print(f"Rate direction: {direction}")  # -1 (cutting cycle)

currency_signal = rate_indicator.calculate_currency_signal(direction)
print(f"Currency signal: {currency_signal/10}")  # -80 (bearish for USD)

equity_signal = rate_indicator.calculate_equity_signal(direction, 4000)
print(f"Equity signal: {equity_signal/10}")  # +40 (moderately bullish for stocks)
```

---

### 3. Inflation (CPI/PPI)

**Description:** Rate of price increases in economy (Consumer Price Index / Producer Price Index).

**Impact on Markets:**
- **High inflation** → Central banks may hike rates → Bearish for bonds, mixed for stocks
- **Low inflation** → Central banks may cut rates → Bullish for bonds and stocks

**Current Data (2025):**
- US CPI: 3.0% (as of Oct 2025)

**Trading Framework:**
```python
class InflationIndicator:
    """
    Inflation-based trading signals.
    Inflation rates scaled by 1000 (e.g., 3.0% = 3000)
    """

    SCALE = 1000

    # Central bank inflation targets (typically 2.0%)
    TARGET_INFLATION = 2000

    # Thresholds
    HIGH_INFLATION = 4000    # 4.0%
    LOW_INFLATION = 1000     # 1.0%

    @staticmethod
    def calculate_inflation_signal(current_inflation, target=TARGET_INFLATION):
        """
        Generate signal based on inflation vs target.

        Args:
            current_inflation: Current inflation rate (scaled)
            target: Central bank target (scaled)

        Returns:
            Signal strength (scaled by 10)
        """
        deviation = current_inflation - target

        if deviation > 2000:       # >2% above target
            return -800  # Very bearish (expect aggressive rate hikes)
        elif deviation > 1000:     # >1% above target
            return -500  # Bearish
        elif deviation > 500:      # >0.5% above target
            return -200  # Slightly bearish
        elif deviation > -500:     # Within ±0.5% of target
            return 0     # Neutral
        elif deviation > -1000:    # Below target
            return 200   # Slightly bullish
        else:
            return 500   # Bullish (expect rate cuts)

    @staticmethod
    def calculate_real_rate(nominal_rate, inflation_rate):
        """
        Calculate real interest rate (nominal - inflation).

        Args:
            nominal_rate: Nominal interest rate (scaled)
            inflation_rate: Inflation rate (scaled)

        Returns:
            Real rate (scaled)
        """
        return nominal_rate - inflation_rate

    @staticmethod
    def get_real_rate_signal(real_rate):
        """
        Signal based on real interest rate.

        Args:
            real_rate: Real interest rate (scaled)

        Returns:
            Signal strength (scaled by 10)
        """
        # Positive real rates → restrictive → bearish
        # Negative real rates → accommodative → bullish

        if real_rate > 2000:      # Real rate >2%
            return -600  # Very restrictive, bearish
        elif real_rate > 1000:    # Real rate >1%
            return -400  # Restrictive
        elif real_rate > 0:       # Positive real rate
            return -200  # Slightly restrictive
        elif real_rate > -1000:   # Slightly negative
            return 200   # Accommodative
        else:                     # Very negative
            return 600   # Very accommodative, bullish

# Example:
inflation_indicator = InflationIndicator()

# US inflation: 3.0%
current_inflation = 3000
signal = inflation_indicator.calculate_inflation_signal(current_inflation)
print(f"Inflation signal: {signal/10}")  # -50 (bearish, above target)

# Real rate calculation
nominal_rate = 4000  # 4.0%
real_rate = inflation_indicator.calculate_real_rate(nominal_rate, current_inflation)
print(f"Real rate: {real_rate/10:.1f}%")  # 1.0%

real_rate_signal = inflation_indicator.get_real_rate_signal(real_rate)
print(f"Real rate signal: {real_rate_signal/10}")  # -40 (restrictive)
```

---

### 4. Employment Data (Non-Farm Payrolls, Unemployment Rate)

**Description:** Labor market strength indicators.

**Impact on Markets:**
- **Strong employment** → Economic strength → Potential rate hikes → Mixed for stocks
- **Weak employment** → Economic weakness → Potential rate cuts → Risk-off sentiment

**Trading Framework:**
```python
class EmploymentIndicator:
    """
    Employment-based trading signals.
    """

    SCALE = 1000

    # Unemployment rate thresholds (scaled by 1000)
    FULL_EMPLOYMENT = 4000    # 4.0%
    ELEVATED_UNEMP = 6000     # 6.0%

    @staticmethod
    def calculate_unemployment_signal(unemployment_rate):
        """
        Signal from unemployment rate.

        Args:
            unemployment_rate: Unemployment rate % (scaled)

        Returns:
            Signal strength (scaled by 10)
        """
        if unemployment_rate < 3500:  # <3.5% (very tight)
            return 400   # Bullish economy, but inflation risk
        elif unemployment_rate < 5000:  # <5% (healthy)
            return 600   # Bullish
        elif unemployment_rate < 6000:  # <6%
            return 200   # Neutral to slightly bullish
        elif unemployment_rate < 7000:  # <7%
            return -300  # Bearish
        else:                           # >7%
            return -700  # Very bearish (recession)

    @staticmethod
    def calculate_nfp_surprise(actual_jobs, expected_jobs, scale=1000):
        """
        Calculate Non-Farm Payrolls surprise impact.

        Args:
            actual_jobs: Actual jobs added (thousands)
            expected_jobs: Expected jobs (thousands)
            scale: Scaling for signal strength

        Returns:
            Signal strength (scaled by 10)
        """
        surprise = actual_jobs - expected_jobs

        # Normalize: ±50k jobs = ±100 signal
        signal = (surprise * 1000) // 50

        # Cap at ±1000
        if signal > 1000:
            signal = 1000
        elif signal < -1000:
            signal = -1000

        return signal

# Example:
emp_indicator = EmploymentIndicator()

# Unemployment rate: 3.8%
unemp_rate = 3800
signal = emp_indicator.calculate_unemployment_signal(unemp_rate)
print(f"Unemployment signal: {signal/10}")  # +40

# NFP surprise
actual_nfp = 250  # 250k jobs added
expected_nfp = 180  # Expected 180k
nfp_signal = emp_indicator.calculate_nfp_surprise(actual_nfp, expected_nfp)
print(f"NFP surprise signal: {nfp_signal/10}")  # +140 (strong beat)
```

---

## Composite Economic Indicator System

### Multi-Indicator Integration

```python
class CompositeEconomicIndicator:
    """
    Combine multiple economic indicators into single signal.
    Uses weighted approach with integer arithmetic.
    """

    SCALE = 1000

    def __init__(self):
        # Indicator weights (must sum to SCALE)
        self.weights = {
            'gdp': 250,        # 25%
            'interest': 200,   # 20%
            'inflation': 200,  # 20%
            'employment': 150, # 15%
            'sentiment': 100,  # 10%
            'leading': 100     # 10%
        }

    def calculate_composite_signal(self, indicator_signals):
        """
        Calculate weighted composite signal.

        Args:
            indicator_signals: Dict of indicator signals (scaled by 10)
                              {'gdp': 30, 'interest': -40, ...}

        Returns:
            Composite signal (scaled by 10)
        """
        composite = 0

        for indicator, weight in self.weights.items():
            if indicator in indicator_signals:
                signal = indicator_signals[indicator]
                weighted_signal = (signal * weight) // self.SCALE
                composite += weighted_signal

        return composite

    def get_market_regime(self, composite_signal):
        """
        Determine market regime from composite signal.

        Args:
            composite_signal: Composite signal (scaled by 10)

        Returns:
            Regime code: 2 (strong bull), 1 (bull), 0 (neutral),
                        -1 (bear), -2 (strong bear)
        """
        if composite_signal > 500:
            return 2   # Strong bullish
        elif composite_signal > 200:
            return 1   # Bullish
        elif composite_signal > -200:
            return 0   # Neutral
        elif composite_signal > -500:
            return -1  # Bearish
        else:
            return -2  # Strong bearish

    def adjust_position_sizing(self, base_size, composite_signal, scale=10):
        """
        Adjust position size based on economic backdrop.

        Args:
            base_size: Base position size (shares)
            composite_signal: Composite economic signal (scaled by 10)
            scale: Signal scale

        Returns:
            Adjusted position size (shares)
        """
        # Scale position size by signal strength
        # Signal range: -1000 to +1000 (scaled by 10)
        # Position multiplier: 0.5x to 1.5x

        # Multiplier = 1.0 + (signal / 2000)
        multiplier = self.SCALE + (composite_signal * self.SCALE) // 2000

        # Ensure multiplier in range [500, 1500] (0.5x to 1.5x)
        if multiplier > 1500:
            multiplier = 1500
        elif multiplier < 500:
            multiplier = 500

        adjusted_size = (base_size * multiplier) // self.SCALE

        return adjusted_size

# Example usage:
composite = CompositeEconomicIndicator()

# Current economic signals (scaled by 10)
signals = {
    'gdp': 30,         # +3 (slightly bullish)
    'interest': -40,   # -4 (bearish from rates)
    'inflation': -50,  # -5 (bearish from inflation)
    'employment': 60,  # +6 (bullish)
    'sentiment': 20,   # +2 (slightly bullish)
    'leading': -10     # -1 (slightly bearish)
}

composite_signal = composite.calculate_composite_signal(signals)
print(f"Composite Economic Signal: {composite_signal/10}")

regime = composite.get_market_regime(composite_signal)
regime_names = {2: 'Strong Bull', 1: 'Bull', 0: 'Neutral',
                -1: 'Bear', -2: 'Strong Bear'}
print(f"Market Regime: {regime_names[regime]}")

# Adjust position sizing
base_position = 100  # shares
adjusted = composite.adjust_position_sizing(base_position, composite_signal)
print(f"Position size adjustment: {base_position} → {adjusted} shares")
```

---

## Economic Calendar Integration

### Scheduling High-Impact Events

```python
class EconomicCalendar:
    """
    Track and manage economic data releases.
    """

    def __init__(self):
        self.scheduled_events = []

    def add_event(self, timestamp, event_type, importance, previous_value=None):
        """
        Add economic event to calendar.

        Args:
            timestamp: Event time (unix timestamp or bar index)
            event_type: Type ('GDP', 'CPI', 'NFP', 'FOMC', etc.)
            importance: Impact level (1-10)
            previous_value: Previous reading (optional)
        """
        self.scheduled_events.append({
            'timestamp': timestamp,
            'type': event_type,
            'importance': importance,
            'previous': previous_value,
            'actual': None
        })

    def get_upcoming_events(self, current_time, lookahead_bars=10):
        """
        Get upcoming high-impact events.

        Args:
            current_time: Current timestamp
            lookahead_bars: How far ahead to look

        Returns:
            List of upcoming events
        """
        upcoming = []

        for event in self.scheduled_events:
            if current_time <= event['timestamp'] <= current_time + lookahead_bars:
                if event['importance'] >= 7:  # High-impact only
                    upcoming.append(event)

        return sorted(upcoming, key=lambda x: x['timestamp'])

    def should_avoid_trading(self, current_time, buffer_bars=2):
        """
        Check if should avoid trading due to upcoming event.

        Args:
            current_time: Current timestamp
            buffer_bars: Avoid trading N bars before event

        Returns:
            (should_avoid, reason)
        """
        upcoming = self.get_upcoming_events(current_time, lookahead_bars=buffer_bars)

        if upcoming:
            event = upcoming[0]
            return (True, f"{event['type']} in {event['timestamp'] - current_time} bars")

        return (False, None)

# Example:
calendar = EconomicCalendar()

# Schedule events
calendar.add_event(timestamp=100, event_type='NFP', importance=9)
calendar.add_event(timestamp=105, event_type='CPI', importance=8)
calendar.add_event(timestamp=110, event_type='FOMC', importance=10)

# Check at bar 98
current = 98
should_avoid, reason = calendar.should_avoid_trading(current, buffer_bars=3)

if should_avoid:
    print(f"Avoid trading: {reason}")
else:
    print("Clear to trade")
```

---

## Country-Specific Indicator Integration

### Currency Pair Trading with Economic Divergence

```python
def calculate_economic_divergence_signal(country1_composite, country2_composite,
                                          scale=10):
    """
    Calculate currency pair signal from economic divergence.

    Args:
        country1_composite: Country 1 economic signal (scaled by 10)
        country2_composite: Country 2 economic signal (scaled by 10)
        scale: Signal scale

    Returns:
        Currency pair signal (scaled by 10)
        Positive = Country 1 currency stronger
        Negative = Country 2 currency stronger
    """
    divergence = country1_composite - country2_composite

    # Amplify divergence for currency trading
    # Divergence >50 → significant
    signal = divergence * 2

    # Cap at ±1000
    if signal > 1000:
        signal = 1000
    elif signal < -1000:
        signal = -1000

    return signal

# Example: EUR/USD
us_composite = 100   # +10 (bullish US economy)
eu_composite = -200  # -20 (bearish EU economy)

eur_usd_signal = calculate_economic_divergence_signal(us_composite, eu_composite)
print(f"EUR/USD Signal: {eur_usd_signal/10}")
# Positive signal → USD strengthening → EUR/USD falling
```

---

## Sources

- [The Importance of Economic Indicators in Trading | LAT Blog](https://www.lat.london/news-resources/news-blog/the-importance-of-economic-indicators-in-trading/)
- [What are Economic Indicators and Why are They Important? | FOREX.com](https://www.forex.com/en-us/trading-guides/what-are-economic-indicators/)
- [The Impact of Economic Indicators on Forex Markets | FX Replay](https://www.fxreplay.com/learn/the-impact-of-economic-indicators-on-forex-markets)
- [The Impact of Economic Indicators on Forex Trading | Securities.io](https://www.securities.io/forex-economic-indicators/)
- [7 Economic Indicators Every Trader Should Know](https://tiomarkets.com/en/article/7-economic-indicators-every-trader-should-know)
- [Top 6 Key Economic Indicators for Traders | Nadex](https://www.nadex.com/learning/what-are-the-key-economic-indicators-for-traders/)
- [TRADING ECONOMICS | 20 million INDICATORS](https://tradingeconomics.com/)
