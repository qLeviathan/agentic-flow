//! # Phi CLI - Command Line Interface
//!
//! Interactive CLI for Phi runtime and memory operations.

use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::*;
use phi_memory::{Episode, Outcome, PhiMemory};
use phi_runtime::{PhiRuntime, TaskId};
use std::collections::HashMap;
use std::time::Duration;

#[derive(Parser)]
#[command(name = "phi")]
#[command(about = "Phi System - Tokio Runtime + AgentDB Memory", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Runtime operations
    Runtime {
        #[command(subcommand)]
        action: RuntimeAction,
    },
    /// Memory operations
    Memory {
        #[command(subcommand)]
        action: MemoryAction,
    },
    /// Run example demonstrations
    Example {
        #[arg(short, long)]
        name: String,
    },
    /// Show system information
    Info,
}

#[derive(Subcommand)]
enum RuntimeAction {
    /// Spawn single async task
    Spawn {
        #[arg(short, long)]
        id: String,
        #[arg(short, long)]
        duration: Option<u64>,
    },
    /// Spawn multiple tasks in parallel
    Parallel {
        #[arg(short, long)]
        count: usize,
    },
    /// Execute with timeout
    Timeout {
        #[arg(short, long)]
        seconds: u64,
    },
}

#[derive(Subcommand)]
enum MemoryAction {
    /// Store new episode
    Store {
        #[arg(short, long)]
        id: String,
        #[arg(short, long)]
        context: String,
        #[arg(short, long)]
        action: String,
    },
    /// Query episodes
    Query {
        #[arg(short, long)]
        pattern: String,
    },
    /// Extract skills
    ExtractSkills,
    /// Discover causality
    DiscoverCausality,
    /// Show statistics
    Stats,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Runtime { action } => handle_runtime(action).await?,
        Commands::Memory { action } => handle_memory(action).await?,
        Commands::Example { name } => run_example(&name).await?,
        Commands::Info => show_info(),
    }

    Ok(())
}

async fn handle_runtime(action: RuntimeAction) -> Result<()> {
    let runtime = PhiRuntime::new();

    match action {
        RuntimeAction::Spawn { id, duration } => {
            println!("{}", format!("Spawning task: {}", id).green().bold());

            let sleep_ms = duration.unwrap_or(100);
            runtime
                .spawn(TaskId(id.clone()), move || async move {
                    tokio::time::sleep(Duration::from_millis(sleep_ms)).await;
                    Ok(format!("Task {} completed after {}ms", id, sleep_ms))
                })
                .await?;

            runtime.wait_all().await?;
            println!("{}", "Task completed successfully".green());
        }
        RuntimeAction::Parallel { count } => {
            println!("{}", format!("Spawning {} parallel tasks", count).green().bold());

            let tasks: Vec<_> = (0..count)
                .map(|i| {
                    move || async move {
                        tokio::time::sleep(Duration::from_millis(50)).await;
                        Ok(format!("Parallel task {} done", i))
                    }
                })
                .collect();

            let results = runtime.parallel(tasks).await;

            println!("{}", format!("Completed {} tasks", results.len()).green());
            for (i, result) in results.iter().enumerate() {
                match result {
                    Ok(msg) => println!("  {} {}", format!("[{}]", i).cyan(), msg),
                    Err(e) => println!("  {} {}", format!("[{}]", i).red(), e),
                }
            }
        }
        RuntimeAction::Timeout { seconds } => {
            println!("{}", format!("Executing with {}s timeout", seconds).green().bold());

            let result = runtime
                .execute_with_timeout(Duration::from_secs(seconds), || async {
                    tokio::time::sleep(Duration::from_secs(seconds + 1)).await;
                    Ok("Should timeout".to_string())
                })
                .await;

            match result {
                Ok(msg) => println!("{} {}", "Success:".green(), msg),
                Err(e) => println!("{} {}", "Timeout:".yellow(), e),
            }
        }
    }

    Ok(())
}

async fn handle_memory(action: MemoryAction) -> Result<()> {
    let memory = PhiMemory::new();

    match action {
        MemoryAction::Store { id, context, action } => {
            println!("{}", format!("Storing episode: {}", id).green().bold());

            let episode = Episode {
                id: id.clone(),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)?
                    .as_secs(),
                context,
                action,
                outcome: Outcome::Success("stored".to_string()),
                metadata: HashMap::new(),
            };

            memory.store_episode(episode).await?;
            println!("{}", "Episode stored successfully".green());
        }
        MemoryAction::Query { pattern } => {
            println!("{}", format!("Querying episodes: {}", pattern).green().bold());

            let episodes = memory.query_episodes(&pattern).await;

            if episodes.is_empty() {
                println!("{}", "No episodes found".yellow());
            } else {
                println!("{}", format!("Found {} episodes:", episodes.len()).green());
                for ep in episodes {
                    println!("  {} {}", ep.id.cyan(), ep.context);
                }
            }
        }
        MemoryAction::ExtractSkills => {
            println!("{}", "Extracting skills from episodes...".green().bold());

            let skills = memory.extract_skills().await?;

            if skills.is_empty() {
                println!("{}", "No skills extracted yet".yellow());
            } else {
                println!("{}", format!("Extracted {} skills:", skills.len()).green());
                for skill in skills {
                    println!(
                        "  {} {} (confidence: {:.2}, usage: {})",
                        skill.id.cyan(),
                        skill.name,
                        skill.confidence,
                        skill.usage_count
                    );
                }
            }
        }
        MemoryAction::DiscoverCausality => {
            println!("{}", "Discovering causal relationships...".green().bold());

            let edges = memory.discover_causality().await?;

            if edges.is_empty() {
                println!("{}", "No causal relationships found".yellow());
            } else {
                println!("{}", format!("Found {} causal edges:", edges.len()).green());
                for edge in edges {
                    println!(
                        "  {} → {} (strength: {:.2}, confidence: {:.2})",
                        edge.from.cyan(),
                        edge.to.cyan(),
                        edge.strength,
                        edge.confidence
                    );
                }
            }
        }
        MemoryAction::Stats => {
            println!("{}", "Memory Statistics:".green().bold());

            let stats = memory.stats().await;
            println!("  Episodes: {}", stats.episode_count.to_string().cyan());
            println!("  Skills: {}", stats.skill_count.to_string().cyan());
            println!("  Causal Edges: {}", stats.causal_edge_count.to_string().cyan());
            println!("  Latent Memories: {}", stats.latent_memory_count.to_string().cyan());
        }
    }

    Ok(())
}

async fn run_example(name: &str) -> Result<()> {
    match name {
        "basic" => example_basic().await?,
        "parallel" => example_parallel().await?,
        "memory" => example_memory().await?,
        "full" => example_full().await?,
        _ => println!("{}", format!("Unknown example: {}", name).red()),
    }
    Ok(())
}

async fn example_basic() -> Result<()> {
    println!("{}", "\n=== Basic Runtime Example ===".green().bold());

    let runtime = PhiRuntime::new();

    runtime
        .spawn(TaskId("example".to_string()), || async {
            println!("  Executing async task...");
            tokio::time::sleep(Duration::from_millis(100)).await;
            Ok("Task completed!".to_string())
        })
        .await?;

    runtime.wait_all().await?;
    println!("{}", "✓ Example completed".green());

    Ok(())
}

async fn example_parallel() -> Result<()> {
    println!("{}", "\n=== Parallel Execution Example ===".green().bold());

    let runtime = PhiRuntime::new();

    // Spawn tasks concurrently
    runtime.spawn(TaskId("task_a".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok("Task A done (50ms)".to_string())
    }).await?;

    runtime.spawn(TaskId("task_b".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(75)).await;
        Ok("Task B done (75ms)".to_string())
    }).await?;

    runtime.spawn(TaskId("task_c".to_string()), || async {
        tokio::time::sleep(Duration::from_millis(25)).await;
        Ok("Task C done (25ms)".to_string())
    }).await?;

    // Wait for all to complete
    runtime.wait_all().await?;

    println!("  ✓ All 3 tasks completed in parallel");
    println!("{}", "✓ Example completed".green());
    Ok(())
}

async fn example_memory() -> Result<()> {
    println!("{}", "\n=== Memory Operations Example ===".green().bold());

    let memory = PhiMemory::new();

    // Store episodes
    for i in 0..5 {
        let episode = Episode {
            id: format!("ep{}", i),
            timestamp: i,
            context: "learning context".to_string(),
            action: if i % 2 == 0 { "action_a" } else { "action_b" }.to_string(),
            outcome: Outcome::Success("completed".to_string()),
            metadata: HashMap::new(),
        };
        memory.store_episode(episode).await?;
    }

    println!("  Stored 5 episodes");

    // Extract skills
    let skills = memory.extract_skills().await?;
    println!("  Extracted {} skills", skills.len());

    // Show stats
    let stats = memory.stats().await;
    println!("  Memory stats: {} episodes, {} skills", stats.episode_count, stats.skill_count);

    println!("{}", "✓ Example completed".green());
    Ok(())
}

async fn example_full() -> Result<()> {
    println!("{}", "\n=== Full System Example ===".green().bold());

    let runtime = PhiRuntime::new();
    let memory = PhiMemory::new();

    // Execute tasks and store episodes
    let task_ids = vec!["task1", "task2", "task3"];
    let task_count = task_ids.len();

    for id in task_ids {
        let id_clone = id.to_string();
        runtime
            .spawn(TaskId(id.to_string()), move || async move {
                tokio::time::sleep(Duration::from_millis(50)).await;
                Ok(format!("{} completed", id_clone))
            })
            .await?;

        let episode = Episode {
            id: id.to_string(),
            timestamp: 0,
            context: "full example".to_string(),
            action: format!("execute_{}", id),
            outcome: Outcome::Success("done".to_string()),
            metadata: HashMap::new(),
        };
        memory.store_episode(episode).await?;
    }

    runtime.wait_all().await?;

    // Extract insights
    let skills = memory.extract_skills().await?;
    let edges = memory.discover_causality().await?;
    let stats = memory.stats().await;

    println!("  Executed {} tasks", task_count);
    println!("  Extracted {} skills", skills.len());
    println!("  Found {} causal relationships", edges.len());
    println!("  Total episodes: {}", stats.episode_count);

    println!("{}", "✓ Example completed".green());
    Ok(())
}

fn show_info() {
    println!("{}", "\n=== Phi System Information ===".green().bold());
    println!("Version: {}", "0.1.0".cyan());
    println!("Runtime: {}", "Tokio Async".cyan());
    println!("Memory: {}", "AgentDB-Equivalent".cyan());
    println!("WASM: {}", "Enabled".cyan());
    println!("\nComponents:");
    println!("  • {} - Async task execution", "phi-runtime".yellow());
    println!("  • {} - Episode storage & learning", "phi-memory".yellow());
    println!("  • {} - WebAssembly bindings", "phi-wasm".yellow());
    println!("  • {} - Command line interface", "phi-cli".yellow());
    println!("\nExamples:");
    println!("  phi example --name basic");
    println!("  phi example --name parallel");
    println!("  phi example --name memory");
    println!("  phi example --name full");
}
