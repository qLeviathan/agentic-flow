// Commands module - organizes all Tauri IPC commands
pub mod chat;
pub mod config;

// Re-export all commands for easy access
pub use chat::{send_chat_message, send_text, stream_chat_message, SendMessageRequest, SendMessageResponse, MessageData, UsageData};
pub use config::{
    check_api_key, delete_api_key, get_api_key_info, init_client, init_with_keychain,
    is_initialized, save_api_key, validate_api_key, ApiKeyInfo, InitRequest, InitResponse,
};
