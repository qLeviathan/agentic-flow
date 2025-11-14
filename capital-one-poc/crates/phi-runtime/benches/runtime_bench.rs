use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use phi_runtime::{PhiRuntime, TaskId};
use std::time::Duration;

fn bench_spawn_single(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    c.bench_function("spawn_single_task", |b| {
        b.to_async(&rt).iter(|| async {
            let runtime = PhiRuntime::new();
            runtime.spawn(TaskId("bench".to_string()), || async {
                Ok("done".to_string())
            }).await.unwrap();
            runtime.wait_all().await.unwrap();
        });
    });
}

fn bench_spawn_parallel(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("spawn_parallel");

    for count in [10, 50, 100, 500].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(count), count, |b, &count| {
            b.to_async(&rt).iter(|| async move {
                let runtime = PhiRuntime::new();
                let tasks: Vec<_> = (0..count)
                    .map(|_| || async { Ok("done".to_string()) })
                    .collect();
                runtime.parallel(tasks).await;
            });
        });
    }
    group.finish();
}

fn bench_execute_with_timeout(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();

    c.bench_function("execute_with_timeout", |b| {
        b.to_async(&rt).iter(|| async {
            let runtime = PhiRuntime::new();
            let _ = runtime.execute_with_timeout(
                Duration::from_millis(100),
                || async {
                    tokio::time::sleep(Duration::from_millis(10)).await;
                    Ok("done".to_string())
                }
            ).await;
        });
    });
}

criterion_group!(benches, bench_spawn_single, bench_spawn_parallel, bench_execute_with_timeout);
criterion_main!(benches);
