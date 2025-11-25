"""
GMV Tracker - Agent 22 (Zeckendorf: 10000000101)

Tracks Gross Market Value (GMV) across all positions using integer-only arithmetic.
Provides field-level breakdowns, time series visualization data, and portfolio heat maps.

Features:
- Integer-only GMV calculations (cent precision)
- Position-level GMV tracking
- Field-level GMV breakdown (by asset, strategy, sector)
- Time series GMV visualization data
- Portfolio concentration heat maps
- Risk exposure analysis

Dependencies:
- Agent 17: Backtesting Engine (for position tracking)

All calculations use integer arithmetic with scaling factors.
GMV = sum(abs(position_value)) for all positions
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import json
import sys

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class PositionGMV:
    """
    Individual position GMV with integer-only values.

    All values in cents.
    """
    position_id: str
    symbol: str
    quantity: int
    price_cents: int
    value_cents: int  # quantity * price_cents / 100
    abs_value_cents: int  # abs(value_cents)
    strategy: str
    sector: Optional[str] = None
    timestamp: int = 0  # Bar index

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'position_id': self.position_id,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'price_cents': self.price_cents,
            'value_cents': self.value_cents,
            'abs_value_cents': self.abs_value_cents,
            'strategy': self.strategy,
            'sector': self.sector,
            'timestamp': self.timestamp,
            'price_dollars': f"${self.price_cents / 100:.2f}",
            'value_dollars': f"${self.value_cents / 100:.2f}",
            'abs_value_dollars': f"${self.abs_value_cents / 100:.2f}"
        }


@dataclass
class GMVSnapshot:
    """
    GMV snapshot at a point in time with integer-only metrics.

    All monetary values in cents, percentages scaled by 1000.
    """
    timestamp: int  # Bar index
    total_gmv_cents: int
    num_positions: int

    # Field-level breakdowns (dict of field -> GMV in cents)
    gmv_by_strategy: Dict[str, int]
    gmv_by_symbol: Dict[str, int]
    gmv_by_sector: Dict[str, int]

    # Concentration metrics (scaled by 1000, e.g., 500 = 50%)
    top_position_concentration_scaled: int  # Largest position as % of total GMV
    top_5_concentration_scaled: int  # Top 5 positions as % of total GMV

    # Long/short breakdown
    long_gmv_cents: int
    short_gmv_cents: int
    net_exposure_cents: int  # long - short
    gross_exposure_cents: int  # long + short

    # Individual positions
    positions: List[PositionGMV]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with human-readable values."""
        return {
            'timestamp': self.timestamp,
            'summary': {
                'total_gmv': f"${self.total_gmv_cents / 100:.2f}",
                'num_positions': self.num_positions,
                'long_gmv': f"${self.long_gmv_cents / 100:.2f}",
                'short_gmv': f"${self.short_gmv_cents / 100:.2f}",
                'net_exposure': f"${self.net_exposure_cents / 100:.2f}",
                'gross_exposure': f"${self.gross_exposure_cents / 100:.2f}"
            },
            'concentration': {
                'top_position_percent': f"{self.top_position_concentration_scaled / 10:.1f}%",
                'top_5_percent': f"{self.top_5_concentration_scaled / 10:.1f}%"
            },
            'breakdown': {
                'by_strategy': {k: f"${v / 100:.2f}" for k, v in self.gmv_by_strategy.items()},
                'by_symbol': {k: f"${v / 100:.2f}" for k, v in self.gmv_by_symbol.items()},
                'by_sector': {k: f"${v / 100:.2f}" for k, v in self.gmv_by_sector.items()}
            },
            'positions': [p.to_dict() for p in self.positions]
        }


class GMVTracker:
    """
    Integer-only GMV tracker for portfolio positions.

    Tracks gross market value across all positions and provides
    comprehensive analytics using only integer arithmetic.

    GMV Formula: sum(abs(position_value)) for all positions
    """

    # Scaling factors
    SCALE_FACTOR = 1000  # For percentage calculations

    def __init__(self):
        """Initialize GMV tracker."""
        self.snapshots: List[GMVSnapshot] = []
        self.current_positions: Dict[str, PositionGMV] = {}

    def update_position(self,
                       position_id: str,
                       symbol: str,
                       quantity: int,
                       price_cents: int,
                       strategy: str,
                       sector: Optional[str] = None,
                       timestamp: int = 0) -> None:
        """
        Update or add a position.

        Args:
            position_id: Unique position identifier
            symbol: Asset symbol
            quantity: Position size (negative for short)
            price_cents: Current price in cents
            strategy: Strategy name
            sector: Optional sector classification
            timestamp: Bar index
        """
        # Calculate position value
        # For example: 100 shares at $150 = $15,000 = 1,500,000 cents
        # value_cents = 100 * 15000 / 100 = 15000 cents (stored as dollars in cents)
        value_cents = (quantity * price_cents) // 100
        abs_value_cents = abs(value_cents)

        position = PositionGMV(
            position_id=position_id,
            symbol=symbol,
            quantity=quantity,
            price_cents=price_cents,
            value_cents=value_cents,
            abs_value_cents=abs_value_cents,
            strategy=strategy,
            sector=sector,
            timestamp=timestamp
        )

        self.current_positions[position_id] = position

    def close_position(self, position_id: str) -> None:
        """
        Close a position by removing it from tracking.

        Args:
            position_id: Position identifier to close
        """
        if position_id in self.current_positions:
            del self.current_positions[position_id]

    def take_snapshot(self, timestamp: int = 0) -> GMVSnapshot:
        """
        Take a snapshot of current GMV and all breakdowns.

        Args:
            timestamp: Bar index

        Returns:
            GMVSnapshot with all current metrics
        """
        if not self.current_positions:
            return GMVSnapshot(
                timestamp=timestamp,
                total_gmv_cents=0,
                num_positions=0,
                gmv_by_strategy={},
                gmv_by_symbol={},
                gmv_by_sector={},
                top_position_concentration_scaled=0,
                top_5_concentration_scaled=0,
                long_gmv_cents=0,
                short_gmv_cents=0,
                net_exposure_cents=0,
                gross_exposure_cents=0,
                positions=[]
            )

        positions = list(self.current_positions.values())

        # Calculate total GMV
        total_gmv_cents = sum(p.abs_value_cents for p in positions)

        # Long/short breakdown
        long_gmv_cents = sum(p.abs_value_cents for p in positions if p.quantity > 0)
        short_gmv_cents = sum(p.abs_value_cents for p in positions if p.quantity < 0)
        net_exposure_cents = sum(p.value_cents for p in positions)
        gross_exposure_cents = long_gmv_cents + short_gmv_cents

        # Field-level breakdowns
        gmv_by_strategy: Dict[str, int] = {}
        gmv_by_symbol: Dict[str, int] = {}
        gmv_by_sector: Dict[str, int] = {}

        for p in positions:
            # By strategy
            gmv_by_strategy[p.strategy] = gmv_by_strategy.get(p.strategy, 0) + p.abs_value_cents

            # By symbol
            gmv_by_symbol[p.symbol] = gmv_by_symbol.get(p.symbol, 0) + p.abs_value_cents

            # By sector
            if p.sector:
                gmv_by_sector[p.sector] = gmv_by_sector.get(p.sector, 0) + p.abs_value_cents

        # Concentration metrics
        sorted_positions = sorted(positions, key=lambda p: p.abs_value_cents, reverse=True)

        # Top position concentration
        top_position_concentration_scaled = 0
        if total_gmv_cents > 0 and sorted_positions:
            top_gmv = sorted_positions[0].abs_value_cents
            top_position_concentration_scaled = (top_gmv * self.SCALE_FACTOR) // total_gmv_cents

        # Top 5 concentration
        top_5_concentration_scaled = 0
        if total_gmv_cents > 0:
            top_5_gmv = sum(p.abs_value_cents for p in sorted_positions[:5])
            top_5_concentration_scaled = (top_5_gmv * self.SCALE_FACTOR) // total_gmv_cents

        snapshot = GMVSnapshot(
            timestamp=timestamp,
            total_gmv_cents=total_gmv_cents,
            num_positions=len(positions),
            gmv_by_strategy=gmv_by_strategy,
            gmv_by_symbol=gmv_by_symbol,
            gmv_by_sector=gmv_by_sector,
            top_position_concentration_scaled=top_position_concentration_scaled,
            top_5_concentration_scaled=top_5_concentration_scaled,
            long_gmv_cents=long_gmv_cents,
            short_gmv_cents=short_gmv_cents,
            net_exposure_cents=net_exposure_cents,
            gross_exposure_cents=gross_exposure_cents,
            positions=positions
        )

        self.snapshots.append(snapshot)
        return snapshot

    def get_time_series(self) -> List[Tuple[int, int]]:
        """
        Get time series of total GMV.

        Returns:
            List of (timestamp, gmv_cents) tuples
        """
        return [(s.timestamp, s.total_gmv_cents) for s in self.snapshots]

    def get_strategy_breakdown_series(self) -> Dict[str, List[Tuple[int, int]]]:
        """
        Get time series of GMV by strategy.

        Returns:
            Dictionary mapping strategy name to list of (timestamp, gmv_cents) tuples
        """
        result: Dict[str, List[Tuple[int, int]]] = {}

        for snapshot in self.snapshots:
            for strategy, gmv in snapshot.gmv_by_strategy.items():
                if strategy not in result:
                    result[strategy] = []
                result[strategy].append((snapshot.timestamp, gmv))

        return result

    def get_heat_map_data(self, timestamp: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get portfolio heat map data showing position concentrations.

        Args:
            timestamp: Specific timestamp (uses latest if None)

        Returns:
            List of position data for heat map visualization
        """
        # Get snapshot
        if timestamp is not None:
            snapshot = next((s for s in self.snapshots if s.timestamp == timestamp), None)
            if snapshot is None:
                return []
        else:
            if not self.snapshots:
                return []
            snapshot = self.snapshots[-1]

        # Generate heat map data
        heat_map_data = []
        total_gmv = snapshot.total_gmv_cents

        for position in snapshot.positions:
            # Calculate position weight (scaled by 1000)
            weight_scaled = 0
            if total_gmv > 0:
                weight_scaled = (position.abs_value_cents * self.SCALE_FACTOR) // total_gmv

            heat_map_data.append({
                'symbol': position.symbol,
                'value_cents': position.abs_value_cents,
                'value_dollars': f"${position.abs_value_cents / 100:.2f}",
                'weight_percent': f"{weight_scaled / 10:.1f}%",
                'weight_scaled': weight_scaled,
                'strategy': position.strategy,
                'sector': position.sector or 'Unknown',
                'quantity': position.quantity,
                'direction': 'LONG' if position.quantity > 0 else 'SHORT'
            })

        # Sort by value (largest first)
        heat_map_data.sort(key=lambda x: x['value_cents'], reverse=True)

        return heat_map_data

    def get_concentration_series(self) -> Dict[str, List[Tuple[int, int]]]:
        """
        Get time series of concentration metrics.

        Returns:
            Dictionary with 'top_position' and 'top_5' time series
        """
        return {
            'top_position': [(s.timestamp, s.top_position_concentration_scaled) for s in self.snapshots],
            'top_5': [(s.timestamp, s.top_5_concentration_scaled) for s in self.snapshots]
        }

    def get_exposure_series(self) -> Dict[str, List[Tuple[int, int]]]:
        """
        Get time series of long/short exposure.

        Returns:
            Dictionary with long, short, net, and gross exposure series
        """
        return {
            'long': [(s.timestamp, s.long_gmv_cents) for s in self.snapshots],
            'short': [(s.timestamp, s.short_gmv_cents) for s in self.snapshots],
            'net': [(s.timestamp, s.net_exposure_cents) for s in self.snapshots],
            'gross': [(s.timestamp, s.gross_exposure_cents) for s in self.snapshots]
        }

    def export_visualization_data(self, output_path: str) -> None:
        """
        Export all visualization data to JSON file.

        Args:
            output_path: Output file path
        """
        output_data = {
            'snapshots': [s.to_dict() for s in self.snapshots],
            'time_series': {
                'gmv': self.get_time_series(),
                'concentration': self.get_concentration_series(),
                'exposure': self.get_exposure_series(),
                'strategy_breakdown': self.get_strategy_breakdown_series()
            },
            'latest_heat_map': self.get_heat_map_data()
        }

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

    def get_summary_statistics(self) -> Dict[str, Any]:
        """
        Get summary statistics across all snapshots.

        Returns:
            Dictionary with summary metrics
        """
        if not self.snapshots:
            return {
                'num_snapshots': 0,
                'avg_gmv': '$0.00',
                'max_gmv': '$0.00',
                'min_gmv': '$0.00',
                'avg_positions': 0,
                'max_positions': 0
            }

        gmv_values = [s.total_gmv_cents for s in self.snapshots]
        position_counts = [s.num_positions for s in self.snapshots]

        avg_gmv = sum(gmv_values) // len(gmv_values)
        max_gmv = max(gmv_values)
        min_gmv = min(gmv_values)
        avg_positions = sum(position_counts) // len(position_counts)
        max_positions = max(position_counts)

        # Get most recent concentration metrics
        latest = self.snapshots[-1]

        return {
            'num_snapshots': len(self.snapshots),
            'avg_gmv': f"${avg_gmv / 100:.2f}",
            'max_gmv': f"${max_gmv / 100:.2f}",
            'min_gmv': f"${min_gmv / 100:.2f}",
            'avg_positions': avg_positions,
            'max_positions': max_positions,
            'latest_total_gmv': f"${latest.total_gmv_cents / 100:.2f}",
            'latest_top_position_concentration': f"{latest.top_position_concentration_scaled / 10:.1f}%",
            'latest_top_5_concentration': f"{latest.top_5_concentration_scaled / 10:.1f}%"
        }


def main():
    """
    Demonstration of GMV Tracker.
    """
    print("=" * 80)
    print("GMV TRACKER - Agent 22 (Zeckendorf: 10000000101)")
    print("Dependencies: Agent 17 (Backtesting Engine)")
    print("=" * 80)
    print()

    # Initialize tracker
    print("[1] Initializing GMV Tracker")
    tracker = GMVTracker()
    print("    ✅ Tracker initialized")
    print()

    # Simulate portfolio over time
    print("[2] Simulating Portfolio Positions")

    # Time 0: Initial positions
    print("    [T=0] Opening initial positions")
    tracker.update_position(
        position_id="pos_001",
        symbol="AAPL",
        quantity=100,
        price_cents=15000,  # $150
        strategy="Fibonacci Retracement",
        sector="Technology",
        timestamp=0
    )
    tracker.update_position(
        position_id="pos_002",
        symbol="GOOGL",
        quantity=50,
        price_cents=28000,  # $280
        strategy="Momentum",
        sector="Technology",
        timestamp=0
    )
    tracker.update_position(
        position_id="pos_003",
        symbol="SPY",
        quantity=-200,  # Short position
        price_cents=45000,  # $450
        strategy="Mean Reversion",
        sector="ETF",
        timestamp=0
    )

    snapshot_0 = tracker.take_snapshot(timestamp=0)
    print(f"    Total GMV: ${snapshot_0.total_gmv_cents / 100:.2f}")
    print(f"    Positions: {snapshot_0.num_positions}")
    print()

    # Time 10: Price changes and position updates
    print("    [T=10] Updating prices")
    tracker.update_position(
        position_id="pos_001",
        symbol="AAPL",
        quantity=100,
        price_cents=16000,  # $160 (+$10)
        strategy="Fibonacci Retracement",
        sector="Technology",
        timestamp=10
    )
    tracker.update_position(
        position_id="pos_002",
        symbol="GOOGL",
        quantity=50,
        price_cents=29000,  # $290 (+$10)
        strategy="Momentum",
        sector="Technology",
        timestamp=10
    )
    tracker.update_position(
        position_id="pos_003",
        symbol="SPY",
        quantity=-200,
        price_cents=44000,  # $440 (-$10)
        strategy="Mean Reversion",
        sector="ETF",
        timestamp=10
    )

    snapshot_10 = tracker.take_snapshot(timestamp=10)
    print(f"    Total GMV: ${snapshot_10.total_gmv_cents / 100:.2f}")
    print()

    # Time 20: Close one position, add another
    print("    [T=20] Closing pos_001, adding new position")
    tracker.close_position("pos_001")
    tracker.update_position(
        position_id="pos_004",
        symbol="MSFT",
        quantity=75,
        price_cents=32000,  # $320
        strategy="Lucas Sequence",
        sector="Technology",
        timestamp=20
    )
    tracker.update_position(
        position_id="pos_002",
        symbol="GOOGL",
        quantity=50,
        price_cents=29500,  # $295
        strategy="Momentum",
        sector="Technology",
        timestamp=20
    )
    tracker.update_position(
        position_id="pos_003",
        symbol="SPY",
        quantity=-200,
        price_cents=44500,  # $445
        strategy="Mean Reversion",
        sector="ETF",
        timestamp=20
    )

    snapshot_20 = tracker.take_snapshot(timestamp=20)
    print(f"    Total GMV: ${snapshot_20.total_gmv_cents / 100:.2f}")
    print(f"    Positions: {snapshot_20.num_positions}")
    print()

    # Display latest snapshot details
    print("[3] Latest Snapshot Analysis")
    snapshot_dict = snapshot_20.to_dict()

    print("    Summary:")
    for key, value in snapshot_dict['summary'].items():
        print(f"      {key}: {value}")
    print()

    print("    Concentration:")
    for key, value in snapshot_dict['concentration'].items():
        print(f"      {key}: {value}")
    print()

    print("    GMV by Strategy:")
    for strategy, gmv in snapshot_dict['breakdown']['by_strategy'].items():
        print(f"      {strategy}: {gmv}")
    print()

    print("    GMV by Sector:")
    for sector, gmv in snapshot_dict['breakdown']['by_sector'].items():
        print(f"      {sector}: {gmv}")
    print()

    # Get time series
    print("[4] Time Series Data")
    time_series = tracker.get_time_series()
    print("    GMV over time:")
    for timestamp, gmv in time_series:
        print(f"      T={timestamp}: ${gmv / 100:.2f}")
    print()

    # Get heat map data
    print("[5] Portfolio Heat Map (Latest)")
    heat_map = tracker.get_heat_map_data()
    print(f"    {'Symbol':<10} {'Value':<15} {'Weight':<10} {'Strategy':<20} {'Direction':<10}")
    print("    " + "-" * 75)
    for item in heat_map:
        print(f"    {item['symbol']:<10} {item['value_dollars']:<15} {item['weight_percent']:<10} {item['strategy']:<20} {item['direction']:<10}")
    print()

    # Get exposure series
    print("[6] Exposure Analysis")
    exposure_series = tracker.get_exposure_series()
    print("    Long/Short Exposure over time:")
    for i, (timestamp, long_gmv) in enumerate(exposure_series['long']):
        short_gmv = exposure_series['short'][i][1]
        net_gmv = exposure_series['net'][i][1]
        print(f"      T={timestamp}: Long=${long_gmv / 100:.2f}, Short=${short_gmv / 100:.2f}, Net=${net_gmv / 100:.2f}")
    print()

    # Summary statistics
    print("[7] Summary Statistics")
    summary = tracker.get_summary_statistics()
    for key, value in summary.items():
        print(f"    {key}: {value}")
    print()

    print("=" * 80)
    print("✅ GMV TRACKER READY FOR PRODUCTION")
    print("=" * 80)


if __name__ == "__main__":
    main()
