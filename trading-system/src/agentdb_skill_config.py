"""
AgentDB Skill Configuration for Mathematical Framework Patterns
This module provides integration with AgentDB for storing and retrieving
proven calculation patterns from the integer-only mathematical framework.
"""

import json
import os
from typing import Dict, List, Optional, Any
from mathematical_framework import IntegerMathFramework


class AgentDBMathematicalSkill:
    """
    AgentDB skill for mathematical pattern storage and retrieval.
    Integrates with AgentDB to store Fibonacci, Lucas, and Zeckendorf patterns.
    """

    def __init__(self, patterns_file: str = "agentdb_patterns.json"):
        """
        Initialize AgentDB skill with patterns file.

        Args:
            patterns_file: Path to JSON patterns file
        """
        self.patterns_file = patterns_file
        self.framework = IntegerMathFramework(max_index=100)
        self.patterns = self._load_patterns()

    def _load_patterns(self) -> Dict:
        """Load patterns from JSON file."""
        patterns_path = os.path.join(
            os.path.dirname(__file__),
            self.patterns_file
        )

        if os.path.exists(patterns_path):
            with open(patterns_path, 'r') as f:
                return json.load(f)
        return {}

    def _save_patterns(self) -> None:
        """Save patterns to JSON file."""
        patterns_path = os.path.join(
            os.path.dirname(__file__),
            self.patterns_file
        )

        with open(patterns_path, 'w') as f:
            json.dump(self.patterns, f, indent=2)

    def store_fibonacci_pattern(
        self,
        pattern_id: str,
        price: int,
        description: str = ""
    ) -> Dict:
        """
        Store Fibonacci price encoding pattern.

        Args:
            pattern_id: Unique pattern identifier
            price: Price value
            description: Pattern description

        Returns:
            Stored pattern data
        """
        index = self.framework.fib_encoder.encode_price(price)
        fib_value = self.framework.fib_encoder.decode_price(index)
        support, resistance = self.framework.fib_encoder.find_support_resistance(
            price,
            levels=3
        )

        pattern = {
            "price": price,
            "index": index,
            "fibonacci_value": fib_value,
            "type": "exact_match" if price == fib_value else "between_levels",
            "support": support,
            "resistance": resistance,
            "description": description
        }

        if "fibonacci_patterns" not in self.patterns:
            self.patterns["fibonacci_patterns"] = {}

        if "custom_patterns" not in self.patterns["fibonacci_patterns"]:
            self.patterns["fibonacci_patterns"]["custom_patterns"] = []

        self.patterns["fibonacci_patterns"]["custom_patterns"].append({
            "id": pattern_id,
            "data": pattern
        })

        self._save_patterns()
        return pattern

    def store_lucas_pattern(
        self,
        pattern_id: str,
        time_units: int,
        description: str = ""
    ) -> Dict:
        """
        Store Lucas time encoding pattern.

        Args:
            pattern_id: Unique pattern identifier
            time_units: Time in discrete units
            description: Pattern description

        Returns:
            Stored pattern data
        """
        index = self.framework.lucas_encoder.encode_time(time_units)
        lucas_value = self.framework.lucas_encoder.get_lucas(index)
        is_equilibrium = self.framework.lucas_encoder.is_nash_equilibrium_point(index)
        next_eq = self.framework.lucas_encoder.next_equilibrium_time(time_units)

        pattern = {
            "time_units": time_units,
            "index": index,
            "lucas_value": lucas_value,
            "is_equilibrium": is_equilibrium,
            "next_equilibrium": next_eq,
            "description": description
        }

        if "lucas_patterns" not in self.patterns:
            self.patterns["lucas_patterns"] = {}

        if "custom_patterns" not in self.patterns["lucas_patterns"]:
            self.patterns["lucas_patterns"]["custom_patterns"] = []

        self.patterns["lucas_patterns"]["custom_patterns"].append({
            "id": pattern_id,
            "data": pattern
        })

        self._save_patterns()
        return pattern

    def store_zeckendorf_pattern(
        self,
        pattern_id: str,
        value: int,
        description: str = ""
    ) -> Dict:
        """
        Store Zeckendorf compression pattern.

        Args:
            pattern_id: Unique pattern identifier
            value: Value to compress
            description: Pattern description

        Returns:
            Stored pattern data
        """
        indices = self.framework.zeckendorf.compress(value)
        golf_score = self.framework.zeckendorf.golf_score(value)
        ratio = self.framework.zeckendorf.compression_ratio(value)

        # Calculate rating
        if golf_score <= -3:
            rating = "eagle"
        elif golf_score == -2:
            rating = "eagle"
        elif golf_score == -1:
            rating = "birdie"
        elif golf_score == 0:
            rating = "par"
        elif golf_score == 1:
            rating = "bogey"
        else:
            rating = "double_bogey"

        # Build Fibonacci sum string
        fib_values = [
            self.framework.fib_encoder.get_fibonacci(idx)
            for idx in indices
        ]
        fib_sum = " + ".join(f"F({idx})" for idx in indices)
        fib_sum += f" = {sum(fib_values)}"

        pattern = {
            "value": value,
            "indices": indices,
            "fibonacci_sum": fib_sum,
            "golf_score": golf_score,
            "rating": rating,
            "compression_ratio": ratio,
            "description": description
        }

        if "zeckendorf_patterns" not in self.patterns:
            self.patterns["zeckendorf_patterns"] = {}

        if "custom_patterns" not in self.patterns["zeckendorf_patterns"]:
            self.patterns["zeckendorf_patterns"]["custom_patterns"] = []

        self.patterns["zeckendorf_patterns"]["custom_patterns"].append({
            "id": pattern_id,
            "data": pattern
        })

        self._save_patterns()
        return pattern

    def store_trading_strategy(
        self,
        strategy_id: str,
        strategy_data: Dict,
        description: str = ""
    ) -> Dict:
        """
        Store complete trading strategy with encoded price/time.

        Args:
            strategy_id: Unique strategy identifier
            strategy_data: Dictionary with strategy parameters
            description: Strategy description

        Returns:
            Stored strategy data
        """
        # Encode price and time if provided
        if "entry_price" in strategy_data:
            price_idx = self.framework.fib_encoder.encode_price(
                strategy_data["entry_price"]
            )
            strategy_data["price_index"] = price_idx

        if "time_horizon" in strategy_data:
            time_idx = self.framework.lucas_encoder.encode_time(
                strategy_data["time_horizon"]
            )
            strategy_data["time_index"] = time_idx

        strategy_data["description"] = description

        if "trading_strategies" not in self.patterns:
            self.patterns["trading_strategies"] = {}

        self.patterns["trading_strategies"][strategy_id] = strategy_data
        self._save_patterns()

        return strategy_data

    def retrieve_pattern(
        self,
        category: str,
        pattern_id: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Retrieve pattern by category and ID.

        Args:
            category: Pattern category (fibonacci_patterns, lucas_patterns, etc.)
            pattern_id: Optional specific pattern ID

        Returns:
            Pattern data or None
        """
        if category not in self.patterns:
            return None

        if pattern_id is None:
            return self.patterns[category]

        # Search in custom patterns
        if "custom_patterns" in self.patterns[category]:
            for pattern in self.patterns[category]["custom_patterns"]:
                if pattern["id"] == pattern_id:
                    return pattern["data"]

        # Search in root level (for trading strategies)
        if pattern_id in self.patterns[category]:
            return self.patterns[category][pattern_id]

        return None

    def export_for_agentdb(self) -> str:
        """
        Export patterns in AgentDB-compatible format.

        Returns:
            JSON string for AgentDB storage
        """
        agentdb_format = {
            "skill_name": "mathematical_framework_patterns",
            "skill_version": "1.0.0",
            "skill_type": "calculation_patterns",
            "oeis_validated": True,
            "sequences": ["A000045", "A000032", "A003714"],
            "patterns": self.patterns
        }

        return json.dumps(agentdb_format, indent=2)

    def import_from_agentdb(self, json_data: str) -> None:
        """
        Import patterns from AgentDB format.

        Args:
            json_data: JSON string from AgentDB
        """
        data = json.loads(json_data)
        if "patterns" in data:
            self.patterns = data["patterns"]
            self._save_patterns()

    def get_all_patterns(self) -> Dict:
        """Get all stored patterns."""
        return self.patterns

    def clear_custom_patterns(self) -> None:
        """Clear all custom patterns (preserve defaults)."""
        for category in ["fibonacci_patterns", "lucas_patterns", "zeckendorf_patterns"]:
            if category in self.patterns and "custom_patterns" in self.patterns[category]:
                self.patterns[category]["custom_patterns"] = []

        self._save_patterns()


# CLI interface for AgentDB skill creation
def create_agentdb_skill():
    """
    CLI command to create AgentDB skill from patterns.
    Usage: python agentdb_skill_config.py
    """
    skill = AgentDBMathematicalSkill()
    json_output = skill.export_for_agentdb()

    # Save to file
    output_file = os.path.join(
        os.path.dirname(__file__),
        "agentdb_skill_export.json"
    )

    with open(output_file, 'w') as f:
        f.write(json_output)

    print(f"AgentDB skill exported to: {output_file}")
    print("\nTo create AgentDB skill, run:")
    print(f"npx agentdb skill create --file {output_file}")

    return output_file


if __name__ == "__main__":
    create_agentdb_skill()
