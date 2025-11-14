//! # Phi Runtime - Tokio Async Runtime
//!
//! High-performance async task execution with multi-threaded runtime.
//! Pure Rust implementation for on-premise deployment.

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, RwLock};
use tokio::task::JoinHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    pub id: TaskId,
    pub status: TaskStatus,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[async_trait]
pub trait Task: Send + Sync {
    async fn execute(&self) -> Result<String>;
    fn metadata(&self) -> &TaskMetadata;
}

/// Core async runtime with Tokio
pub struct PhiRuntime {
    tasks: Arc<RwLock<Vec<Box<dyn Task>>>>,
    handles: Arc<RwLock<Vec<JoinHandle<()>>>>,
    tx: mpsc::UnboundedSender<TaskMessage>,
    rx: Arc<RwLock<mpsc::UnboundedReceiver<TaskMessage>>>,
}

#[derive(Debug)]
enum TaskMessage {
    Complete(TaskId, Result<String>),
    Status(TaskId, TaskStatus),
}

impl PhiRuntime {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            tasks: Arc::new(RwLock::new(Vec::new())),
            handles: Arc::new(RwLock::new(Vec::new())),
            tx,
            rx: Arc::new(RwLock::new(rx)),
        }
    }

    /// Spawn async task with automatic scheduling
    pub async fn spawn<F, Fut>(&self, task_id: TaskId, f: F) -> Result<()>
    where
        F: FnOnce() -> Fut + Send + 'static,
        Fut: Future<Output = Result<String>> + Send + 'static,
    {
        let tx = self.tx.clone();
        let id = task_id.clone();

        let handle = tokio::spawn(async move {
            let result = f().await;
            let _ = tx.send(TaskMessage::Complete(id, result));
        });

        self.handles.write().await.push(handle);
        Ok(())
    }

    /// Spawn multiple tasks concurrently
    pub async fn spawn_many<F, Fut>(&self, tasks: Vec<(TaskId, F)>) -> Result<()>
    where
        F: FnOnce() -> Fut + Send + 'static,
        Fut: Future<Output = Result<String>> + Send + 'static,
    {
        for (id, f) in tasks {
            self.spawn(id, f).await?;
        }
        Ok(())
    }

    /// Wait for all tasks to complete
    pub async fn wait_all(&self) -> Result<()> {
        let mut handles = self.handles.write().await;
        while let Some(handle) = handles.pop() {
            handle.await?;
        }
        Ok(())
    }

    /// Poll for task completion messages
    pub async fn poll_messages(&self) -> Vec<TaskMessage> {
        let mut messages = Vec::new();
        let mut rx = self.rx.write().await;
        while let Ok(msg) = rx.try_recv() {
            messages.push(msg);
        }
        messages
    }

    /// Execute with timeout
    pub async fn execute_with_timeout<F, Fut>(
        &self,
        duration: Duration,
        f: F,
    ) -> Result<String>
    where
        F: FnOnce() -> Fut + Send,
        Fut: Future<Output = Result<String>> + Send,
    {
        tokio::time::timeout(duration, f()).await?
    }

    /// Parallel execution of independent tasks
    pub async fn parallel<F, Fut>(&self, tasks: Vec<F>) -> Vec<Result<String>>
    where
        F: FnOnce() -> Fut + Send + 'static,
        Fut: Future<Output = Result<String>> + Send + 'static,
    {
        let handles: Vec<_> = tasks
            .into_iter()
            .map(|f| tokio::spawn(f()))
            .collect();

        let mut results = Vec::new();
        for handle in handles {
            results.push(handle.await.unwrap_or_else(|e| Err(anyhow::anyhow!(e))));
        }
        results
    }
}

impl Default for PhiRuntime {
    fn default() -> Self {
        Self::new()
    }
}

/// Simple task implementation
#[derive(Clone)]
pub struct SimpleTask {
    metadata: TaskMetadata,
    function: Arc<dyn Fn() -> Result<String> + Send + Sync>,
}

impl SimpleTask {
    pub fn new(id: String, f: impl Fn() -> Result<String> + Send + Sync + 'static) -> Self {
        Self {
            metadata: TaskMetadata {
                id: TaskId(id),
                status: TaskStatus::Pending,
                created_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                completed_at: None,
            },
            function: Arc::new(f),
        }
    }
}

#[async_trait]
impl Task for SimpleTask {
    async fn execute(&self) -> Result<String> {
        (self.function)()
    }

    fn metadata(&self) -> &TaskMetadata {
        &self.metadata
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_spawn_task() {
        let runtime = PhiRuntime::new();
        let result = runtime
            .spawn(TaskId("test".to_string()), || async {
                Ok("success".to_string())
            })
            .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_parallel_execution() {
        let runtime = PhiRuntime::new();
        let tasks = vec![
            || async { Ok("task1".to_string()) },
            || async { Ok("task2".to_string()) },
            || async { Ok("task3".to_string()) },
        ];
        let results = runtime.parallel(tasks).await;
        assert_eq!(results.len(), 3);
        assert!(results.iter().all(|r| r.is_ok()));
    }

    #[tokio::test]
    async fn test_timeout() {
        let runtime = PhiRuntime::new();
        let result = runtime
            .execute_with_timeout(Duration::from_millis(100), || async {
                tokio::time::sleep(Duration::from_secs(1)).await;
                Ok("late".to_string())
            })
            .await;
        assert!(result.is_err());
    }
}
