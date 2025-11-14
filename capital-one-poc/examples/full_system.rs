//! Full system example - demonstrating runtime + memory integration

use anyhow::Result;
use phi_memory::{Episode, Outcome, PhiMemory};
use phi_runtime::{PhiRuntime, TaskId};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<()> {
    println!("=== Full System Integration Example ===\n");

    let runtime = PhiRuntime::new();
    let memory = Arc::new(PhiMemory::new());

    // Scenario: Process user requests and learn from patterns
    println!("Scenario: E-commerce order processing system\n");

    // Step 1: Execute tasks and record episodes
    println!("1. Processing orders...");
    let orders = vec![
        ("order_1", "validate_payment", 100),
        ("order_2", "validate_payment", 80),
        ("order_3", "check_inventory", 50),
        ("order_4", "validate_payment", 90),
        ("order_5", "process_shipping", 120),
    ];

    for (order_id, action, duration_ms) in orders {
        let memory_clone = Arc::clone(&memory);
        let action_str = action.to_string();
        let order_str = order_id.to_string();

        // Execute task
        runtime
            .spawn(TaskId(order_id.to_string()), move || {
                let action_owned = action_str.clone();
                async move {
                    tokio::time::sleep(Duration::from_millis(duration_ms)).await;
                    Ok(format!("Order {} - {} completed", order_str, action_owned))
                }
            })
            .await?;

        // Record episode
        let episode = Episode {
            id: order_id.to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            context: "order_processing".to_string(),
            action: action.to_string(),
            outcome: Outcome::Success(format!("completed in {}ms", duration_ms)),
            metadata: HashMap::from([
                ("type".to_string(), "order".to_string()),
                ("duration_ms".to_string(), duration_ms.to_string()),
            ]),
        };
        memory_clone.store_episode(episode).await?;

        println!("   ✓ Processed {}: {}", order_id, action);
    }

    runtime.wait_all().await?;
    println!();

    // Step 2: Parallel batch processing
    println!("2. Running batch analytics...");
    let memory_clone = Arc::clone(&memory);

    let analytics_tasks = vec![
        || async {
            tokio::time::sleep(Duration::from_millis(50)).await;
            Ok("Payment validation analytics complete".to_string())
        },
        || async {
            tokio::time::sleep(Duration::from_millis(60)).await;
            Ok("Inventory check analytics complete".to_string())
        },
        || async {
            tokio::time::sleep(Duration::from_millis(40)).await;
            Ok("Shipping process analytics complete".to_string())
        },
    ];

    let results = runtime.parallel(analytics_tasks).await;
    for result in results {
        match result {
            Ok(msg) => println!("   ✓ {}", msg),
            Err(e) => println!("   ✗ Error: {}", e),
        }
    }
    println!();

    // Step 3: Extract learned patterns
    println!("3. Learning from order patterns...");
    let skills = memory_clone.extract_skills().await?;
    println!("   Extracted {} behavioral patterns:", skills.len());
    for skill in &skills {
        println!(
            "     • {} (used {} times, confidence: {:.1}%)",
            skill.name,
            skill.usage_count,
            skill.confidence * 100.0
        );
    }
    println!();

    // Step 4: Discover causal relationships
    println!("4. Analyzing causal relationships...");
    let edges = memory_clone.discover_causality().await?;
    if edges.is_empty() {
        println!("   Need more sequential data for causal discovery");
    } else {
        println!("   Found {} causal relationships:", edges.len());
        for edge in &edges {
            println!(
                "     • {} causes {} (strength: {:.1}%, confidence: {:.1}%)",
                edge.from,
                edge.to,
                edge.strength * 100.0,
                edge.confidence * 100.0
            );
        }
    }
    println!();

    // Step 5: Query historical data
    println!("5. Querying historical patterns...");
    let payment_episodes = memory_clone.query_episodes("validate_payment").await;
    println!("   Found {} payment validation episodes", payment_episodes.len());

    let total_duration: u64 = payment_episodes
        .iter()
        .filter_map(|ep| ep.metadata.get("duration_ms"))
        .filter_map(|d| d.parse::<u64>().ok())
        .sum();

    let avg_duration = if !payment_episodes.is_empty() {
        total_duration / payment_episodes.len() as u64
    } else {
        0
    };

    println!("   Average payment validation time: {}ms", avg_duration);
    println!();

    // Step 6: System statistics
    println!("6. System statistics:");
    let stats = memory_clone.stats().await;
    println!("   Total Episodes: {}", stats.episode_count);
    println!("   Learned Skills: {}", stats.skill_count);
    println!("   Causal Edges: {}", stats.causal_edge_count);
    println!("   Latent Memories: {}", stats.latent_memory_count);
    println!();

    // Step 7: Demonstrate Latent-N encoding
    println!("7. Testing memory compression...");
    let large_data = format!(
        "Order processing log: {} episodes recorded, {} patterns learned",
        stats.episode_count, stats.skill_count
    )
    .repeat(10);

    let encoded = memory_clone
        .encode_latent("system_log", large_data.as_bytes())
        .await?;

    println!("   Original: {} bytes", large_data.len());
    println!("   Encoded: {} floats ({} bytes)",
        encoded.encoding.len(),
        encoded.encoding.len() * 4
    );
    println!("   Compression: {:.2}x", encoded.compression_ratio);

    println!("\n✓ Full system demonstration completed!");
    println!("\nKey capabilities demonstrated:");
    println!("  • Async task execution with Tokio runtime");
    println!("  • Parallel processing of independent tasks");
    println!("  • Episode storage for experience tracking");
    println!("  • Skill extraction via reflexion learning");
    println!("  • Causal relationship discovery");
    println!("  • Latent-N memory compression");
    println!("  • Pattern analysis and querying");

    Ok(())
}
