//! Integration tests for backtesting framework

use backtesting::{
    BacktestEngine, BacktestConfig, OHLCV,
    calculate_optimal_position_size,
};
use chrono::{TimeZone, Utc};

#[test]
fn test_simple_backtest() {
    // Create test data
    let data = vec![
        OHLCV {
            timestamp: Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap(),
            open: 100.0,
            high: 105.0,
            low: 99.0,
            close: 103.0,
            volume: 1000.0,
        },
        OHLCV {
            timestamp: Utc.with_ymd_and_hms(2024, 1, 2, 0, 0, 0).unwrap(),
            open: 103.0,
            high: 108.0,
            low: 102.0,
            close: 107.0,
            volume: 1200.0,
        },
        OHLCV {
            timestamp: Utc.with_ymd_and_hms(2024, 1, 3, 0, 0, 0).unwrap(),
            open: 107.0,
            high: 110.0,
            low: 105.0,
            close: 106.0,
            volume: 900.0,
        },
    ];

    let config = BacktestConfig {
        initial_capital: 10000.0,
        use_phi_game_theory: false, // Simplify for test
        ..Default::default()
    };

    let mut engine = BacktestEngine::new(data, config);

    // Should not panic
    let results = engine.backtest_strategy().unwrap();

    assert_eq!(results.total_trades, 0); // Not enough data for trades
    assert_eq!(results.final_capital, 10000.0);
}

#[test]
fn test_kelly_criterion() {
    // Test optimal position sizing
    let position_size = calculate_optimal_position_size(0.6, 2.0, 1.0);

    assert!(position_size > 0.0);
    assert!(position_size <= 0.1); // Should be capped at 10%
}

#[test]
fn test_fibonacci_levels() {
    let data: Vec<OHLCV> = (0..50)
        .map(|i| OHLCV {
            timestamp: Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap(),
            open: 100.0 + i as f64,
            high: 105.0 + i as f64,
            low: 99.0 + i as f64,
            close: 103.0 + i as f64,
            volume: 1000.0,
        })
        .collect();

    let config = BacktestConfig::default();
    let mut engine = BacktestEngine::new(data, config);

    // Calculate Fibonacci levels
    engine.calculate_fibonacci_levels(25).unwrap();

    assert!(engine.fib_levels.is_some());

    let fib = engine.fib_levels.unwrap();
    assert_eq!(fib.support.len(), 4); // 4 support levels
    assert_eq!(fib.resistance.len(), 4); // 4 resistance levels
    assert!(fib.swing_high > fib.swing_low);
}

#[test]
fn test_lucas_windows() {
    let data: Vec<OHLCV> = (0..100)
        .map(|i| OHLCV {
            timestamp: Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap(),
            open: 100.0 + i as f64,
            high: 105.0 + i as f64,
            low: 99.0 + i as f64,
            close: 103.0 + i as f64,
            volume: 1000.0,
        })
        .collect();

    let config = BacktestConfig::default();
    let mut engine = BacktestEngine::new(data, config);

    engine.identify_lucas_windows();

    assert!(!engine.lucas_windows.is_empty());

    // Verify all windows have valid Lucas values
    for window in &engine.lucas_windows {
        assert!(window.lucas_value > 0);
        assert!(window.end_bar > window.start_bar);
        assert_eq!(
            window.end_bar - window.start_bar,
            window.lucas_value as usize
        );
    }
}
