use tauri::State;
use crate::anthropic::AnthropicClient;
use crate::{AppState, KeychainState};
use serde::{Deserialize, Serialize};

/// Request to initialize the client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitRequest {
    pub api_key: String,
}

/// Response for initialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitResponse {
    pub success: bool,
    pub message: String,
}

/// API key information structure
#[derive(Serialize, Deserialize)]
pub struct ApiKeyInfo {
    pub exists: bool,
    pub masked_key: String,
    pub configured: bool,
}

/// Save the Anthropic API key securely to the system keychain
///
/// This command stores the API key in the operating system's secure storage:
/// - macOS: Keychain
/// - Windows: Credential Manager
/// - Linux: Secret Service API
///
/// # Arguments
/// * `api_key` - The Anthropic API key to save
/// * `keychain_state` - Keychain state for secure storage
/// * `app_state` - Application state for initializing the client
///
/// # Returns
/// * `Result<String, String>` - Success message or error
///
/// # Security
/// The API key is never stored in localStorage, environment variables,
/// or any other insecure location in production builds.
#[tauri::command]
pub async fn save_api_key(
    api_key: String,
    keychain_state: State<'_, KeychainState>,
    app_state: State<'_, AppState>,
) -> Result<String, String> {
    log::info!("Attempting to save API key to keychain");

    // Validate API key format
    if api_key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }

    if !api_key.starts_with("sk-ant-") {
        log::warn!("API key does not match expected Anthropic format");
    }

    // Save to keychain
    let keychain = keychain_state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    keychain.save_api_key(&api_key).map_err(|e| {
        log::error!("Failed to save API key: {}", e);
        format!("Failed to save API key: {}", e)
    })?;

    // Initialize the client with the new API key
    match AnthropicClient::new(api_key) {
        Ok(client) => {
            let mut client_guard = app_state.client.lock().await;
            *client_guard = Some(client);
            log::info!("API key saved and client initialized successfully");
            Ok("API key saved successfully".to_string())
        }
        Err(e) => {
            log::error!("Failed to initialize client: {}", e);
            Err(format!("API key saved, but failed to initialize client: {}", e))
        }
    }
}

/// Check if an API key is configured and stored in the keychain
///
/// # Arguments
/// * `state` - Keychain state containing keychain access
///
/// # Returns
/// * `Result<bool, String>` - True if API key exists, false otherwise
#[tauri::command]
pub async fn check_api_key(
    state: State<'_, KeychainState>,
) -> Result<bool, String> {
    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    Ok(keychain.has_api_key())
}

/// Load the API key from keychain and initialize the client
///
/// This is typically called on application startup to restore
/// the API key from secure storage.
///
/// # Arguments
/// * `keychain_state` - Keychain state for retrieving the key
/// * `app_state` - Application state for initializing the client
///
/// # Returns
/// * `Result<InitResponse, String>` - Success response or error message
#[tauri::command]
pub async fn init_with_keychain(
    keychain_state: State<'_, KeychainState>,
    app_state: State<'_, AppState>,
) -> Result<InitResponse, String> {
    log::info!("Attempting to initialize client with keychain API key");

    // Try to get API key from keychain
    let keychain = keychain_state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    let api_key = keychain.get_api_key().map_err(|e| {
        log::warn!("Failed to retrieve API key: {}", e);
        "API key not found in keychain. Please configure your Anthropic API key.".to_string()
    })?;

    drop(keychain); // Release the lock

    if api_key.is_empty() {
        return Err("No API key found in keychain".to_string());
    }

    // Initialize the Anthropic client
    match AnthropicClient::new(api_key) {
        Ok(client) => {
            let mut client_guard = app_state.client.lock().await;
            *client_guard = Some(client);

            log::info!("Client initialized successfully from keychain");
            Ok(InitResponse {
                success: true,
                message: "Client initialized successfully".to_string(),
            })
        }
        Err(e) => {
            log::error!("Failed to initialize client: {}", e);
            Err(format!("Failed to initialize client: {}", e))
        }
    }
}

/// Initialize the Anthropic client with a provided API key
///
/// # Arguments
/// * `state` - Application state
/// * `request` - Initialization request containing the API key
///
/// # Returns
/// * `Result<InitResponse, String>` - Success response or error
#[tauri::command]
pub async fn init_client(
    state: State<'_, AppState>,
    request: InitRequest,
) -> Result<InitResponse, String> {
    log::info!("Initializing Anthropic client");

    match AnthropicClient::new(request.api_key) {
        Ok(client) => {
            let mut client_guard = state.client.lock().await;
            *client_guard = Some(client);

            log::info!("Client initialized successfully");
            Ok(InitResponse {
                success: true,
                message: "Client initialized successfully".to_string(),
            })
        }
        Err(e) => {
            log::error!("Failed to initialize client: {}", e);
            Err(format!("Failed to initialize client: {}", e))
        }
    }
}

/// Delete the API key from the secure keychain
///
/// This removes the API key from system storage and clears
/// the active client from memory.
///
/// # Arguments
/// * `keychain_state` - Keychain state
/// * `app_state` - Application state
///
/// # Returns
/// * `Result<String, String>` - Success message or error
#[tauri::command]
pub async fn delete_api_key(
    keychain_state: State<'_, KeychainState>,
    app_state: State<'_, AppState>,
) -> Result<String, String> {
    log::info!("Attempting to delete API key from keychain");

    // Delete from keychain
    let keychain = keychain_state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    keychain.delete_api_key().map_err(|e| {
        log::error!("Failed to delete API key: {}", e);
        format!("Failed to delete API key: {}", e)
    })?;

    drop(keychain); // Release the lock

    // Clear the client from memory
    let mut client_guard = app_state.client.lock().await;
    *client_guard = None;

    log::info!("API key deleted successfully");
    Ok("API key deleted successfully".to_string())
}

/// Validate an API key without saving it
///
/// This makes a test request to the Anthropic API to verify
/// the key is valid before saving it to the keychain.
///
/// # Arguments
/// * `api_key` - The API key to validate
///
/// # Returns
/// * `Result<bool, String>` - True if valid, error message if invalid
#[tauri::command]
pub async fn validate_api_key(
    api_key: String,
) -> Result<bool, String> {
    log::info!("Validating API key");

    // Validate format
    if api_key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }

    if !api_key.starts_with("sk-ant-") {
        return Err("Invalid API key format. Anthropic keys start with 'sk-ant-'".to_string());
    }

    // Try to create a client and make a test request
    let client = AnthropicClient::new(api_key)
        .map_err(|e| format!("Failed to create client: {}", e))?;

    // Make a minimal test request
    let test_message = vec![crate::anthropic::Message::user("Hi")];
    let request = crate::anthropic::MessageRequest::new(test_message).max_tokens(10);

    match client.send_message(request).await {
        Ok(_) => {
            log::info!("API key validation successful");
            Ok(true)
        }
        Err(e) => {
            log::error!("API key validation failed: {}", e);
            Err(format!("API key validation failed: {}", e))
        }
    }
}

/// Check if client is initialized
#[tauri::command]
pub async fn is_initialized(state: State<'_, AppState>) -> Result<bool, String> {
    let client_guard = state.client.lock().await;
    Ok(client_guard.is_some())
}

/// Get API key metadata (without exposing the actual key)
///
/// Returns information about the stored API key without revealing
/// the actual key value for security purposes.
///
/// # Arguments
/// * `keychain_state` - Keychain state
/// * `app_state` - Application state
///
/// # Returns
/// * `Result<ApiKeyInfo, String>` - Metadata about the API key
#[tauri::command]
pub async fn get_api_key_info(
    keychain_state: State<'_, KeychainState>,
    app_state: State<'_, AppState>,
) -> Result<ApiKeyInfo, String> {
    let keychain = keychain_state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    match keychain.get_api_key() {
        Ok(key) if !key.is_empty() => {
            // Only show first and last few characters
            let masked = if key.len() > 12 {
                format!("{}...{}", &key[..8], &key[key.len()-4..])
            } else {
                "***".to_string()
            };

            let client_guard = app_state.client.lock().await;
            Ok(ApiKeyInfo {
                exists: true,
                masked_key: masked,
                configured: client_guard.is_some(),
            })
        }
        _ => Ok(ApiKeyInfo {
            exists: false,
            masked_key: String::new(),
            configured: false,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_key_info_serialization() {
        let info = ApiKeyInfo {
            exists: true,
            masked_key: "sk-ant-***".to_string(),
            configured: true,
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("exists"));
        assert!(json.contains("masked_key"));
        assert!(json.contains("configured"));
    }

    #[test]
    fn test_init_request_serialization() {
        let req = InitRequest {
            api_key: "sk-ant-test".to_string(),
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("api_key"));
    }
}
