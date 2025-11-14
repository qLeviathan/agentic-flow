//! Memory operations example - episode storage and learning

use anyhow::Result;
use phi_memory::{Episode, Outcome, PhiMemory};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<()> {
    println!("=== Memory Operations Example ===\n");

    let memory = PhiMemory::new();

    // Example 1: Store episodes
    println!("1. Storing episodes...");
    let episodes = vec![
        ("ep1", "user_login", "authenticate", "success"),
        ("ep2", "data_fetch", "query_database", "success"),
        ("ep3", "user_login", "authenticate", "success"),
        ("ep4", "data_fetch", "query_database", "success"),
        ("ep5", "user_logout", "clear_session", "success"),
        ("ep6", "user_login", "authenticate", "success"),
    ];

    for (id, context, action, outcome) in episodes {
        let episode = Episode {
            id: id.to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            context: context.to_string(),
            action: action.to_string(),
            outcome: Outcome::Success(outcome.to_string()),
            metadata: HashMap::new(),
        };
        memory.store_episode(episode).await?;
        println!("   ✓ Stored episode: {}", id);
    }
    println!();

    // Example 2: Query episodes
    println!("2. Querying episodes...");
    let login_episodes = memory.query_episodes("user_login").await;
    println!("   Found {} login episodes", login_episodes.len());
    for ep in &login_episodes {
        println!("     - {} at {}", ep.id, ep.timestamp);
    }
    println!();

    // Example 3: Extract skills
    println!("3. Extracting skills from patterns...");
    let skills = memory.extract_skills().await?;
    println!("   Extracted {} skills:", skills.len());
    for skill in &skills {
        println!(
            "     - {} (confidence: {:.2}, usage: {})",
            skill.name, skill.confidence, skill.usage_count
        );
    }
    println!();

    // Example 4: Discover causality
    println!("4. Discovering causal relationships...");
    let edges = memory.discover_causality().await?;
    if edges.is_empty() {
        println!("   No causal edges found (need more sequential data)");
    } else {
        println!("   Found {} causal edges:", edges.len());
        for edge in &edges {
            println!(
                "     - {} → {} (strength: {:.2})",
                edge.from, edge.to, edge.strength
            );
        }
    }
    println!();

    // Example 5: Latent encoding
    println!("5. Testing Latent-N encoding...");
    let data = b"Hello, this is test data for latent encoding!";
    let encoded = memory.encode_latent("test_key", data).await?;
    println!("   Original size: {} bytes", data.len());
    println!("   Encoded size: {} floats", encoded.encoding.len());
    println!("   Compression ratio: {:.2}x", encoded.compression_ratio);

    let decoded = memory.decode_latent("test_key").await?;
    println!("   Decoded size: {} bytes", decoded.len());
    println!("   Data integrity: {}", if decoded == data { "✓ OK" } else { "✗ FAILED" });
    println!();

    // Example 6: Memory statistics
    println!("6. Memory statistics:");
    let stats = memory.stats().await;
    println!("   Episodes: {}", stats.episode_count);
    println!("   Skills: {}", stats.skill_count);
    println!("   Causal Edges: {}", stats.causal_edge_count);
    println!("   Latent Memories: {}", stats.latent_memory_count);

    println!("\n✓ All examples completed!");
    Ok(())
}
