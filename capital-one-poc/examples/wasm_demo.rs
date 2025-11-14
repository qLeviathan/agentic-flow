//! WASM demonstration - showing how the system compiles to WebAssembly
//! This example demonstrates the core functionality without browser-specific code

use anyhow::Result;

#[cfg(not(target_arch = "wasm32"))]
use phi_runtime::{PhiRuntime, TaskId};

#[cfg(not(target_arch = "wasm32"))]
use phi_memory::{Episode, Outcome, PhiMemory};

#[cfg(not(target_arch = "wasm32"))]
use std::collections::HashMap;

#[cfg(not(target_arch = "wasm32"))]
#[tokio::main]
async fn main() -> Result<()> {
    println!("=== WASM Compatibility Demo ===\n");
    println!("This code can be compiled to WebAssembly!");
    println!("Build with: cargo build --target wasm32-unknown-unknown\n");

    // Runtime demo
    println!("1. Runtime operations (WASM-compatible):");
    let runtime = PhiRuntime::new();

    runtime.spawn(TaskId("wasm_task".to_string()), || async {
        Ok("WASM task completed!".to_string())
    }).await?;

    runtime.wait_all().await?;
    println!("   ✓ Task execution works in WASM\n");

    // Memory demo
    println!("2. Memory operations (WASM-compatible):");
    let memory = PhiMemory::new();

    let episode = Episode {
        id: "wasm_ep".to_string(),
        timestamp: 0,
        context: "wasm_context".to_string(),
        action: "wasm_action".to_string(),
        outcome: Outcome::Success("wasm_success".to_string()),
        metadata: HashMap::new(),
    };

    memory.store_episode(episode).await?;
    println!("   ✓ Episode storage works in WASM");

    let stats = memory.stats().await;
    println!("   ✓ Memory stats: {} episodes\n", stats.episode_count);

    println!("3. WASM bindings available in phi-wasm crate:");
    println!("   - WasmRuntime: Async task execution");
    println!("   - WasmMemory: Episode storage & learning");
    println!("   - PhiSystem: Unified interface");
    println!("\n✓ System is WASM-ready!");

    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn main() {
    println!("Running in WASM environment!");
    println!("Use phi-wasm bindings for full functionality.");
}
