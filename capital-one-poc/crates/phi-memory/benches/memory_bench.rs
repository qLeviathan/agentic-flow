use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use phi_memory::{Episode, Outcome, PhiMemory};
use std::collections::HashMap;

fn bench_store_episode(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    c.bench_function("store_episode", |b| {
        b.to_async(&rt).iter(|| async {
            let memory = PhiMemory::new();
            let episode = Episode {
                id: "bench".to_string(),
                timestamp: 0,
                context: "benchmark".to_string(),
                action: "test".to_string(),
                outcome: Outcome::Success("done".to_string()),
                metadata: HashMap::new(),
            };
            memory.store_episode(episode).await.unwrap();
        });
    });
}

fn bench_query_episodes(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("query_episodes");

    for count in [100, 500, 1000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(count), count, |b, &count| {
            b.to_async(&rt).iter(|| async move {
                let memory = PhiMemory::new();

                // Populate memory
                for i in 0..count {
                    let episode = Episode {
                        id: format!("ep{}", i),
                        timestamp: i as u64,
                        context: format!("context_{}", i % 10),
                        action: "test".to_string(),
                        outcome: Outcome::Success("done".to_string()),
                        metadata: HashMap::new(),
                    };
                    memory.store_episode(episode).await.unwrap();
                }

                // Query
                let _ = memory.query_episodes("context_5").await;
            });
        });
    }
    group.finish();
}

fn bench_extract_skills(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    c.bench_function("extract_skills", |b| {
        b.to_async(&rt).iter(|| async {
            let memory = PhiMemory::new();

            // Store episodes with patterns
            for i in 0..50 {
                let episode = Episode {
                    id: format!("ep{}", i),
                    timestamp: i,
                    context: "context".to_string(),
                    action: format!("action_{}", i % 5),
                    outcome: Outcome::Success("done".to_string()),
                    metadata: HashMap::new(),
                };
                memory.store_episode(episode).await.unwrap();
            }

            memory.extract_skills().await.unwrap();
        });
    });
}

fn bench_latent_encoding(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("latent_encoding");

    for size in [256, 1024, 4096].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            b.to_async(&rt).iter(|| async move {
                let memory = PhiMemory::new();
                let data: Vec<u8> = (0..size).map(|i| (i % 256) as u8).collect();

                memory.encode_latent("bench", &data).await.unwrap();
                memory.decode_latent("bench").await.unwrap();
            });
        });
    }
    group.finish();
}

criterion_group!(benches, bench_store_episode, bench_query_episodes, bench_extract_skills, bench_latent_encoding);
criterion_main!(benches);
