/// Ontology System for φ-Memory
///
/// Three-tier knowledge hierarchy:
/// - Tier 1: Entities (atomic concepts, unique bit positions)
/// - Tier 2: Concepts (composite of entities via OR)
/// - Tier 3: Documents (full context via OR of all entities)
///
/// Entity Assignment Examples:
/// - "Fed" → bit 55 (F_10 = 55)
/// - "Powell" → bit 21 (F_8 = 21)
/// - "Basel" → bit 144 (F_12 = 144)

use super::{BitField, PhiMemoryCell};
use std::collections::HashMap;

/// Financial entities with assigned Fibonacci bit positions
pub const FINANCIAL_ENTITIES: &[(&str, u8)] = &[
    // Central Banks & Regulators
    ("Fed", 10),           // F_10 = 55
    ("Powell", 8),         // F_8 = 21
    ("ECB", 9),            // F_9 = 34
    ("Lagarde", 7),        // F_7 = 13
    ("Basel", 12),         // F_12 = 144
    ("FDIC", 11),          // F_11 = 89

    // Economic Concepts
    ("Inflation", 13),     // F_13 = 233
    ("GDP", 6),            // F_6 = 8
    ("Unemployment", 14),  // F_14 = 377
    ("Interest_Rate", 15), // F_15 = 610
    ("QE", 5),             // F_5 = 5 (Quantitative Easing)

    // Market Indicators
    ("VIX", 16),           // F_16 = 987
    ("DXY", 4),            // F_4 = 3 (Dollar Index)
    ("Gold", 17),          // F_17 = 1597
    ("Oil", 3),            // F_3 = 2

    // Financial Instruments
    ("Treasury", 18),      // F_18 = 2584
    ("Bond", 19),          // F_19 = 4181
    ("Equity", 20),        // F_20 = 6765
    ("Derivative", 21),    // F_21 = 10946
    ("Options", 22),       // F_22 = 17711

    // Risk Concepts
    ("Default", 23),       // F_23 = 28657
    ("Contagion", 24),     // F_24 = 46368
    ("Systemic_Risk", 25), // F_25 = 75025
    ("Volatility", 26),    // F_26 = 121393
];

/// Trading entities
pub const TRADING_ENTITIES: &[(&str, u8)] = &[
    ("Buy", 27),           // F_27 = 196418
    ("Sell", 28),          // F_28 = 317811
    ("Hold", 2),           // F_2 = 1
    ("Long", 29),          // F_29 = 514229
    ("Short", 30),         // F_30 = 832040
    ("Hedge", 31),         // F_31 = 1346269
    ("Arbitrage", 32),     // F_32 = 2178309
];

/// Sentiment entities
pub const SENTIMENT_ENTITIES: &[(&str, u8)] = &[
    ("Bullish", 33),       // F_33 = 3524578
    ("Bearish", 34),       // F_34 = 5702887
    ("Neutral", 35),       // F_35 = 9227465
    ("Fear", 36),          // F_36 = 14930352
    ("Greed", 37),         // F_37 = 24157817
    ("Panic", 38),         // F_38 = 39088169
];

/// Temporal entities
pub const TEMPORAL_ENTITIES: &[(&str, u8)] = &[
    ("Immediate", 39),     // F_39 = 63245986
    ("Short_Term", 40),    // F_40 = 102334155
    ("Medium_Term", 41),   // F_41 = 165580141
    ("Long_Term", 42),     // F_42 = 267914296
    ("Secular", 43),       // F_43 = 433494437
];

/// Initialize entity ontology in memory cell
pub fn initialize_entities(cell: &mut PhiMemoryCell) {
    // Load all entity categories
    for (entity, bit_pos) in FINANCIAL_ENTITIES {
        cell.entity_map.insert(entity.to_string(), *bit_pos);
    }

    for (entity, bit_pos) in TRADING_ENTITIES {
        cell.entity_map.insert(entity.to_string(), *bit_pos);
    }

    for (entity, bit_pos) in SENTIMENT_ENTITIES {
        cell.entity_map.insert(entity.to_string(), *bit_pos);
    }

    for (entity, bit_pos) in TEMPORAL_ENTITIES {
        cell.entity_map.insert(entity.to_string(), *bit_pos);
    }
}

/// Predefined concepts (Tier 2)
pub struct ConceptBuilder;

impl ConceptBuilder {
    /// Build "Hawkish Fed" concept
    /// Composition: Fed + Powell + Interest_Rate + Inflation
    pub fn hawkish_fed(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["Fed", "Powell", "Interest_Rate", "Inflation"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }

    /// Build "Dovish ECB" concept
    pub fn dovish_ecb(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["ECB", "Lagarde", "QE"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }

    /// Build "Banking Crisis" concept
    pub fn banking_crisis(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["Default", "Contagion", "Systemic_Risk", "FDIC", "Basel"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }

    /// Build "Risk-On" market sentiment
    pub fn risk_on(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["Bullish", "Greed", "Equity", "Buy"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }

    /// Build "Risk-Off" market sentiment
    pub fn risk_off(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["Bearish", "Fear", "Gold", "Treasury", "Sell"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }

    /// Build options trading strategy
    pub fn options_strategy(cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut bits = BitField::new();

        for entity in &["Options", "Hedge", "Volatility", "VIX"] {
            let pos = *cell.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;
            bits = bits.or(&BitField::from_bits(1u64 << pos)?);
        }

        Ok(bits)
    }
}

/// Query decomposition: natural language → target Zeckendorf state
pub struct QueryDecomposer;

impl QueryDecomposer {
    /// Parse query and extract entities
    /// Returns target_n (integer representation of query bits)
    pub fn decompose(query: &str, cell: &PhiMemoryCell) -> Result<BitField, String> {
        let mut query_bits = BitField::new();
        let query_lower = query.to_lowercase();

        // Scan for known entities
        for (entity, bit_pos) in &cell.entity_map {
            let entity_lower = entity.to_lowercase();

            if query_lower.contains(&entity_lower) {
                let entity_bitfield = BitField::from_bits(1u64 << bit_pos)?;
                query_bits = query_bits.or(&entity_bitfield);
            }
        }

        // Scan for known concepts
        for (concept_name, concept_bits) in &cell.concept_map {
            let concept_lower = concept_name.to_lowercase();

            if query_lower.contains(&concept_lower) {
                query_bits = query_bits.or(concept_bits);
            }
        }

        Ok(query_bits)
    }

    /// Advanced decomposition with context
    pub fn decompose_with_context(
        query: &str,
        context: &[&str],
        cell: &PhiMemoryCell,
    ) -> Result<BitField, String> {
        // Start with base query decomposition
        let mut query_bits = Self::decompose(query, cell)?;

        // Add context entities
        for ctx in context {
            if let Some(bit_pos) = cell.entity_map.get(*ctx) {
                let ctx_bitfield = BitField::from_bits(1u64 << bit_pos)?;
                query_bits = query_bits.or(&ctx_bitfield);
            }
        }

        Ok(query_bits)
    }

    /// Extract temporal dimension from query
    pub fn extract_temporal(query: &str) -> Option<&'static str> {
        let query_lower = query.to_lowercase();

        if query_lower.contains("now") || query_lower.contains("immediate") {
            Some("Immediate")
        } else if query_lower.contains("short term") || query_lower.contains("days") {
            Some("Short_Term")
        } else if query_lower.contains("medium term") || query_lower.contains("months") {
            Some("Medium_Term")
        } else if query_lower.contains("long term") || query_lower.contains("years") {
            Some("Long_Term")
        } else if query_lower.contains("secular") || query_lower.contains("decade") {
            Some("Secular")
        } else {
            None
        }
    }

    /// Extract action from query
    pub fn extract_action(query: &str) -> Option<&'static str> {
        let query_lower = query.to_lowercase();

        if query_lower.contains("buy") || query_lower.contains("purchase") {
            Some("Buy")
        } else if query_lower.contains("sell") {
            Some("Sell")
        } else if query_lower.contains("hold") {
            Some("Hold")
        } else if query_lower.contains("hedge") {
            Some("Hedge")
        } else if query_lower.contains("short") {
            Some("Short")
        } else if query_lower.contains("long") {
            Some("Long")
        } else {
            None
        }
    }
}

/// Build predefined concept library
pub fn build_concept_library(cell: &mut PhiMemoryCell) -> Result<(), String> {
    // Financial policy concepts
    cell.concept_map.insert(
        "Hawkish_Fed".to_string(),
        ConceptBuilder::hawkish_fed(cell)?,
    );

    cell.concept_map.insert(
        "Dovish_ECB".to_string(),
        ConceptBuilder::dovish_ecb(cell)?,
    );

    // Risk concepts
    cell.concept_map.insert(
        "Banking_Crisis".to_string(),
        ConceptBuilder::banking_crisis(cell)?,
    );

    // Market sentiment
    cell.concept_map.insert(
        "Risk_On".to_string(),
        ConceptBuilder::risk_on(cell)?,
    );

    cell.concept_map.insert(
        "Risk_Off".to_string(),
        ConceptBuilder::risk_off(cell)?,
    );

    // Trading strategies
    cell.concept_map.insert(
        "Options_Strategy".to_string(),
        ConceptBuilder::options_strategy(cell)?,
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entity_initialization() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        assert_eq!(*cell.entity_map.get("Fed").unwrap(), 10);
        assert_eq!(*cell.entity_map.get("Powell").unwrap(), 8);
        assert_eq!(*cell.entity_map.get("Basel").unwrap(), 12);
    }

    #[test]
    fn test_concept_builder() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        let hawkish = ConceptBuilder::hawkish_fed(&cell).unwrap();
        assert!(!hawkish.is_empty());

        let risk_on = ConceptBuilder::risk_on(&cell).unwrap();
        assert!(!risk_on.is_empty());
    }

    #[test]
    fn test_query_decomposition() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        let query = "What is the Fed's view on inflation?";
        let bits = QueryDecomposer::decompose(query, &cell).unwrap();

        // Should contain Fed and Inflation entities
        assert!(!bits.is_empty());
    }

    #[test]
    fn test_temporal_extraction() {
        assert_eq!(
            QueryDecomposer::extract_temporal("What happens in the short term?"),
            Some("Short_Term")
        );

        assert_eq!(
            QueryDecomposer::extract_temporal("Long term outlook?"),
            Some("Long_Term")
        );
    }

    #[test]
    fn test_action_extraction() {
        assert_eq!(
            QueryDecomposer::extract_action("Should I buy this stock?"),
            Some("Buy")
        );

        assert_eq!(
            QueryDecomposer::extract_action("Time to sell?"),
            Some("Sell")
        );
    }

    #[test]
    fn test_concept_library() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);
        build_concept_library(&mut cell).unwrap();

        assert!(cell.concept_map.contains_key("Hawkish_Fed"));
        assert!(cell.concept_map.contains_key("Risk_On"));
        assert!(cell.concept_map.contains_key("Banking_Crisis"));
    }
}
