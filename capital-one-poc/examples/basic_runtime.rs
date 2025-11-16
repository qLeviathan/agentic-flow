//! Basic runtime example - spawning async tasks with Tokio

use anyhow::Result;
use phi_runtime::{PhiRuntime, TaskId};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<()> {
    println!("=== Basic Runtime Example ===\n");

    let runtime = PhiRuntime::new();

    // Example 1: Single task
    println!("1. Spawning single task...");
    runtime
        .spawn(TaskId("task1".to_string()), || async {
            println!("   Task 1 executing...");
            tokio::time::sleep(Duration::from_millis(100)).await;
            Ok("Task 1 completed!".to_string())
        })
        .await?;

    runtime.wait_all().await?;
    println!("   ✓ Task 1 done\n");

    // Example 2: Multiple sequential tasks
    println!("2. Spawning sequential tasks...");
    for i in 1..=3 {
        let id = format!("seq_{}", i);
        runtime
            .spawn(TaskId(id.clone()), move || async move {
                println!("   Task {} running", id);
                tokio::time::sleep(Duration::from_millis(50)).await;
                Ok(format!("Task {} done", id))
            })
            .await?;
    }

    runtime.wait_all().await?;
    println!("   ✓ All sequential tasks completed\n");

    // Example 3: Parallel execution
    println!("3. Parallel execution...");

    // Spawn tasks in parallel
    runtime.spawn(TaskId("parallel_a".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok("Task A (100ms)".to_string())
    }).await?;

    runtime.spawn(TaskId("parallel_b".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok("Task B (50ms)".to_string())
    }).await?;

    runtime.spawn(TaskId("parallel_c".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(75)).await;
        Ok("Task C (75ms)".to_string())
    }).await?;

    runtime.wait_all().await?;
    println!("   ✓ All 3 tasks completed in parallel");

    println!("\n✓ All examples completed!");
    Ok(())
}
