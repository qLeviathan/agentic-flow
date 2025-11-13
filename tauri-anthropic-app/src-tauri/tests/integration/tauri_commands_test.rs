// Integration tests for Tauri IPC commands
use std::sync::Mutex;

// Mock structures for testing
#[derive(Clone, Debug, PartialEq)]
struct Message {
    role: String,
    content: String,
}

struct MockAnthropicClient {
    api_key: String,
}

impl MockAnthropicClient {
    fn new(api_key: String) -> Result<Self, String> {
        if api_key.is_empty() {
            return Err("API key cannot be empty".to_string());
        }
        Ok(Self { api_key })
    }

    async fn send_message(
        &self,
        messages: Vec<Message>,
        _model: &str,
        _max_tokens: u32,
    ) -> Result<String, String> {
        if messages.is_empty() {
            return Err("Messages cannot be empty".to_string());
        }
        Ok(format!("Mock response to: {}", messages[0].content))
    }
}

struct MockKeychainStorage {
    stored_key: Mutex<Option<String>>,
}

impl MockKeychainStorage {
    fn new(_app_name: &str) -> Self {
        Self {
            stored_key: Mutex::new(None),
        }
    }

    fn save_api_key(&self, key: &str) -> Result<(), String> {
        let mut stored = self.stored_key.lock().unwrap();
        *stored = Some(key.to_string());
        Ok(())
    }

    fn get_api_key(&self) -> Result<String, String> {
        let stored = self.stored_key.lock().unwrap();
        stored.clone().ok_or_else(|| "No API key stored".to_string())
    }

    fn delete_api_key(&self) -> Result<(), String> {
        let mut stored = self.stored_key.lock().unwrap();
        *stored = None;
        Ok(())
    }
}

struct AppState {
    client: Mutex<Option<MockAnthropicClient>>,
    keychain: MockKeychainStorage,
}

// Mock Tauri commands
async fn save_api_key_command(
    api_key: String,
    state: &AppState,
) -> Result<(), String> {
    state.keychain.save_api_key(&api_key)?;

    let client = MockAnthropicClient::new(api_key)?;
    *state.client.lock().unwrap() = Some(client);

    Ok(())
}

async fn send_chat_message_command(
    message: String,
    state: &AppState,
) -> Result<String, String> {
    let client_guard = state.client.lock().unwrap();
    let client = client_guard
        .as_ref()
        .ok_or("API key not configured")?;

    let messages = vec![Message {
        role: "user".to_string(),
        content: message,
    }];

    client.send_message(messages, "claude-3-5-sonnet-20241022", 1024).await
}

async fn check_api_key_command(state: &AppState) -> Result<bool, String> {
    match state.keychain.get_api_key() {
        Ok(key) if !key.is_empty() => Ok(true),
        _ => Ok(false),
    }
}

async fn get_api_key_command(state: &AppState) -> Result<String, String> {
    state.keychain.get_api_key()
}

async fn delete_api_key_command(state: &AppState) -> Result<(), String> {
    state.keychain.delete_api_key()?;
    *state.client.lock().unwrap() = None;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_state() -> AppState {
        AppState {
            client: Mutex::new(None),
            keychain: MockKeychainStorage::new("test-app"),
        }
    }

    #[tokio::test]
    async fn test_save_api_key_success() {
        let state = create_test_state();
        let result = save_api_key_command("sk-ant-test-key".to_string(), &state).await;

        assert!(result.is_ok());
        assert!(state.client.lock().unwrap().is_some());
    }

    #[tokio::test]
    async fn test_save_empty_api_key() {
        let state = create_test_state();
        let result = save_api_key_command("".to_string(), &state).await;

        assert!(result.is_err());
        assert!(state.client.lock().unwrap().is_none());
    }

    #[tokio::test]
    async fn test_send_message_without_api_key() {
        let state = create_test_state();
        let result = send_chat_message_command("Hello".to_string(), &state).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "API key not configured");
    }

    #[tokio::test]
    async fn test_send_message_with_api_key() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let result = send_chat_message_command("Hello".to_string(), &state).await;

        assert!(result.is_ok());
        assert!(result.unwrap().contains("Mock response to: Hello"));
    }

    #[tokio::test]
    async fn test_check_api_key_not_configured() {
        let state = create_test_state();
        let result = check_api_key_command(&state).await;

        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[tokio::test]
    async fn test_check_api_key_configured() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let result = check_api_key_command(&state).await;

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn test_get_api_key_success() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let result = get_api_key_command(&state).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "sk-ant-test-key");
    }

    #[tokio::test]
    async fn test_get_api_key_not_configured() {
        let state = create_test_state();
        let result = get_api_key_command(&state).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_api_key() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let delete_result = delete_api_key_command(&state).await;
        assert!(delete_result.is_ok());

        assert!(state.client.lock().unwrap().is_none());

        let check_result = check_api_key_command(&state).await;
        assert!(!check_result.unwrap());
    }

    #[tokio::test]
    async fn test_multiple_messages() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let result1 = send_chat_message_command("Message 1".to_string(), &state).await;
        let result2 = send_chat_message_command("Message 2".to_string(), &state).await;

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result1.unwrap().contains("Message 1"));
        assert!(result2.unwrap().contains("Message 2"));
    }

    #[tokio::test]
    async fn test_update_api_key() {
        let state = create_test_state();

        save_api_key_command("old-key".to_string(), &state).await.unwrap();
        let old_key = get_api_key_command(&state).await.unwrap();
        assert_eq!(old_key, "old-key");

        save_api_key_command("new-key".to_string(), &state).await.unwrap();
        let new_key = get_api_key_command(&state).await.unwrap();
        assert_eq!(new_key, "new-key");
    }

    #[tokio::test]
    async fn test_send_empty_message() {
        let state = create_test_state();
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let result = send_chat_message_command("".to_string(), &state).await;
        assert!(result.is_ok()); // Empty message should be handled by API
    }

    #[tokio::test]
    async fn test_concurrent_api_calls() {
        use std::sync::Arc;

        let state = Arc::new(create_test_state());
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        let mut handles = vec![];

        for i in 0..5 {
            let state_clone = Arc::clone(&state);
            let handle = tokio::spawn(async move {
                let message = format!("Message {}", i);
                send_chat_message_command(message, &state_clone).await
            });
            handles.push(handle);
        }

        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_full_workflow() {
        let state = create_test_state();

        // 1. Check no API key initially
        assert!(!check_api_key_command(&state).await.unwrap());

        // 2. Save API key
        save_api_key_command("sk-ant-test-key".to_string(), &state).await.unwrap();

        // 3. Check API key exists
        assert!(check_api_key_command(&state).await.unwrap());

        // 4. Send message
        let response = send_chat_message_command("Test message".to_string(), &state).await;
        assert!(response.is_ok());

        // 5. Delete API key
        delete_api_key_command(&state).await.unwrap();

        // 6. Verify API key deleted
        assert!(!check_api_key_command(&state).await.unwrap());

        // 7. Verify cannot send message without API key
        let error_response = send_chat_message_command("Test".to_string(), &state).await;
        assert!(error_response.is_err());
    }
}
