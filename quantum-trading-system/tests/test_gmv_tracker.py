"""
Test Suite for GMV Tracker - Agent 22 (Zeckendorf: 10000000101)

Comprehensive tests for integer-only GMV tracking and visualization.

Tests:
- Position GMV calculation
- Snapshot creation and metrics
- Time series generation
- Field-level breakdowns
- Concentration analysis
- Heat map data generation
- Long/short exposure tracking
- Integer-only arithmetic validation
"""

import unittest
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from visualization.gmv_tracker import (
    GMVTracker,
    GMVSnapshot,
    PositionGMV
)


class TestPositionGMV(unittest.TestCase):
    """Test PositionGMV dataclass."""

    def test_position_creation_long(self):
        """Test creating a long position."""
        position = PositionGMV(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,  # $150
            value_cents=150000,  # $1,500
            abs_value_cents=150000,
            strategy="Fibonacci",
            sector="Technology",
            timestamp=0
        )

        self.assertEqual(position.position_id, "pos_001")
        self.assertEqual(position.symbol, "AAPL")
        self.assertEqual(position.quantity, 100)
        self.assertEqual(position.price_cents, 15000)
        self.assertEqual(position.value_cents, 150000)
        self.assertEqual(position.abs_value_cents, 150000)

    def test_position_creation_short(self):
        """Test creating a short position."""
        position = PositionGMV(
            position_id="pos_002",
            symbol="SPY",
            quantity=-200,
            price_cents=45000,  # $450
            value_cents=-900000,  # -$9,000
            abs_value_cents=900000,  # $9,000
            strategy="Mean Reversion",
            sector="ETF",
            timestamp=10
        )

        self.assertEqual(position.quantity, -200)
        self.assertEqual(position.value_cents, -900000)
        self.assertEqual(position.abs_value_cents, 900000)

    def test_position_to_dict(self):
        """Test converting position to dictionary."""
        position = PositionGMV(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            value_cents=150000,
            abs_value_cents=150000,
            strategy="Fibonacci"
        )

        pos_dict = position.to_dict()

        self.assertEqual(pos_dict['position_id'], "pos_001")
        self.assertEqual(pos_dict['symbol'], "AAPL")
        self.assertEqual(pos_dict['quantity'], 100)
        self.assertIn('price_dollars', pos_dict)
        self.assertIn('value_dollars', pos_dict)
        self.assertIn('abs_value_dollars', pos_dict)


class TestGMVTracker(unittest.TestCase):
    """Test GMVTracker core functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_tracker_initialization(self):
        """Test tracker initialization."""
        self.assertEqual(len(self.tracker.snapshots), 0)
        self.assertEqual(len(self.tracker.current_positions), 0)

    def test_update_position_long(self):
        """Test updating a long position."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,  # $150
            strategy="Test",
            timestamp=0
        )

        self.assertEqual(len(self.tracker.current_positions), 1)
        position = self.tracker.current_positions["pos_001"]

        # Value = 100 * 15000 / 100 = 150000 cents = $1,500
        expected_value = (100 * 15000) // 100
        self.assertEqual(position.value_cents, expected_value)
        self.assertEqual(position.abs_value_cents, expected_value)

    def test_update_position_short(self):
        """Test updating a short position."""
        self.tracker.update_position(
            position_id="pos_002",
            symbol="SPY",
            quantity=-200,
            price_cents=45000,  # $450
            strategy="Test",
            timestamp=0
        )

        position = self.tracker.current_positions["pos_002"]

        # Value = -200 * 45000 / 100 = -900000 cents = -$9,000
        expected_value = (-200 * 45000) // 100
        self.assertEqual(position.value_cents, expected_value)
        self.assertEqual(position.abs_value_cents, abs(expected_value))

    def test_update_existing_position(self):
        """Test updating an existing position."""
        # Initial position
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        # Update price
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=16000,  # Price increased
            strategy="Test"
        )

        self.assertEqual(len(self.tracker.current_positions), 1)
        position = self.tracker.current_positions["pos_001"]
        self.assertEqual(position.price_cents, 16000)

        # New value = 100 * 16000 / 100 = 160000 cents
        expected_value = (100 * 16000) // 100
        self.assertEqual(position.value_cents, expected_value)

    def test_close_position(self):
        """Test closing a position."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        self.assertEqual(len(self.tracker.current_positions), 1)

        self.tracker.close_position("pos_001")

        self.assertEqual(len(self.tracker.current_positions), 0)

    def test_close_nonexistent_position(self):
        """Test closing a position that doesn't exist."""
        # Should not raise an error
        self.tracker.close_position("nonexistent")
        self.assertEqual(len(self.tracker.current_positions), 0)


class TestGMVSnapshot(unittest.TestCase):
    """Test GMV snapshot functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_snapshot_empty_portfolio(self):
        """Test snapshot with no positions."""
        snapshot = self.tracker.take_snapshot(timestamp=0)

        self.assertEqual(snapshot.total_gmv_cents, 0)
        self.assertEqual(snapshot.num_positions, 0)
        self.assertEqual(snapshot.long_gmv_cents, 0)
        self.assertEqual(snapshot.short_gmv_cents, 0)
        self.assertEqual(snapshot.net_exposure_cents, 0)
        self.assertEqual(len(snapshot.positions), 0)

    def test_snapshot_single_position(self):
        """Test snapshot with single position."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test",
            timestamp=0
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # GMV = 100 * 15000 / 100 = 150000 cents = $1,500
        expected_gmv = (100 * 15000) // 100
        self.assertEqual(snapshot.total_gmv_cents, expected_gmv)
        self.assertEqual(snapshot.num_positions, 1)
        self.assertEqual(len(self.tracker.snapshots), 1)

    def test_snapshot_multiple_positions(self):
        """Test snapshot with multiple positions."""
        # Long position: 100 * $150 = $15,000
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Fibonacci"
        )

        # Long position: 50 * $280 = $14,000
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Momentum"
        )

        # Short position: -200 * $450 = -$90,000 (abs: $90,000)
        self.tracker.update_position(
            position_id="pos_003",
            symbol="SPY",
            quantity=-200,
            price_cents=45000,
            strategy="Mean Reversion"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Total GMV = $15,000 + $14,000 + $90,000 = $119,000 = 11,900,000 cents
        # Using integer arithmetic: (100*15000/100) + (50*28000/100) + abs(-200*45000/100)
        expected_gmv = (100 * 15000) // 100 + (50 * 28000) // 100 + abs((-200 * 45000) // 100)
        self.assertEqual(snapshot.total_gmv_cents, expected_gmv)
        self.assertEqual(snapshot.num_positions, 3)

    def test_snapshot_long_short_breakdown(self):
        """Test long/short GMV breakdown."""
        # Long position
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        # Short position
        self.tracker.update_position(
            position_id="pos_002",
            symbol="SPY",
            quantity=-200,
            price_cents=45000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Long GMV = 100 * 15000 / 100 = 150000 cents
        long_gmv = (100 * 15000) // 100
        self.assertEqual(snapshot.long_gmv_cents, long_gmv)

        # Short GMV = abs(-200 * 45000 / 100) = 900000 cents
        short_gmv = abs((-200 * 45000) // 100)
        self.assertEqual(snapshot.short_gmv_cents, short_gmv)

        # Net exposure = long - abs(short) = 150000 - 900000 = -750000
        net_exposure = (100 * 15000) // 100 + (-200 * 45000) // 100
        self.assertEqual(snapshot.net_exposure_cents, net_exposure)

        # Gross exposure = long + short = 150000 + 900000
        gross_exposure = long_gmv + short_gmv
        self.assertEqual(snapshot.gross_exposure_cents, gross_exposure)

    def test_snapshot_to_dict(self):
        """Test converting snapshot to dictionary."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)
        snapshot_dict = snapshot.to_dict()

        self.assertIn('timestamp', snapshot_dict)
        self.assertIn('summary', snapshot_dict)
        self.assertIn('concentration', snapshot_dict)
        self.assertIn('breakdown', snapshot_dict)
        self.assertIn('positions', snapshot_dict)


class TestFieldBreakdowns(unittest.TestCase):
    """Test field-level GMV breakdowns."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_gmv_by_strategy(self):
        """Test GMV breakdown by strategy."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Fibonacci"
        )

        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Fibonacci"
        )

        self.tracker.update_position(
            position_id="pos_003",
            symbol="MSFT",
            quantity=75,
            price_cents=32000,
            strategy="Momentum"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Fibonacci: (100*15000/100) + (50*28000/100) = 150000 + 140000 = 290000
        fib_gmv = (100 * 15000) // 100 + (50 * 28000) // 100
        self.assertEqual(snapshot.gmv_by_strategy["Fibonacci"], fib_gmv)

        # Momentum: 75*32000/100 = 240000
        momentum_gmv = (75 * 32000) // 100
        self.assertEqual(snapshot.gmv_by_strategy["Momentum"], momentum_gmv)

    def test_gmv_by_symbol(self):
        """Test GMV breakdown by symbol."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        aapl_gmv = (100 * 15000) // 100
        googl_gmv = (50 * 28000) // 100

        self.assertEqual(snapshot.gmv_by_symbol["AAPL"], aapl_gmv)
        self.assertEqual(snapshot.gmv_by_symbol["GOOGL"], googl_gmv)

    def test_gmv_by_sector(self):
        """Test GMV breakdown by sector."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test",
            sector="Technology"
        )

        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Test",
            sector="Technology"
        )

        self.tracker.update_position(
            position_id="pos_003",
            symbol="SPY",
            quantity=200,
            price_cents=45000,
            strategy="Test",
            sector="ETF"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Technology: (100*15000/100) + (50*28000/100) = 290000
        tech_gmv = (100 * 15000) // 100 + (50 * 28000) // 100
        self.assertEqual(snapshot.gmv_by_sector["Technology"], tech_gmv)

        # ETF: 200*45000/100 = 900000
        etf_gmv = (200 * 45000) // 100
        self.assertEqual(snapshot.gmv_by_sector["ETF"], etf_gmv)

    def test_gmv_by_sector_with_none(self):
        """Test sector breakdown when some positions have no sector."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test",
            sector="Technology"
        )

        self.tracker.update_position(
            position_id="pos_002",
            symbol="UNKNOWN",
            quantity=50,
            price_cents=10000,
            strategy="Test",
            sector=None  # No sector
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Should only have Technology sector in breakdown
        self.assertIn("Technology", snapshot.gmv_by_sector)
        self.assertNotIn(None, snapshot.gmv_by_sector)


class TestConcentrationMetrics(unittest.TestCase):
    """Test concentration metrics calculation."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_top_position_concentration(self):
        """Test top position concentration calculation."""
        # Position 1: $15,000
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        # Position 2: $14,000
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Total GMV = 150000 + 140000 = 290000
        total_gmv = (100 * 15000) // 100 + (50 * 28000) // 100

        # Top position = 150000
        top_gmv = (100 * 15000) // 100

        # Concentration = 150000 / 290000 * 1000 = 517
        expected_concentration = (top_gmv * 1000) // total_gmv
        self.assertEqual(snapshot.top_position_concentration_scaled, expected_concentration)

    def test_top_5_concentration(self):
        """Test top 5 positions concentration."""
        # Add 6 positions
        positions_data = [
            (100, 15000),  # $15,000
            (50, 28000),   # $14,000
            (75, 16000),   # $12,000
            (60, 15000),   # $9,000
            (40, 20000),   # $8,000
            (30, 10000)    # $3,000
        ]

        total_gmv = 0
        for i, (qty, price) in enumerate(positions_data):
            self.tracker.update_position(
                position_id=f"pos_{i:03d}",
                symbol=f"SYM{i}",
                quantity=qty,
                price_cents=price,
                strategy="Test"
            )
            total_gmv += (qty * price) // 100

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Top 5 GMV (excluding smallest)
        top_5_gmv = total_gmv - ((30 * 10000) // 100)

        # Concentration = top_5_gmv / total_gmv * 1000
        expected_concentration = (top_5_gmv * 1000) // total_gmv
        self.assertEqual(snapshot.top_5_concentration_scaled, expected_concentration)

    def test_concentration_single_position(self):
        """Test concentration with single position (should be 100%)."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Top position concentration should be 1000 (100%)
        self.assertEqual(snapshot.top_position_concentration_scaled, 1000)
        self.assertEqual(snapshot.top_5_concentration_scaled, 1000)


class TestTimeSeries(unittest.TestCase):
    """Test time series generation."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_gmv_time_series(self):
        """Test GMV time series generation."""
        # T=0
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test",
            timestamp=0
        )
        self.tracker.take_snapshot(timestamp=0)

        # T=10
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=16000,
            strategy="Test",
            timestamp=10
        )
        self.tracker.take_snapshot(timestamp=10)

        time_series = self.tracker.get_time_series()

        self.assertEqual(len(time_series), 2)
        self.assertEqual(time_series[0][0], 0)  # First timestamp
        self.assertEqual(time_series[1][0], 10)  # Second timestamp

        # Check GMV values
        self.assertEqual(time_series[0][1], (100 * 15000) // 100)
        self.assertEqual(time_series[1][1], (100 * 16000) // 100)

    def test_strategy_breakdown_series(self):
        """Test strategy breakdown time series."""
        # T=0: Two strategies
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Fibonacci",
            timestamp=0
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Momentum",
            timestamp=0
        )
        self.tracker.take_snapshot(timestamp=0)

        # T=10: Update prices
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=16000,
            strategy="Fibonacci",
            timestamp=10
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=29000,
            strategy="Momentum",
            timestamp=10
        )
        self.tracker.take_snapshot(timestamp=10)

        breakdown_series = self.tracker.get_strategy_breakdown_series()

        self.assertIn("Fibonacci", breakdown_series)
        self.assertIn("Momentum", breakdown_series)

        # Check Fibonacci series
        fib_series = breakdown_series["Fibonacci"]
        self.assertEqual(len(fib_series), 2)
        self.assertEqual(fib_series[0][1], (100 * 15000) // 100)
        self.assertEqual(fib_series[1][1], (100 * 16000) // 100)

    def test_concentration_series(self):
        """Test concentration metrics time series."""
        # Create some positions and snapshots
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )
        self.tracker.take_snapshot(timestamp=0)

        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Test"
        )
        self.tracker.take_snapshot(timestamp=10)

        concentration_series = self.tracker.get_concentration_series()

        self.assertIn('top_position', concentration_series)
        self.assertIn('top_5', concentration_series)
        self.assertEqual(len(concentration_series['top_position']), 2)
        self.assertEqual(len(concentration_series['top_5']), 2)

    def test_exposure_series(self):
        """Test long/short exposure time series."""
        # T=0: Long and short positions
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="SPY",
            quantity=-200,
            price_cents=45000,
            strategy="Test"
        )
        self.tracker.take_snapshot(timestamp=0)

        exposure_series = self.tracker.get_exposure_series()

        self.assertIn('long', exposure_series)
        self.assertIn('short', exposure_series)
        self.assertIn('net', exposure_series)
        self.assertIn('gross', exposure_series)

        # Check values
        self.assertEqual(exposure_series['long'][0][1], (100 * 15000) // 100)
        self.assertEqual(exposure_series['short'][0][1], abs((-200 * 45000) // 100))


class TestHeatMapData(unittest.TestCase):
    """Test heat map data generation."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_heat_map_data_generation(self):
        """Test generating heat map data."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Fibonacci",
            sector="Technology"
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Momentum",
            sector="Technology"
        )
        self.tracker.take_snapshot(timestamp=0)

        heat_map = self.tracker.get_heat_map_data()

        self.assertEqual(len(heat_map), 2)

        # Verify data structure
        for item in heat_map:
            self.assertIn('symbol', item)
            self.assertIn('value_cents', item)
            self.assertIn('value_dollars', item)
            self.assertIn('weight_percent', item)
            self.assertIn('weight_scaled', item)
            self.assertIn('strategy', item)
            self.assertIn('sector', item)
            self.assertIn('direction', item)

    def test_heat_map_sorting(self):
        """Test that heat map is sorted by value (largest first)."""
        # Add positions with different sizes
        self.tracker.update_position(
            position_id="pos_001",
            symbol="SMALL",
            quantity=10,
            price_cents=10000,
            strategy="Test"
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="LARGE",
            quantity=100,
            price_cents=50000,
            strategy="Test"
        )
        self.tracker.update_position(
            position_id="pos_003",
            symbol="MEDIUM",
            quantity=50,
            price_cents=20000,
            strategy="Test"
        )
        self.tracker.take_snapshot(timestamp=0)

        heat_map = self.tracker.get_heat_map_data()

        # Should be sorted: LARGE, MEDIUM, SMALL
        self.assertEqual(heat_map[0]['symbol'], "LARGE")
        self.assertEqual(heat_map[1]['symbol'], "MEDIUM")
        self.assertEqual(heat_map[2]['symbol'], "SMALL")

    def test_heat_map_with_long_and_short(self):
        """Test heat map with long and short positions."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="LONG_POS",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="SHORT_POS",
            quantity=-50,
            price_cents=20000,
            strategy="Test"
        )
        self.tracker.take_snapshot(timestamp=0)

        heat_map = self.tracker.get_heat_map_data()

        # Find positions
        long_pos = next(p for p in heat_map if p['symbol'] == "LONG_POS")
        short_pos = next(p for p in heat_map if p['symbol'] == "SHORT_POS")

        self.assertEqual(long_pos['direction'], 'LONG')
        self.assertEqual(short_pos['direction'], 'SHORT')


class TestSummaryStatistics(unittest.TestCase):
    """Test summary statistics calculation."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_summary_with_snapshots(self):
        """Test summary statistics with multiple snapshots."""
        # Create multiple snapshots
        for i in range(5):
            self.tracker.update_position(
                position_id="pos_001",
                symbol="AAPL",
                quantity=100,
                price_cents=15000 + i * 100,
                strategy="Test",
                timestamp=i
            )
            self.tracker.take_snapshot(timestamp=i)

        summary = self.tracker.get_summary_statistics()

        self.assertEqual(summary['num_snapshots'], 5)
        self.assertIn('avg_gmv', summary)
        self.assertIn('max_gmv', summary)
        self.assertIn('min_gmv', summary)
        self.assertIn('avg_positions', summary)

    def test_summary_empty(self):
        """Test summary with no snapshots."""
        summary = self.tracker.get_summary_statistics()

        self.assertEqual(summary['num_snapshots'], 0)
        self.assertEqual(summary['avg_gmv'], '$0.00')


class TestIntegerOnlyArithmetic(unittest.TestCase):
    """Test that all calculations use integer-only arithmetic."""

    def setUp(self):
        """Set up test fixtures."""
        self.tracker = GMVTracker()

    def test_no_float_in_position_value(self):
        """Test position value calculation uses integers only."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        position = self.tracker.current_positions["pos_001"]
        self.assertIsInstance(position.value_cents, int)
        self.assertIsInstance(position.abs_value_cents, int)

    def test_no_float_in_gmv_calculation(self):
        """Test GMV calculation uses integers only."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        self.assertIsInstance(snapshot.total_gmv_cents, int)
        self.assertIsInstance(snapshot.long_gmv_cents, int)
        self.assertIsInstance(snapshot.short_gmv_cents, int)
        self.assertIsInstance(snapshot.net_exposure_cents, int)

    def test_no_float_in_concentration(self):
        """Test concentration metrics use integers only."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Test"
        )
        self.tracker.update_position(
            position_id="pos_002",
            symbol="GOOGL",
            quantity=50,
            price_cents=28000,
            strategy="Test"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        self.assertIsInstance(snapshot.top_position_concentration_scaled, int)
        self.assertIsInstance(snapshot.top_5_concentration_scaled, int)

    def test_no_float_in_breakdowns(self):
        """Test field breakdowns use integers only."""
        self.tracker.update_position(
            position_id="pos_001",
            symbol="AAPL",
            quantity=100,
            price_cents=15000,
            strategy="Fibonacci",
            sector="Technology"
        )

        snapshot = self.tracker.take_snapshot(timestamp=0)

        # Check all breakdown values are integers
        for gmv in snapshot.gmv_by_strategy.values():
            self.assertIsInstance(gmv, int)

        for gmv in snapshot.gmv_by_symbol.values():
            self.assertIsInstance(gmv, int)

        for gmv in snapshot.gmv_by_sector.values():
            self.assertIsInstance(gmv, int)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestPositionGMV))
    suite.addTests(loader.loadTestsFromTestCase(TestGMVTracker))
    suite.addTests(loader.loadTestsFromTestCase(TestGMVSnapshot))
    suite.addTests(loader.loadTestsFromTestCase(TestFieldBreakdowns))
    suite.addTests(loader.loadTestsFromTestCase(TestConcentrationMetrics))
    suite.addTests(loader.loadTestsFromTestCase(TestTimeSeries))
    suite.addTests(loader.loadTestsFromTestCase(TestHeatMapData))
    suite.addTests(loader.loadTestsFromTestCase(TestSummaryStatistics))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerOnlyArithmetic))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result


if __name__ == '__main__':
    result = run_tests()
    sys.exit(0 if result.wasSuccessful() else 1)
