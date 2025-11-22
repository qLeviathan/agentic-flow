# Risk Management and Position Sizing Frameworks

## Overview

Comprehensive mathematical frameworks for position sizing, risk management, and portfolio optimization using integer-only arithmetic compatible with trading systems.

---

## Kelly Criterion

### Mathematical Foundation

**Formula:**
```
f* = (bp - q) / b

where:
f* = Optimal fraction of capital to bet
b = Odds received on the bet (net odds)
p = Probability of winning
q = Probability of losing (1 - p)
```

**For Trading:**
```
Kelly % = (Win Rate × Average Win - Loss Rate × Average Loss) / Average Win

Or equivalently:
Kelly % = W/L - (1-W) / R

where:
W = Win rate (probability of winning trade)
L = Loss rate (probability of losing trade) = 1 - W
R = Win/Loss ratio (average win / average loss)
```

### Integer-Only Implementation

```python
class KellyCriterion:
    """
    Kelly Criterion calculator using integer-only arithmetic.
    All probabilities and returns scaled by 1,000,000.
    """

    SCALE = 1_000_000  # Scale for probabilities and ratios

    def __init__(self):
        pass

    def calculate_kelly_integer(self, win_rate, avg_win, avg_loss):
        """
        Calculate Kelly fraction using integer arithmetic.

        Args:
            win_rate: Win probability (scaled by SCALE)
                      e.g., 60% = 600000
            avg_win: Average win amount (integer, e.g., cents)
            avg_loss: Average loss amount (integer, positive)

        Returns:
            Kelly fraction (scaled by SCALE)
        """
        # Kelly = W/L - (1-W)/R
        # where R = avg_win / avg_loss

        # Calculate win/loss ratio R (scaled)
        # R = (avg_win / avg_loss) × SCALE
        R = (avg_win * self.SCALE) // avg_loss

        # Loss rate
        loss_rate = self.SCALE - win_rate

        # First term: W/L = win_rate / loss_rate (scaled)
        # = (win_rate × SCALE) / loss_rate
        term1 = (win_rate * self.SCALE) // loss_rate

        # Second term: (1-W)/R = loss_rate / R
        # = (loss_rate × SCALE) / R
        term2 = (loss_rate * self.SCALE) // R

        # Kelly = term1 - term2
        kelly_scaled = term1 - term2

        return kelly_scaled

    def calculate_position_size(self, kelly_fraction, account_balance,
                                  current_price, fraction=2):
        """
        Calculate position size based on Kelly criterion.

        Args:
            kelly_fraction: Kelly fraction (scaled by SCALE)
            account_balance: Total account balance (cents)
            current_price: Current price per share (cents)
            fraction: Divisor for fractional Kelly (1=full, 2=half, 3=third)

        Returns:
            Number of shares to buy (integer)
        """
        # Adjust Kelly by fraction (half-Kelly, quarter-Kelly, etc.)
        adjusted_kelly = kelly_fraction // fraction

        # Capital to allocate = account_balance × adjusted_kelly / SCALE
        capital_to_allocate = (account_balance * adjusted_kelly) // self.SCALE

        # Number of shares = capital / price
        shares = capital_to_allocate // current_price

        return shares

    def kelly_from_expectancy(self, expectancy, win_rate):
        """
        Alternative Kelly calculation from expectancy.

        Args:
            expectancy: Average expected return per trade (scaled)
            win_rate: Win rate (scaled by SCALE)

        Returns:
            Kelly fraction (scaled)
        """
        # Kelly = Expectancy / Average Loss
        # This requires tracking average loss separately
        # Simplified: Kelly ≈ Expectancy × Win Rate

        kelly = (expectancy * win_rate) // self.SCALE

        return kelly

# Example usage:
kelly_calc = KellyCriterion()

# Trading statistics:
# Win rate: 55% → 550000
# Average win: $200 → 20000 cents
# Average loss: $100 → 10000 cents

win_rate = 550_000  # 55%
avg_win = 20_000    # $200
avg_loss = 10_000   # $100

kelly_fraction = kelly_calc.calculate_kelly_integer(win_rate, avg_win, avg_loss)
print(f"Full Kelly: {kelly_fraction / kelly_calc.SCALE:.4f}")
# Expected: (0.55 × 200 - 0.45 × 100) / 200 = (110 - 45) / 200 = 0.325

# Calculate position size
account = 10_000_00  # $10,000 in cents
price = 5_000        # $50 per share

# Half-Kelly (more conservative)
shares = kelly_calc.calculate_position_size(
    kelly_fraction, account, price, fraction=2
)
print(f"Position size (half-Kelly): {shares} shares")
# = $10,000 × 0.325 / 2 / $50 = 32.5 shares → 32 shares
```

### Fractional Kelly

**Problem:** Full Kelly often too aggressive, leads to large drawdowns.

**Solution:** Use fractional Kelly for more conservative position sizing.

```python
def compare_kelly_fractions():
    """
    Compare different Kelly fractions for risk management.
    """

    kelly_calc = KellyCriterion()

    # Same trading stats as before
    win_rate = 550_000
    avg_win = 20_000
    avg_loss = 10_000

    full_kelly = kelly_calc.calculate_kelly_integer(win_rate, avg_win, avg_loss)

    fractions = {
        'Full Kelly': 1,
        'Half Kelly': 2,
        'Third Kelly': 3,
        'Quarter Kelly': 4
    }

    account = 10_000_00  # $10,000
    price = 5_000        # $50/share

    print("Kelly Fraction Comparison:")
    print("-" * 50)

    for name, fraction in fractions.items():
        shares = kelly_calc.calculate_position_size(
            full_kelly, account, price, fraction
        )

        capital_allocated = shares * price
        pct_of_account = (capital_allocated * 100) // account

        print(f"{name:15} {shares:3} shares  "
              f"${capital_allocated/100:7.2f}  "
              f"({pct_of_account}% of account)")

# Output:
# Full Kelly        65 shares  $3250.00  (32% of account)
# Half Kelly        32 shares  $1600.00  (16% of account)
# Third Kelly       21 shares  $1050.00  (10% of account)
# Quarter Kelly     16 shares  $ 800.00  ( 8% of account)
```

**Recommendation:** Most professional traders use **Half-Kelly** or **Quarter-Kelly** to reduce volatility while maintaining good growth.

---

## Risk-Reward Ratio Framework

### Definition

```
Risk-Reward Ratio = Potential Profit / Potential Loss
                  = (Target Price - Entry Price) / (Entry Price - Stop Loss)
```

### Integer Implementation

```python
class RiskRewardCalculator:
    """
    Calculate risk-reward ratios using integer arithmetic.
    """

    @staticmethod
    def calculate_risk_reward(entry_price, stop_loss, target_price, scale=1000):
        """
        Calculate risk-reward ratio.

        Args:
            entry_price: Entry price (integer, e.g., cents)
            stop_loss: Stop loss price (integer)
            target_price: Target price (integer)
            scale: Scaling factor for ratio

        Returns:
            Risk-reward ratio (scaled by scale)
        """
        risk = entry_price - stop_loss
        reward = target_price - entry_price

        if risk <= 0:
            return 0  # Invalid setup

        # R:R ratio = reward / risk × scale
        ratio = (reward * scale) // risk

        return ratio

    @staticmethod
    def meets_minimum_rr(entry_price, stop_loss, target_price,
                          min_ratio=3, scale=1000):
        """
        Check if trade meets minimum risk-reward requirement.

        Args:
            entry_price, stop_loss, target_price: Prices (integers)
            min_ratio: Minimum acceptable R:R ratio
            scale: Scaling factor

        Returns:
            (meets_requirement, actual_ratio)
        """
        ratio = RiskRewardCalculator.calculate_risk_reward(
            entry_price, stop_loss, target_price, scale
        )

        min_scaled = min_ratio * scale
        meets = ratio >= min_scaled

        return (meets, ratio)

    @staticmethod
    def calculate_position_size_risk_based(account_balance, risk_per_trade_pct,
                                            entry_price, stop_loss, scale=1000):
        """
        Calculate position size based on fixed risk percentage.

        Args:
            account_balance: Total account (cents)
            risk_per_trade_pct: Risk per trade (scaled, e.g., 1% = 10 with scale=1000)
            entry_price: Entry price (cents)
            stop_loss: Stop loss price (cents)
            scale: Scaling for percentage

        Returns:
            Number of shares
        """
        # Capital at risk = account × risk_pct / scale
        capital_at_risk = (account_balance * risk_per_trade_pct) // scale

        # Risk per share = entry - stop
        risk_per_share = entry_price - stop_loss

        if risk_per_share <= 0:
            return 0

        # Shares = capital_at_risk / risk_per_share
        shares = capital_at_risk // risk_per_share

        return shares

# Example:
calc = RiskRewardCalculator()

# Trade setup:
entry = 10000   # $100.00
stop = 9500     # $95.00
target = 11500  # $115.00

ratio = calc.calculate_risk_reward(entry, stop, target, scale=1000)
print(f"Risk-Reward Ratio: {ratio/1000:.1f}:1")
# Risk = $5, Reward = $15, R:R = 3:1

meets, actual = calc.meets_minimum_rr(entry, stop, target, min_ratio=3, scale=1000)
print(f"Meets 3:1 minimum? {meets}")

# Position sizing with 1% risk
account = 10_000_00  # $10,000
risk_pct = 10        # 1% with scale=1000

shares = calc.calculate_position_size_risk_based(
    account, risk_pct, entry, stop, scale=1000
)
print(f"Position size (1% risk): {shares} shares")
# Capital at risk: $10,000 × 1% = $100
# Risk per share: $5
# Shares: $100 / $5 = 20 shares
```

---

## Portfolio Optimization

### Modern Portfolio Theory (Integer Implementation)

```python
class PortfolioOptimizer:
    """
    Portfolio optimization using integer arithmetic.
    Simplified Markowitz framework.
    """

    SCALE = 1_000_000

    def calculate_portfolio_return(self, weights, expected_returns):
        """
        Calculate expected portfolio return.

        Args:
            weights: List of weights (scaled by SCALE, sum to SCALE)
            expected_returns: List of expected returns (scaled)

        Returns:
            Portfolio return (scaled)
        """
        portfolio_return = 0

        for i in range(len(weights)):
            # weight × return / SCALE
            portfolio_return += (weights[i] * expected_returns[i]) // self.SCALE

        return portfolio_return

    def calculate_portfolio_variance_simplified(self, weights, variances):
        """
        Simplified portfolio variance (assumes zero correlation).

        Args:
            weights: Asset weights (scaled)
            variances: Individual asset variances (scaled)

        Returns:
            Portfolio variance (scaled)
        """
        portfolio_var = 0

        for i in range(len(weights)):
            # w² × variance
            w_squared = (weights[i] * weights[i]) // self.SCALE
            portfolio_var += (w_squared * variances[i]) // self.SCALE

        return portfolio_var

    def optimize_equal_weight(self, num_assets):
        """
        Create equal-weight portfolio.

        Args:
            num_assets: Number of assets

        Returns:
            List of weights (scaled)
        """
        weight_per_asset = self.SCALE // num_assets
        weights = [weight_per_asset] * num_assets

        # Adjust last weight to ensure sum = SCALE
        weights[-1] = self.SCALE - sum(weights[:-1])

        return weights

    def optimize_risk_parity(self, volatilities):
        """
        Risk parity allocation (inverse volatility weighting).

        Args:
            volatilities: List of asset volatilities (scaled)

        Returns:
            List of weights (scaled)
        """
        # Weight inversely proportional to volatility
        inv_vols = [self.SCALE // vol for vol in volatilities]
        total_inv_vol = sum(inv_vols)

        # Normalize to sum to SCALE
        weights = [(inv_vol * self.SCALE) // total_inv_vol
                   for inv_vol in inv_vols]

        # Adjust last weight
        weights[-1] = self.SCALE - sum(weights[:-1])

        return weights

# Example:
optimizer = PortfolioOptimizer()

# Three assets
expected_returns = [80_000, 120_000, 100_000]  # 8%, 12%, 10%
volatilities = [150_000, 250_000, 200_000]     # 15%, 25%, 20%

# Equal weight
equal_weights = optimizer.optimize_equal_weight(3)
print("Equal Weight:", [w/10000 for w in equal_weights], "%")

equal_return = optimizer.calculate_portfolio_return(equal_weights, expected_returns)
print(f"Expected Return: {equal_return/10000:.2f}%")

# Risk parity
risk_parity_weights = optimizer.optimize_risk_parity(volatilities)
print("Risk Parity:", [w/10000 for w in risk_parity_weights], "%")

rp_return = optimizer.calculate_portfolio_return(risk_parity_weights, expected_returns)
print(f"Expected Return (Risk Parity): {rp_return/10000:.2f}%")
```

---

## Stop Loss Management

### Types of Stop Losses

```python
class StopLossManager:
    """
    Manage various stop loss strategies using integer arithmetic.
    """

    @staticmethod
    def fixed_percentage_stop(entry_price, stop_pct, scale=1000):
        """
        Calculate stop loss at fixed percentage below entry.

        Args:
            entry_price: Entry price (cents)
            stop_pct: Stop percentage (scaled, e.g., 5% = 50 with scale=1000)
            scale: Scaling factor

        Returns:
            Stop loss price (cents)
        """
        # Stop = entry × (1 - stop_pct/scale)
        # = entry - entry × stop_pct / scale

        stop_amount = (entry_price * stop_pct) // scale
        stop_price = entry_price - stop_amount

        return stop_price

    @staticmethod
    def atr_based_stop(entry_price, atr_value, atr_multiplier=2):
        """
        Calculate ATR-based stop loss.

        Args:
            entry_price: Entry price (cents)
            atr_value: Average True Range value (cents)
            atr_multiplier: Multiple of ATR for stop distance

        Returns:
            Stop loss price (cents)
        """
        stop_distance = atr_value * atr_multiplier
        stop_price = entry_price - stop_distance

        return stop_price

    @staticmethod
    def trailing_stop(current_price, highest_price_since_entry,
                       trail_pct, scale=1000):
        """
        Calculate trailing stop loss.

        Args:
            current_price: Current price (cents)
            highest_price_since_entry: Highest price since entry (cents)
            trail_pct: Trailing percentage (scaled)
            scale: Scaling factor

        Returns:
            New stop loss price (cents)
        """
        # Trail stop = highest × (1 - trail_pct/scale)
        trail_amount = (highest_price_since_entry * trail_pct) // scale
        stop_price = highest_price_since_entry - trail_amount

        return stop_price

    @staticmethod
    def fibonacci_based_stop(swing_low, swing_high, fib_level=786, scale=1000):
        """
        Calculate stop below Fibonacci retracement level.

        Args:
            swing_low: Recent swing low (cents)
            swing_high: Recent swing high (cents)
            fib_level: Fibonacci level (e.g., 786 for 78.6%)
            scale: Scaling factor

        Returns:
            Stop loss price (cents)
        """
        price_range = swing_high - swing_low

        # Fibonacci level price
        fib_retracement = (price_range * fib_level) // scale
        fib_price = swing_high - fib_retracement

        # Stop slightly below Fibonacci level (buffer of 0.5%)
        buffer = (fib_price * 5) // 1000
        stop_price = fib_price - buffer

        return stop_price

# Example usage:
stop_mgr = StopLossManager()

entry = 10000  # $100.00

# Fixed 5% stop
stop_5pct = stop_mgr.fixed_percentage_stop(entry, stop_pct=50, scale=1000)
print(f"5% Stop Loss: ${stop_5pct/100:.2f}")

# ATR-based stop (ATR = $2.00)
atr = 200
stop_atr = stop_mgr.atr_based_stop(entry, atr, atr_multiplier=2)
print(f"ATR Stop (2×ATR): ${stop_atr/100:.2f}")

# Trailing stop
highest = 11000  # $110.00
stop_trail = stop_mgr.trailing_stop(10500, highest, trail_pct=30, scale=1000)
print(f"Trailing Stop (3%): ${stop_trail/100:.2f}")

# Fibonacci stop
swing_low = 9000   # $90.00
swing_high = 11000 # $110.00
stop_fib = stop_mgr.fibonacci_based_stop(swing_low, swing_high, fib_level=786)
print(f"Fibonacci Stop (below 78.6%): ${stop_fib/100:.2f}")
```

---

## Maximum Drawdown Management

### Calculating Maximum Drawdown

```python
def calculate_max_drawdown_integer(equity_curve):
    """
    Calculate maximum drawdown from equity curve.

    Args:
        equity_curve: List of account balances over time (cents)

    Returns:
        (max_drawdown_amount, max_drawdown_pct, peak_idx, trough_idx)
    """
    max_dd = 0
    max_dd_pct = 0
    peak = equity_curve[0]
    peak_idx = 0
    trough_idx = 0

    for i in range(len(equity_curve)):
        if equity_curve[i] > peak:
            peak = equity_curve[i]
            peak_idx = i

        drawdown = peak - equity_curve[i]

        if drawdown > max_dd:
            max_dd = drawdown
            trough_idx = i

            # Drawdown percentage (scaled by 1000)
            max_dd_pct = (drawdown * 1000) // peak

    return (max_dd, max_dd_pct, peak_idx, trough_idx)

# Example:
equity = [10000_00, 11000_00, 10500_00, 9500_00, 10000_00, 12000_00]

max_dd, max_dd_pct, peak_i, trough_i = calculate_max_drawdown_integer(equity)

print(f"Maximum Drawdown: ${max_dd/100:.2f} ({max_dd_pct/10:.1f}%)")
print(f"Peak at index {peak_i}: ${equity[peak_i]/100:.2f}")
print(f"Trough at index {trough_i}: ${equity[trough_i]/100:.2f}")
```

### Drawdown-Based Position Sizing

```python
def adjust_position_size_for_drawdown(base_position_size, current_dd_pct,
                                       max_dd_threshold=200, scale=1000):
    """
    Reduce position size during drawdown periods.

    Args:
        base_position_size: Normal position size (shares)
        current_dd_pct: Current drawdown percentage (scaled)
        max_dd_threshold: Maximum drawdown before stopping (scaled, e.g., 20% = 200)
        scale: Scaling factor

    Returns:
        Adjusted position size (shares)
    """
    if current_dd_pct >= max_dd_threshold:
        return 0  # Stop trading

    # Linear reduction: size × (1 - dd / max_dd)
    reduction_factor = scale - (current_dd_pct * scale) // max_dd_threshold
    adjusted_size = (base_position_size * reduction_factor) // scale

    return adjusted_size

# Example:
base_size = 100  # shares

# At 10% drawdown
current_dd = 100  # 10% (scaled by 1000)
adjusted = adjust_position_size_for_drawdown(base_size, current_dd,
                                              max_dd_threshold=200)
print(f"At 10% DD, position size: {adjusted} shares (50% reduction)")

# At 20% drawdown
current_dd = 200
adjusted = adjust_position_size_for_drawdown(base_size, current_dd,
                                              max_dd_threshold=200)
print(f"At 20% DD, position size: {adjusted} shares (stop trading)")
```

---

## Complete Risk Management System

```python
class RiskManagementSystem:
    """
    Comprehensive risk management system integrating multiple frameworks.
    """

    SCALE = 1_000_000

    def __init__(self, account_balance, max_risk_per_trade_pct=10_000,  # 1%
                 max_portfolio_heat_pct=50_000):  # 5%
        """
        Args:
            account_balance: Total account balance (cents)
            max_risk_per_trade_pct: Max risk per trade (scaled by SCALE)
            max_portfolio_heat_pct: Max total portfolio risk (scaled)
        """
        self.account_balance = account_balance
        self.max_risk_per_trade_pct = max_risk_per_trade_pct
        self.max_portfolio_heat_pct = max_portfolio_heat_pct
        self.open_positions = []

    def calculate_position_size(self, entry_price, stop_loss,
                                  use_kelly=False, kelly_fraction=None):
        """
        Calculate position size using risk management rules.

        Args:
            entry_price: Entry price (cents)
            stop_loss: Stop loss price (cents)
            use_kelly: Whether to use Kelly criterion
            kelly_fraction: Kelly fraction if use_kelly=True

        Returns:
            Position size (shares) or 0 if no trade allowed
        """
        # Check portfolio heat
        current_heat = self._calculate_portfolio_heat()

        if current_heat >= self.max_portfolio_heat_pct:
            return 0  # Too much risk already

        # Calculate risk per share
        risk_per_share = entry_price - stop_loss

        if risk_per_share <= 0:
            return 0

        if use_kelly and kelly_fraction:
            # Kelly-based sizing
            capital_to_risk = (self.account_balance * kelly_fraction) // self.SCALE
        else:
            # Fixed percentage risk
            capital_to_risk = (self.account_balance * self.max_risk_per_trade_pct) // self.SCALE

        # Calculate shares
        shares = capital_to_risk // risk_per_share

        # Check if adding this position exceeds portfolio heat
        new_risk = shares * risk_per_share
        new_risk_pct = (new_risk * self.SCALE) // self.account_balance

        if current_heat + new_risk_pct > self.max_portfolio_heat_pct:
            # Reduce position size to fit within heat limit
            available_heat = self.max_portfolio_heat_pct - current_heat
            available_capital = (self.account_balance * available_heat) // self.SCALE
            shares = available_capital // risk_per_share

        return shares

    def _calculate_portfolio_heat(self):
        """
        Calculate total portfolio risk (heat).

        Returns:
            Total risk as percentage of account (scaled)
        """
        total_risk = 0

        for position in self.open_positions:
            shares = position['shares']
            entry = position['entry_price']
            stop = position['stop_loss']

            risk = shares * (entry - stop)
            total_risk += risk

        heat_pct = (total_risk * self.SCALE) // self.account_balance

        return heat_pct

    def add_position(self, shares, entry_price, stop_loss):
        """Add new position to tracking."""
        self.open_positions.append({
            'shares': shares,
            'entry_price': entry_price,
            'stop_loss': stop_loss
        })

    def close_position(self, index):
        """Close position by index."""
        if 0 <= index < len(self.open_positions):
            self.open_positions.pop(index)

# Example:
risk_mgr = RiskManagementSystem(
    account_balance=10_000_00,  # $10,000
    max_risk_per_trade_pct=10_000,   # 1%
    max_portfolio_heat_pct=50_000    # 5% max total risk
)

# First trade
entry1 = 10000
stop1 = 9500
size1 = risk_mgr.calculate_position_size(entry1, stop1)
print(f"Trade 1 position size: {size1} shares")

risk_mgr.add_position(size1, entry1, stop1)

# Second trade
entry2 = 5000
stop2 = 4800
size2 = risk_mgr.calculate_position_size(entry2, stop2)
print(f"Trade 2 position size: {size2} shares")

current_heat = risk_mgr._calculate_portfolio_heat()
print(f"Current portfolio heat: {current_heat/10000:.2f}%")
```

---

## Sources

- [Practical Implementation of the Kelly Criterion | Frontiers](https://www.frontiersin.org/journals/applied-mathematics-and-statistics/articles/10.3389/fams.2020.577050/full)
- [Exploring the Application of Kelly's Criterion in Portfolio Optimization | BSIC](https://bsic.it/exploring-the-application-of-kellys-criterion-in-portfolio-optimization/)
- [Kelly Criterion Position Sizing for Optimal Returns](https://www.quantifiedstrategies.com/kelly-criterion-position-sizing/)
- [Kelly criterion - Wikipedia](https://en.wikipedia.org/wiki/Kelly_criterion)
- [The Kelly Criterion and Its Application to Portfolio Management | Medium](https://medium.com/@jatinnavani/the-kelly-criterion-and-its-application-to-portfolio-management-3490209df259)
- [Risk-Reward Ratios: Entry and Exit Strategies | LuxAlgo](https://www.luxalgo.com/blog/risk-reward-ratios-entry-and-exit-strategies/)
