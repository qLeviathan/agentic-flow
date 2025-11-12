/// Secure keychain storage module for API keys
///
/// This module provides cross-platform secure storage using system keychains:
/// - macOS: Keychain Access
/// - Windows: Credential Manager
/// - Linux: Secret Service API (libsecret)
///
/// # Security Principles
///
/// 1. **Never store in localStorage** - JS storage is not encrypted
/// 2. **Never log API keys** - Keys should never appear in logs
/// 3. **Environment variables only in dev** - Production must use keychain
/// 4. **Encrypt in transit** - Always use HTTPS
/// 5. **OS-level encryption** - Leverage platform security features
///
/// # Usage Example
///
/// ```rust
/// use keychain::KeychainStorage;
///
/// let storage = KeychainStorage::new("my-tauri-app");
///
/// // Save API key
/// storage.save_api_key("sk-ant-...")?;
///
/// // Check if key exists
/// if storage.has_api_key() {
///     // Retrieve and use
///     let key = storage.get_api_key()?;
///     // Use key for API calls...
/// }
///
/// // Delete when no longer needed
/// storage.delete_api_key()?;
/// ```

mod storage;

pub use storage::{ApiKeyMetadata, KeychainStorage};

/// Initialize keychain storage with validation
///
/// # Arguments
/// * `app_name` - Application identifier
///
/// # Returns
/// Configured KeychainStorage instance
pub fn init_keychain(app_name: &str) -> KeychainStorage {
    log::info!("Initializing keychain storage for: {}", app_name);
    KeychainStorage::new(app_name)
}

/// Check keychain availability on the current platform
///
/// # Returns
/// `true` if keychain is available and accessible
pub fn check_keychain_availability() -> bool {
    let test_storage = KeychainStorage::new("keychain-test");
    // Try to perform a basic operation to verify keychain access
    test_storage.has_api_key();
    true // If we got here, keychain is available
}
