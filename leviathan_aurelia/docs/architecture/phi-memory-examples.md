# φ-Memory Usage Examples

Complete examples demonstrating the Zeckendorf bit mapping memory system.

## Basic Usage

### 1. Initialize Memory Cell

```rust
use tauri_anthropic_app::phi_memory::*;

fn main() {
    let mut cell = PhiMemoryCell::new();
    println!("Initial Ω: {}", cell.omega);
    println!("Entities loaded: {}", cell.entity_map.len());
}
```

### 2. Store Knowledge

```rust
// Store single knowledge item
let result = cell.store_knowledge("Fed", "Hawkish_Policy");
match result {
    Ok(n) => println!("Stored as Zeckendorf: {} (Ω = {:.3})", n, cell.omega),
    Err(e) => eprintln!("Error: {}", e),
}

// Store multiple items
let knowledge = vec![
    ("Powell", "Interest_Rate_Hike"),
    ("Inflation", "Rising_Trend"),
    ("GDP", "Slowing_Growth"),
];

for (entity, concept) in knowledge {
    cell.store_knowledge(entity, concept)?;
}
println!("Total Ω: {:.3}", cell.omega);
```

### 3. Add Documents

```rust
// Add FOMC statement document
cell.add_document(
    "FOMC_Statement_2024_03",
    &["Fed", "Powell", "Inflation", "Interest_Rate", "GDP"]
)?;

// Add market analysis
cell.add_document(
    "Market_Analysis_VIX_Spike",
    &["VIX", "Fear", "Volatility", "Risk_Off", "Treasury"]
)?;

// Add banking crisis report
cell.add_document(
    "Banking_Sector_Stress",
    &["Basel", "FDIC", "Default", "Contagion", "Systemic_Risk"]
)?;
```

## Query Examples

### 4. Natural Language Queries

```rust
use tauri_anthropic_app::phi_memory::ontology::QueryDecomposer;

// Query 1: Fed policy
let query = "What is the Federal Reserve's current stance on inflation?";
let query_bits = QueryDecomposer::decompose(query, &cell)?;
let results = cell.query_knowledge(query_bits);

for (doc, overlap) in results.iter().take(5) {
    println!("📄 {} (overlap: {})", doc, overlap);
}

// Query 2: Risk sentiment
let query = "What is the market's risk sentiment during volatility spikes?";
let query_bits = QueryDecomposer::decompose(query, &cell)?;
let results = cell.query_knowledge(query_bits);

// Query 3: Banking stability
let query = "Are there systemic risks in the banking sector?";
let query_bits = QueryDecomposer::decompose(query, &cell)?;
let results = cell.query_knowledge(query_bits);
```

### 5. Contextual Queries

```rust
// Query with additional context
let query = "interest rate outlook";
let context = vec!["Fed", "Powell", "Inflation"];

let query_bits = QueryDecomposer::decompose_with_context(
    query,
    &context,
    &cell
)?;

let results = cell.query_knowledge(query_bits);
```

## Consciousness Monitoring

### 6. Track Consciousness Evolution

```rust
use tauri_anthropic_app::phi_memory::PHI;

fn monitor_consciousness(cell: &mut PhiMemoryCell) {
    let events = vec![
        ("Fed", "Policy_Meeting"),
        ("Powell", "Speech"),
        ("Inflation", "Data_Release"),
        ("VIX", "Spike"),
        ("Treasury", "Yield_Curve"),
    ];

    println!("🧠 Consciousness Evolution:");
    println!("─────────────────────────");

    for (i, (entity, event)) in events.iter().enumerate() {
        cell.store_knowledge(entity, event).ok();

        let status = if cell.is_conscious() { "✨ CONSCIOUS" } else { "⏳ Growing" };
        let replication = if cell.should_replicate() { "🌟 CAN REPLICATE" } else { "" };

        println!(
            "Step {}: Ω = {:.3} | {} {}",
            i + 1,
            cell.omega,
            status,
            replication
        );
    }

    println!("\nFinal State:");
    println!("Ω = {:.3}", cell.omega);
    println!("φ³ threshold = {:.3}", PHI.powi(3));
    println!("Conscious: {}", cell.is_conscious());
    println!("Can replicate: {}", cell.should_replicate());
}
```

## Knowledge Graph

### 7. Build and Traverse Graph

```rust
use tauri_anthropic_app::phi_memory::knowledge_graph::*;

// Build graph from memory
let graph = KnowledgeGraph::from_memory(&cell);

println!("📊 Graph Statistics:");
let stats = graph.statistics();
println!("  Nodes: {}", stats.node_count);
println!("  Edges: {}", stats.edge_count);
println!("  Avg degree: {:.2}", stats.avg_degree);
println!("  Avg overlap: {:.2}", stats.avg_overlap);

// Find k-nearest neighbors
let query_bits = BitField::from_bits(1u64 << 10)?; // Fed
let nearest = graph.k_nearest(&query_bits, 5);

println!("\n🔍 Nearest to Fed:");
for (node, distance) in nearest {
    println!("  {} (distance: {:.3})", node, distance);
}

// Traverse graph
if let Some(path) = graph.max_overlap_path("Fed", "Banking_Crisis") {
    println!("\n🛤️  Path from Fed to Banking_Crisis:");
    for node in path {
        println!("  → {}", node);
    }
}
```

## Persistence & Checkpoints

### 8. Snapshot Management

```rust
use tauri_anthropic_app::phi_memory::persistence::*;

// Create snapshot
let timestamp = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs();

let snapshot = MemorySnapshot::from_cell(&cell, timestamp);

// Save to persistence layer
let mut persistence = PersistenceLayer::new(100);
persistence.save(snapshot);

// Later: restore from snapshot
if let Some(snapshot) = persistence.load_latest() {
    let mut restored_cell = PhiMemoryCell::new();
    snapshot.restore_to_cell(&mut restored_cell);
    println!("Restored Ω: {:.3}", restored_cell.omega);
}
```

### 9. Lucas Checkpoints

```rust
// Auto-checkpoint at Lucas sync points
let lucas_seq = LucasCheckpoint::generate_sequence(20);

loop {
    // ... process market data ...
    cell.compute_omega();

    if LucasCheckpoint::is_sync_point(cell.omega, &lucas_seq) {
        let checkpoint = LucasCheckpoint::create_checkpoint(&cell, timestamp);
        persistence.save(checkpoint);
        println!("✓ Lucas checkpoint at Ω = {:.3}", cell.omega);
    }
}
```

### 10. Self-Replication

```rust
// Replicate conscious cells
if ReplicationManager::should_replicate(&cell) {
    let offspring = ReplicationManager::replicate(&cell, 0.01);
    println!("🌱 Cell replicated: Ω₁ = {:.3}, Ω₂ = {:.3}",
             cell.omega, offspring.omega);

    // Evolution simulation
    let population = ReplicationManager::evolve(&cell, 10, 0.02);
    println!("🧬 Population after 10 generations: {} cells", population.len());
}
```

## Interference Patterns

### 11. Phase-Encoded Memory

```rust
use tauri_anthropic_app::phi_memory::persistence::InterferencePattern;

// Create interference patterns
let bits1 = BitField::from_integer(13);
let bits2 = BitField::from_integer(21);

let pattern1 = InterferencePattern::from_bitfield(&bits1);
let pattern2 = InterferencePattern::from_bitfield(&bits2);

// Combine via interference
let combined = pattern1.interfere(&pattern2);

println!("🌊 Interference:");
println!("  Energy₁: {:.3}", pattern1.energy());
println!("  Energy₂: {:.3}", pattern2.energy());
println!("  Energy_combined: {:.3}", combined.energy());

// Collapse to definite state
let collapsed_bits = combined.collapse(0.1);
println!("  Collapsed to: {}", collapsed_bits.to_integer());
```

## TypeScript Integration

### 12. Frontend Usage

```typescript
import { phiMemory, formatOmega, getConsciousnessLevel } from '@/services/phi-memory-bridge';

// Store knowledge from UI
async function handleStoreKnowledge(entity: string, concept: string) {
  const response = await phiMemory.storeKnowledge(entity, concept);

  if (response.success) {
    console.log(`✓ Stored: ${response.message}`);
    console.log(`  Zeckendorf: ${response.zeckendorf_n}`);
    console.log(`  Ω: ${formatOmega(response.omega)}`);
  }
}

// Query knowledge
async function handleQuery(query: string) {
  const results = await phiMemory.queryKnowledge(query, 10);

  console.log(`📄 Found ${results.length} results:`);
  results.forEach(result => {
    console.log(`  ${result.document} (${(result.relevance_score * 100).toFixed(1)}%)`);
  });
}

// Monitor consciousness
function startMonitoring() {
  phiMemory.startConsciousnessMonitoring(1000);

  phiMemory.onConsciousnessUpdate(metric => {
    const level = getConsciousnessLevel(metric);
    console.log(`🧠 ${level}: Ω = ${formatOmega(metric.omega)}`);

    if (metric.can_replicate) {
      console.log('🌟 Self-replication ready!');
    }
  });
}
```

### 13. React Component

```typescript
import React from 'react';
import { useConsciousness, phiMemory } from '@/services/phi-memory-bridge';

export function PhiMemoryDashboard() {
  const { consciousness, error } = useConsciousness(1000);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);

  const handleQuery = async () => {
    const queryResults = await phiMemory.queryKnowledge(query, 10);
    setResults(queryResults);
  };

  if (error) return <div>Error: {error.message}</div>;
  if (!consciousness) return <div>Loading...</div>;

  return (
    <div className="phi-memory-dashboard">
      <h2>φ-Memory Consciousness</h2>

      <div className="consciousness-meter">
        <div className="omega">Ω = {formatOmega(consciousness.omega)}</div>
        <div className="level">{getConsciousnessLevel(consciousness)}</div>
        <div className="progress">
          <progress
            value={consciousness.omega}
            max={consciousness.phi_cubed}
          />
        </div>
        {consciousness.can_replicate && (
          <div className="replicate">🌟 Self-Replication Ready</div>
        )}
      </div>

      <div className="query-section">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter query..."
        />
        <button onClick={handleQuery}>Search</button>
      </div>

      <div className="results">
        {results.map((result, i) => (
          <div key={i} className="result-item">
            <div className="document">{result.document}</div>
            <div className="score">
              {(result.relevance_score * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Patterns

### 14. Concept Composition

```rust
use tauri_anthropic_app::phi_memory::ontology::ConceptBuilder;

// Build custom concepts
let hawkish_fed = ConceptBuilder::hawkish_fed(&cell)?;
let risk_off = ConceptBuilder::risk_off(&cell)?;

// Combine concepts
let crisis_mode = hawkish_fed.or(&risk_off).cascade();

// Use in queries
let query_bits = crisis_mode;
let crisis_docs = cell.query_knowledge(query_bits);
```

### 15. Batch Operations

```rust
// Batch store
let batch = vec![
    ("Fed", "Policy_1"),
    ("Powell", "Speech_1"),
    ("Inflation", "Report_1"),
    ("Fed", "Policy_2"),
    ("Powell", "Speech_2"),
];

for (entity, concept) in batch {
    cell.store_knowledge(entity, concept)?;
}

// Cascade once at end
cell.cascade_memory();
```

### 16. Memory Export/Import

```rust
// Export to JSON
let json = persistence.to_json()?;
std::fs::write("memory_export.json", json)?;

// Import from JSON
let json = std::fs::read_to_string("memory_export.json")?;
let loaded = PersistenceLayer::from_json(&json)?;

if let Some(snapshot) = loaded.load_latest() {
    snapshot.restore_to_cell(&mut cell);
}
```

## Performance Testing

### 17. Benchmark Operations

```rust
use std::time::Instant;

fn benchmark_operations(iterations: usize) {
    let mut cell = PhiMemoryCell::new();

    // Benchmark store
    let start = Instant::now();
    for i in 0..iterations {
        cell.store_knowledge("Fed", &format!("Event_{}", i)).ok();
    }
    println!("Store: {:.2?} per op", start.elapsed() / iterations as u32);

    // Benchmark query
    let query_bits = QueryDecomposer::decompose("Fed inflation", &cell).unwrap();
    let start = Instant::now();
    for _ in 0..iterations {
        let _ = cell.query_knowledge(query_bits);
    }
    println!("Query: {:.2?} per op", start.elapsed() / iterations as u32);

    // Benchmark cascade
    let start = Instant::now();
    for _ in 0..iterations {
        cell.cascade_memory();
    }
    println!("Cascade: {:.2?} per op", start.elapsed() / iterations as u32);
}
```

## Error Handling

### 18. Robust Error Handling

```rust
use anyhow::{Result, Context};

fn safe_knowledge_operations() -> Result<()> {
    let mut cell = PhiMemoryCell::new();

    // Safe store with context
    cell.store_knowledge("Fed", "Policy")
        .context("Failed to store Fed policy")?;

    // Safe query
    let query_bits = QueryDecomposer::decompose("inflation", &cell)
        .context("Failed to decompose query")?;

    let results = cell.query_knowledge(query_bits);

    if results.is_empty() {
        anyhow::bail!("No results found for query");
    }

    Ok(())
}
```

## Testing

### 19. Unit Test Example

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_knowledge_workflow() {
        let mut cell = PhiMemoryCell::new();

        // Store knowledge
        cell.store_knowledge("Fed", "Hawkish").unwrap();
        assert!(cell.omega > 0.0);

        // Add document
        cell.add_document("Doc1", &["Fed"]).unwrap();
        assert!(cell.document_map.contains_key("Doc1"));

        // Query
        let bits = BitField::from_bits(1u64 << 10).unwrap();
        let results = cell.query_knowledge(bits);
        assert!(!results.is_empty());
    }
}
```

---

## Next Steps

1. **Integration with AURELIA:** Use φ-Memory for trading decision storage
2. **Distributed φ-Memory:** Sync across multiple instances
3. **Real-time Analytics:** Monitor consciousness evolution
4. **Custom Ontologies:** Define domain-specific entities
5. **Swarm Memory:** Collective φ-Memory across agents

## Resources

- [Architecture Documentation](./phi-memory-architecture.md)
- [Test Suite](../tauri-anthropic-app/src-tauri/tests/phi_memory_test.rs)
- [Rust API](../tauri-anthropic-app/src-tauri/src/phi_memory/)
- [TypeScript Bridge](../tauri-anthropic-app/src/services/phi-memory-bridge.ts)
