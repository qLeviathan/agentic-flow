//! # Phi WASM - WebAssembly Bindings
//!
//! Pure Rust compiled to WebAssembly for web deployment.
//! Provides JS-interop for runtime and memory operations.

use phi_memory::{Episode, Outcome, PhiMemory};
use phi_runtime::{PhiRuntime, TaskId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
use web_sys::console;

/// Initialize panic hook for better error messages in browser
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(target_arch = "wasm32")]
    console_error_panic_hook::set_once();
}

/// WASM-compatible runtime wrapper
#[wasm_bindgen]
pub struct WasmRuntime {
    #[wasm_bindgen(skip)]
    pub inner: PhiRuntime,
}

#[wasm_bindgen]
impl WasmRuntime {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: PhiRuntime::new(),
        }
    }

    /// Execute async task from JavaScript
    #[wasm_bindgen(js_name = executeTask)]
    pub async fn execute_task(&self, task_id: String, code: String) -> Result<String, JsValue> {
        log(&format!("Executing task: {}", task_id));

        let task_id_clone = task_id.clone();
        let code_clone = code.clone();
        self.inner
            .spawn(TaskId(task_id.clone()), || async move {
                // Simulate task execution
                Ok(format!("Task {} completed: {}", task_id_clone, code_clone))
            })
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        self.inner
            .wait_all()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(format!("Task {} executed successfully", task_id))
    }

    /// Execute multiple tasks in parallel
    #[wasm_bindgen(js_name = executeParallel)]
    pub async fn execute_parallel(&self, task_ids: Vec<String>) -> Result<String, JsValue> {
        log(&format!("Executing {} tasks in parallel", task_ids.len()));

        let tasks: Vec<_> = task_ids
            .iter()
            .map(|id| {
                let id = id.clone();
                (TaskId(id.clone()), || async move {
                    Ok(format!("Parallel task {} done", id))
                })
            })
            .collect();

        self.inner
            .spawn_many(tasks)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        self.inner
            .wait_all()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(format!("{} tasks completed", task_ids.len()))
    }
}

/// WASM-compatible memory wrapper
#[wasm_bindgen]
pub struct WasmMemory {
    #[wasm_bindgen(skip)]
    pub inner: PhiMemory,
}

#[wasm_bindgen]
impl WasmMemory {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: PhiMemory::new(),
        }
    }

    /// Store episode from JavaScript
    #[wasm_bindgen(js_name = storeEpisode)]
    pub async fn store_episode(
        &self,
        id: String,
        context: String,
        action: String,
        outcome: String,
    ) -> Result<(), JsValue> {
        log(&format!("Storing episode: {}", id));

        let episode = Episode {
            id,
            timestamp: js_sys::Date::now() as u64,
            context,
            action,
            outcome: Outcome::Success(outcome),
            metadata: HashMap::new(),
        };

        self.inner
            .store_episode(episode)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Query episodes from JavaScript
    #[wasm_bindgen(js_name = queryEpisodes)]
    pub async fn query_episodes(&self, pattern: String) -> Result<String, JsValue> {
        log(&format!("Querying episodes: {}", pattern));

        let episodes = self.inner.query_episodes(&pattern).await;
        serde_json::to_string(&episodes)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Extract skills from episodes
    #[wasm_bindgen(js_name = extractSkills)]
    pub async fn extract_skills(&self) -> Result<String, JsValue> {
        log("Extracting skills from episodes");

        let skills = self
            .inner
            .extract_skills()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        serde_json::to_string(&skills)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Discover causal relationships
    #[wasm_bindgen(js_name = discoverCausality)]
    pub async fn discover_causality(&self) -> Result<String, JsValue> {
        log("Discovering causal relationships");

        let edges = self
            .inner
            .discover_causality()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        serde_json::to_string(&edges)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get memory statistics
    #[wasm_bindgen(js_name = getStats)]
    pub async fn get_stats(&self) -> Result<String, JsValue> {
        let stats = self.inner.stats().await;
        serde_json::to_string(&stats)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Encode data with Latent-N
    #[wasm_bindgen(js_name = encodeLatent)]
    pub async fn encode_latent(&self, key: String, data: Vec<u8>) -> Result<String, JsValue> {
        log(&format!("Encoding latent memory: {}", key));

        let memory = self
            .inner
            .encode_latent(&key, &data)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        serde_json::to_string(&memory)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Decode Latent-N memory
    #[wasm_bindgen(js_name = decodeLatent)]
    pub async fn decode_latent(&self, key: String) -> Result<Vec<u8>, JsValue> {
        log(&format!("Decoding latent memory: {}", key));

        self.inner
            .decode_latent(&key)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Unified WASM interface combining runtime and memory
#[wasm_bindgen]
pub struct PhiSystem {
    runtime: WasmRuntime,
    memory: WasmMemory,
}

#[wasm_bindgen]
impl PhiSystem {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        log("Initializing Phi System in WASM");
        Self {
            runtime: WasmRuntime::new(),
            memory: WasmMemory::new(),
        }
    }

    /// Execute task and store episode
    #[wasm_bindgen(js_name = executeAndStore)]
    pub async fn execute_and_store(
        &self,
        task_id: String,
        context: String,
        action: String,
    ) -> Result<String, JsValue> {
        // Execute task
        let result = self.runtime.execute_task(task_id.clone(), action.clone()).await?;

        // Store episode
        self.memory
            .store_episode(task_id.clone(), context, action, result.clone())
            .await?;

        Ok(result)
    }

    /// Get system info
    #[wasm_bindgen(js_name = getSystemInfo)]
    pub fn get_system_info(&self) -> String {
        "Phi System v0.1.0 - Tokio Runtime + AgentDB Memory in WASM".to_string()
    }
}

/// Logging helper for WASM
#[cfg(target_arch = "wasm32")]
fn log(s: &str) {
    console::log_1(&JsValue::from_str(s));
}

#[cfg(not(target_arch = "wasm32"))]
fn log(s: &str) {
    println!("{}", s);
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_wasm_runtime() {
        let runtime = WasmRuntime::new();
        let result = runtime.execute_task("test".to_string(), "println!(\"test\")".to_string()).await;
        assert!(result.is_ok());
    }

    #[wasm_bindgen_test]
    async fn test_wasm_memory() {
        let memory = WasmMemory::new();
        let result = memory
            .store_episode(
                "test".to_string(),
                "context".to_string(),
                "action".to_string(),
                "success".to_string(),
            )
            .await;
        assert!(result.is_ok());
    }

    #[wasm_bindgen_test]
    fn test_phi_system() {
        let system = PhiSystem::new();
        let info = system.get_system_info();
        assert!(info.contains("Phi System"));
    }
}
