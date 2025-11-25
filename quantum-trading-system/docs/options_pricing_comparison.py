"""
Options Pricing Comparison Report Generator
============================================

Demonstrates all three pricing methods and generates comparison report.

Author: Agent 11 (Zeckendorf: 10100)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from models.options_pricing import (
    OptionsPricingEngine,
    create_call_option,
    create_put_option,
    SCALE
)
import json


def main():
    """Generate options pricing comparison report."""

    print("=" * 80)
    print("OPTIONS PRICING ENGINE - COMPARISON REPORT")
    print("Agent 11 (Zeckendorf: 10100)")
    print("=" * 80)
    print()

    # Initialize engine
    engine = OptionsPricingEngine(scale=SCALE)

    # Generate training data for QFNN
    print("📊 Step 1: Generating training data for QFNN...")
    training_data = []

    # Training set: Various strikes and spot prices
    for spot in [90, 95, 100, 105, 110]:
        for strike in [95, 100, 105]:
            contract = create_call_option(
                spot * SCALE, strike * SCALE, 30, 2000, 500
            )

            # Synthetic premium (for demo purposes)
            intrinsic = max(0, spot - strike) * SCALE
            time_value = int((30 / 365) * 20 * SCALE)  # Simplified
            premium = intrinsic + time_value

            training_data.append((contract, premium))

    print(f"   Generated {len(training_data)} training samples")

    # Train QFNN
    print("\n🧠 Step 2: Training QFNN pricing engine...")
    engine.train_qfnn(training_data, epochs=50, learning_rate=100)

    # Generate price history for Xi/Psi
    print("\n📈 Step 3: Generating price history for Xi/Psi...")
    price_history = [i * SCALE for i in range(90, 105)]
    print(f"   Price range: ${min(price_history)/SCALE:.2f} to ${max(price_history)/SCALE:.2f}")

    # Test contracts
    test_contracts = [
        ("ATM Call", create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)),
        ("ITM Call", create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500)),
        ("OTM Call", create_call_option(95 * SCALE, 100 * SCALE, 30, 2000, 500)),
        ("ATM Put", create_put_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)),
        ("ITM Put", create_put_option(95 * SCALE, 100 * SCALE, 30, 2000, 500)),
        ("OTM Put", create_put_option(105 * SCALE, 100 * SCALE, 30, 2000, 500)),
    ]

    print("\n" + "=" * 80)
    print("PRICING RESULTS")
    print("=" * 80)

    results_table = []

    for name, contract in test_contracts:
        print(f"\n{name}:")
        print(f"  Spot: ${contract.spot/SCALE:.2f}")
        print(f"  Strike: ${contract.strike/SCALE:.2f}")
        print(f"  Expiry: {contract.expiry} days")
        print(f"  Volatility: {contract.volatility/100:.1f}%")
        print(f"  Rate: {contract.rate/100:.1f}%")
        print()

        prices = engine.price_all_methods(contract, price_history)

        result_row = {
            'contract': name,
            'spot': contract.spot,
            'strike': contract.strike,
            'prices': {}
        }

        for method, price in prices.items():
            print(f"  [{method.upper()}]")
            print(f"    Premium: ${price.premium/SCALE:.2f}")
            print(f"    Delta: {price.delta/SCALE:.4f}")

            result_row['prices'][method] = {
                'premium': price.premium / SCALE,
                'delta': price.delta / SCALE,
            }

        results_table.append(result_row)

    # Inter-method comparison
    print("\n" + "=" * 80)
    print("METHOD COMPARISON ANALYSIS")
    print("=" * 80)

    for name, contract in test_contracts[:3]:  # First 3 contracts
        print(f"\n{name}:")

        actual_premium = 3 * SCALE  # Synthetic market premium
        report = engine.compare_methods(contract, price_history, actual_premium)

        if 'comparison' in report:
            print("\n  Accuracy vs Market Price ($3.00):")
            for method, stats in report['comparison'].items():
                error_pct = stats['error_pct'] / 100
                accuracy = stats['accuracy'] / 100
                print(f"    {method:15s}: Error={error_pct:.1f}%  Accuracy={accuracy:.1f}%")

        if 'inter_method_agreement' in report:
            agreement = report['inter_method_agreement'] / 100
            print(f"\n  Inter-Method Agreement: {agreement:.1f}%")

    # Backtesting
    print("\n" + "=" * 80)
    print("BACKTESTING RESULTS")
    print("=" * 80)

    test_data = []
    for spot in [98, 100, 102]:
        contract = create_call_option(spot * SCALE, 100 * SCALE, 30, 2000, 500)
        actual = (max(0, spot - 100) * SCALE) + (2 * SCALE)  # Intrinsic + $2 time value
        history = [i * SCALE for i in range(95, spot + 1)]
        test_data.append((contract, actual, history))

    backtest_report = engine.backtest(test_data)

    print("\nBacktest Summary:")
    for method, stats in backtest_report.items():
        print(f"\n  {method.upper()}:")
        print(f"    Trades: {stats['num_trades']}")
        print(f"    Mean Error: ${stats['mean_error']/SCALE:.2f}")
        print(f"    RMSE: ${stats['rmse']/SCALE:.2f}")
        print(f"    Max Error: ${stats['max_error']/SCALE:.2f}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    print("✅ All three pricing methods implemented:")
    print("   1. Black-Scholes (classical integer arithmetic)")
    print("   2. QFNN (quantum neural network)")
    print("   3. Xi/Psi (phase space dynamics)")
    print()
    print("✅ Integer-only calculations throughout")
    print("✅ Comparison metrics computed")
    print("✅ Backtesting complete")
    print()
    print("=" * 80)

    # Save report
    output_path = Path(__file__).parent / "options_pricing_report.json"
    with open(output_path, 'w') as f:
        json.dump({
            'summary': 'Options Pricing Comparison Report',
            'agent': 'Agent 11',
            'zeckendorf': '10100',
            'methods': ['black_scholes', 'qfnn', 'xi_psi'],
            'results': results_table,
            'backtest': backtest_report,
        }, f, indent=2)

    print(f"📄 Report saved to: {output_path}")


if __name__ == "__main__":
    main()
