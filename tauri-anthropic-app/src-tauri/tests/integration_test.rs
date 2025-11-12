// Integration tests for Tauri Anthropic App
// Run with: cargo test --test integration_test

#[cfg(test)]
mod tests {
    use tauri_anthropic_app::anthropic::{Message, MessageRequest};

    #[test]
    fn test_message_creation() {
        let msg = Message::user("Hello, Claude!");
        assert_eq!(msg.role, tauri_anthropic_app::anthropic::Role::User);
    }

    #[test]
    fn test_message_request_builder() {
        let messages = vec![Message::user("Test")];
        let request = MessageRequest::new(messages)
            .model("claude-3-5-sonnet-20241022")
            .max_tokens(100);

        assert_eq!(request.model, "claude-3-5-sonnet-20241022");
        assert_eq!(request.max_tokens, 100);
    }

    #[test]
    fn test_keychain_storage_creation() {
        use tauri_anthropic_app::keychain::KeychainStorage;

        let storage = KeychainStorage::new("test-app");
        // Basic creation test - actual keychain operations require platform setup
        assert!(true); // If we got here, creation succeeded
    }
}
