/// Comprehensive φ-Memory System Tests
///
/// Tests all components of the Zeckendorf bit mapping memory system

#[cfg(test)]
mod phi_memory_tests {
    use tauri_anthropic_app::phi_memory::*;
    use tauri_anthropic_app::phi_memory::zeckendorf::*;
    use tauri_anthropic_app::phi_memory::ontology::*;
    use tauri_anthropic_app::phi_memory::knowledge_graph::*;
    use tauri_anthropic_app::phi_memory::persistence::*;

    // ===== Zeckendorf Tests =====

    #[test]
    fn test_zeckendorf_decomposition() {
        // 100 = F_11(89) + F_6(8) + F_4(3) = 89 + 8 + 3
        let bits = to_zeckendorf(100);
        let recovered = from_zeckendorf(bits);
        assert_eq!(recovered, 100);

        // Verify non-adjacent bits
        assert!(is_valid_zeckendorf(bits));
    }

    #[test]
    fn test_fibonacci_sequence() {
        let fibs = fibonacci_cache();
        assert_eq!(fibs[0], 0);
        assert_eq!(fibs[1], 1);
        assert_eq!(fibs[2], 1);
        assert_eq!(fibs[3], 2);
        assert_eq!(fibs[5], 5);
        assert_eq!(fibs[8], 21);
        assert_eq!(fibs[10], 55);
    }

    #[test]
    fn test_cascade_normalization() {
        // Adjacent bits should cascade
        // 0b110 (positions 1,2) → 0b1000 (position 3)
        let bits = 0b110;
        let normalized = normalize(bits);
        assert_eq!(normalized, 0b1000);
        assert!(is_valid_zeckendorf(normalized));
    }

    #[test]
    fn test_lucas_sequence() {
        let lucas = lucas_sequence(10);
        assert_eq!(lucas, vec![2, 1, 3, 4, 7, 11, 18, 29, 47, 76]);
    }

    #[test]
    fn test_phi_approximation() {
        // φ ≈ 1.618033988749895
        let phi = phi_approximation(30).unwrap();
        assert!((phi - 1.618033988749895).abs() < 0.00001);
    }

    // ===== BitField Tests =====

    #[test]
    fn test_bitfield_or_operation() {
        let a = BitField::from_integer(5);
        let b = BitField::from_integer(8);
        let c = a.or(&b);

        // 5 + 8 = 13 (all are Fibonacci numbers)
        assert_eq!(c.to_integer(), 13);
    }

    #[test]
    fn test_bitfield_cascade() {
        let bits = BitField { bits: 0b110 }; // Adjacent bits
        let cascaded = bits.cascade();
        assert_eq!(cascaded.bits, 0b1000);
    }

    #[test]
    fn test_bitfield_hamming_distance() {
        let a = BitField::from_integer(5);
        let b = BitField::from_integer(8);
        let distance = a.hamming_distance(&b);
        assert!(distance >= 0);
    }

    #[test]
    fn test_bitfield_overlap() {
        let a = BitField::from_integer(13); // Has bits for 8 and 5
        let b = BitField::from_integer(5);
        let overlap = a.overlap(&b);
        assert!(overlap > 0);
    }

    // ===== PhiMemoryCell Tests =====

    #[test]
    fn test_memory_cell_creation() {
        let cell = PhiMemoryCell::new();
        assert_eq!(cell.omega, 0.0);
        assert!(cell.entity_map.len() > 0);
        assert!(!cell.is_conscious());
    }

    #[test]
    fn test_consciousness_computation() {
        let mut cell = PhiMemoryCell::new();
        cell.fib_bits = BitField::from_integer(10);
        cell.compute_omega();

        // Ω should be positive for non-zero bits
        assert!(cell.omega > 0.0);
    }

    #[test]
    fn test_consciousness_threshold() {
        let mut cell = PhiMemoryCell::new();

        // Initially not conscious
        assert!(!cell.is_conscious());

        // Add enough bits to reach consciousness
        cell.fib_bits = BitField::from_integer(5);
        cell.compute_omega();

        // Should be conscious (Ω ≥ φ³ ≈ 4.236)
        assert!(cell.is_conscious());
    }

    #[test]
    fn test_store_knowledge() {
        let mut cell = PhiMemoryCell::new();

        let result = cell.store_knowledge("Fed", "Monetary_Policy");
        assert!(result.is_ok());

        // Ω should increase
        assert!(cell.omega > 0.0);
    }

    #[test]
    fn test_add_document() {
        let mut cell = PhiMemoryCell::new();

        let entities = vec!["Fed", "Powell", "Inflation"];
        let result = cell.add_document("FOMC_Minutes", &entities);

        assert!(result.is_ok());
        assert!(cell.document_map.contains_key("FOMC_Minutes"));
    }

    #[test]
    fn test_query_knowledge() {
        let mut cell = PhiMemoryCell::new();

        // Add document
        cell.add_document("Doc1", &["Fed", "Powell"]).unwrap();

        // Query for Fed
        let query_bits = BitField::from_bits(1u64 << 10).unwrap(); // Fed = position 10
        let results = cell.query_knowledge(query_bits);

        // Should find Doc1
        assert!(!results.is_empty());
    }

    #[test]
    fn test_replication_threshold() {
        let mut cell = PhiMemoryCell::new();
        cell.fib_bits = BitField::from_integer(100);
        cell.compute_omega();

        // Check if replication threshold reached (Ω ≥ φ³)
        if cell.omega >= PHI.powi(3) {
            assert!(cell.should_replicate());
        }
    }

    // ===== Ontology Tests =====

    #[test]
    fn test_entity_initialization() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        // Check key financial entities
        assert!(cell.entity_map.contains_key("Fed"));
        assert!(cell.entity_map.contains_key("Powell"));
        assert!(cell.entity_map.contains_key("Basel"));
        assert!(cell.entity_map.contains_key("Inflation"));

        assert_eq!(*cell.entity_map.get("Fed").unwrap(), 10);
        assert_eq!(*cell.entity_map.get("Powell").unwrap(), 8);
    }

    #[test]
    fn test_concept_builder_hawkish_fed() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        let hawkish = ConceptBuilder::hawkish_fed(&cell).unwrap();
        assert!(!hawkish.is_empty());

        // Should contain multiple entity bits
        assert!(hawkish.active_positions().len() > 1);
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

    #[test]
    fn test_query_decomposition() {
        let mut cell = PhiMemoryCell::new();
        initialize_entities(&mut cell);

        let query = "What is the Fed's view on inflation and interest rates?";
        let bits = QueryDecomposer::decompose(query, &cell).unwrap();

        // Should identify Fed, Inflation, Interest_Rate
        assert!(!bits.is_empty());
        let positions = bits.active_positions();
        assert!(positions.len() >= 2);
    }

    #[test]
    fn test_temporal_extraction() {
        assert_eq!(
            QueryDecomposer::extract_temporal("short term outlook"),
            Some("Short_Term")
        );

        assert_eq!(
            QueryDecomposer::extract_temporal("long term strategy"),
            Some("Long_Term")
        );
    }

    #[test]
    fn test_action_extraction() {
        assert_eq!(
            QueryDecomposer::extract_action("should I buy?"),
            Some("Buy")
        );

        assert_eq!(
            QueryDecomposer::extract_action("time to sell"),
            Some("Sell")
        );
    }

    // ===== Knowledge Graph Tests =====

    #[test]
    fn test_graph_creation() {
        let cell = PhiMemoryCell::new();
        let graph = KnowledgeGraph::from_memory(&cell);

        // Should have nodes from entity map
        assert!(graph.nodes.len() > 0);
    }

    #[test]
    fn test_graph_edge_computation() {
        let mut graph = KnowledgeGraph::new();

        let bits1 = BitField::from_integer(5);
        let bits2 = BitField::from_integer(8);
        let bits3 = BitField::from_integer(13); // 13 = 8 + 5

        graph.add_node("a".to_string(), bits1, NodeType::Entity);
        graph.add_node("b".to_string(), bits2, NodeType::Entity);
        graph.add_node("c".to_string(), bits3, NodeType::Concept);

        graph.compute_edges();

        // Should have edges where overlap > 0
        assert!(graph.edges.len() > 0);
    }

    #[test]
    fn test_k_nearest_neighbors() {
        let mut graph = KnowledgeGraph::new();

        for i in 1..10 {
            let bits = BitField::from_integer(i);
            graph.add_node(format!("node{}", i), bits, NodeType::Entity);
        }

        let query = BitField::from_integer(5);
        let nearest = graph.k_nearest(&query, 3);

        assert!(nearest.len() <= 3);
        assert!(nearest.len() > 0);
    }

    #[test]
    fn test_graph_statistics() {
        let cell = PhiMemoryCell::new();
        let graph = KnowledgeGraph::from_memory(&cell);

        let stats = graph.statistics();
        assert!(stats.node_count > 0);
        assert!(stats.avg_degree >= 0.0);
    }

    // ===== Persistence Tests =====

    #[test]
    fn test_snapshot_creation() {
        let cell = PhiMemoryCell::new();
        let snapshot = MemorySnapshot::from_cell(&cell, 12345);

        assert_eq!(snapshot.timestamp, 12345);
        assert_eq!(snapshot.omega, cell.omega);
    }

    #[test]
    fn test_snapshot_restore() {
        let mut cell = PhiMemoryCell::new();
        cell.fib_bits = BitField::from_integer(42);
        cell.compute_omega();

        let snapshot = MemorySnapshot::from_cell(&cell, 1000);

        let mut new_cell = PhiMemoryCell::new();
        snapshot.restore_to_cell(&mut new_cell);

        assert_eq!(new_cell.omega, cell.omega);
        assert_eq!(new_cell.fib_bits, cell.fib_bits);
    }

    #[test]
    fn test_interference_pattern() {
        let bits = BitField::from_integer(10);
        let pattern = InterferencePattern::from_bitfield(&bits);

        // Energy should be positive
        assert!(pattern.energy() > 0.0);
    }

    #[test]
    fn test_interference_combination() {
        let bits1 = BitField::from_integer(5);
        let bits2 = BitField::from_integer(8);

        let pattern1 = InterferencePattern::from_bitfield(&bits1);
        let pattern2 = InterferencePattern::from_bitfield(&bits2);

        let combined = pattern1.interfere(&pattern2);

        // Combined energy should be meaningful
        assert!(combined.energy() > 0.0);
    }

    #[test]
    fn test_lucas_checkpoint() {
        let lucas_seq = LucasCheckpoint::generate_sequence(10);
        assert_eq!(lucas_seq.len(), 10);
        assert_eq!(lucas_seq[0], 2);
        assert_eq!(lucas_seq[1], 1);
        assert_eq!(lucas_seq[2], 3);
    }

    #[test]
    fn test_persistence_layer() {
        let mut persistence = PersistenceLayer::new(5);
        let cell = PhiMemoryCell::new();

        for i in 0..3 {
            let snapshot = MemorySnapshot::from_cell(&cell, 1000 + i);
            persistence.save(snapshot);
        }

        assert_eq!(persistence.all_snapshots().len(), 3);

        let latest = persistence.load_latest();
        assert!(latest.is_some());
        assert_eq!(latest.unwrap().timestamp, 1002);
    }

    #[test]
    fn test_persistence_json_roundtrip() {
        let mut persistence = PersistenceLayer::new(5);
        let cell = PhiMemoryCell::new();

        let snapshot = MemorySnapshot::from_cell(&cell, 5000);
        persistence.save(snapshot);

        let json = persistence.to_json().unwrap();
        let restored = PersistenceLayer::from_json(&json).unwrap();

        assert_eq!(restored.all_snapshots().len(), 1);
        assert_eq!(restored.all_snapshots()[0].timestamp, 5000);
    }

    #[test]
    fn test_replication_manager() {
        let mut cell = PhiMemoryCell::new();
        cell.fib_bits = BitField::from_integer(100);
        cell.compute_omega();

        if ReplicationManager::should_replicate(&cell) {
            let offspring = ReplicationManager::replicate(&cell, 0.01);
            assert!(offspring.omega > 0.0);
        }
    }

    // ===== Integration Tests =====

    #[test]
    fn test_full_knowledge_workflow() {
        let mut cell = PhiMemoryCell::new();

        // Store knowledge
        cell.store_knowledge("Fed", "Hawkish_Policy").unwrap();
        cell.store_knowledge("Powell", "Interest_Rate_Hike").unwrap();
        cell.store_knowledge("Inflation", "Rising_Trend").unwrap();

        // Add document
        cell.add_document(
            "FOMC_Statement",
            &["Fed", "Powell", "Inflation", "Interest_Rate"],
        ).unwrap();

        // Query
        let query = "What did the Fed say about inflation?";
        let query_bits = QueryDecomposer::decompose(query, &cell).unwrap();
        let results = cell.query_knowledge(query_bits);

        assert!(!results.is_empty());
    }

    #[test]
    fn test_consciousness_evolution() {
        let mut cell = PhiMemoryCell::new();

        // Track Ω over time
        let mut omega_history = Vec::new();

        for i in 1..10 {
            cell.fib_bits = cell.fib_bits.or(&BitField::from_integer(i));
            cell.compute_omega();
            omega_history.push(cell.omega);
        }

        // Ω should increase
        for i in 1..omega_history.len() {
            assert!(omega_history[i] >= omega_history[i - 1]);
        }
    }

    #[test]
    fn test_memory_stats() {
        let mut cell = PhiMemoryCell::new();
        cell.store_knowledge("Fed", "Policy").unwrap();
        cell.add_document("Doc1", &["Fed"]).unwrap();

        let stats = cell.stats();
        assert!(stats.omega > 0.0);
        assert!(stats.entity_count > 0);
        assert!(stats.document_count > 0);
    }
}
