use anyhow::{Context, Result};
use keyring::Entry;
use serde::{Deserialize, Serialize};

/// KeychainStorage provides secure, cross-platform API key storage
///
/// Platform-specific implementations:
/// - macOS: Keychain Access
/// - Windows: Credential Manager
/// - Linux: Secret Service API (libsecret)
#[derive(Debug, Clone)]
pub struct KeychainStorage {
    service: String,
    username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyMetadata {
    pub created_at: i64,
    pub last_used: Option<i64>,
}

impl KeychainStorage {
    /// Create a new KeychainStorage instance
    ///
    /// # Arguments
    /// * `app_name` - Application identifier for keychain service
    ///
    /// # Example
    /// ```
    /// let storage = KeychainStorage::new("tauri-anthropic-app");
    /// ```
    pub fn new(app_name: &str) -> Self {
        Self {
            service: format!("{}.api-key", app_name),
            username: "anthropic-api-key".to_string(),
        }
    }

    /// Save API key to system keychain
    ///
    /// # Arguments
    /// * `key` - The API key to securely store
    ///
    /// # Security
    /// - Key is encrypted by OS keychain
    /// - Never logged or exposed in plaintext
    /// - Uses platform-specific secure storage
    ///
    /// # Errors
    /// Returns error if keychain access fails
    pub fn save_api_key(&self, key: &str) -> Result<()> {
        // Validate API key format (basic sanity check)
        if key.is_empty() {
            return Err(anyhow::anyhow!("API key cannot be empty"));
        }

        if !key.starts_with("sk-ant-") {
            log::warn!("API key does not match expected Anthropic format");
        }

        let entry = Entry::new(&self.service, &self.username)
            .context("Failed to create keychain entry")?;

        entry
            .set_password(key)
            .context("Failed to save API key to keychain")?;

        log::info!("API key successfully saved to system keychain");
        Ok(())
    }

    /// Retrieve API key from system keychain
    ///
    /// # Returns
    /// The stored API key if it exists
    ///
    /// # Errors
    /// Returns error if key not found or keychain access fails
    pub fn get_api_key(&self) -> Result<String> {
        let entry = Entry::new(&self.service, &self.username)
            .context("Failed to create keychain entry")?;

        let password = entry
            .get_password()
            .context("Failed to retrieve API key from keychain. Key may not be stored.")?;

        // Don't log the actual key, just confirm retrieval
        log::debug!("API key successfully retrieved from keychain");
        Ok(password)
    }

    /// Delete API key from system keychain
    ///
    /// # Errors
    /// Returns error if deletion fails
    pub fn delete_api_key(&self) -> Result<()> {
        let entry = Entry::new(&self.service, &self.username)
            .context("Failed to create keychain entry")?;

        entry
            .delete_credential()
            .context("Failed to delete API key from keychain")?;

        log::info!("API key successfully deleted from system keychain");
        Ok(())
    }

    /// Check if an API key exists in the keychain
    ///
    /// # Returns
    /// `true` if a key is stored, `false` otherwise
    pub fn has_api_key(&self) -> bool {
        match self.get_api_key() {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// Validate that the stored API key is accessible and non-empty
    ///
    /// # Returns
    /// `true` if key exists and is valid format, `false` otherwise
    pub fn validate_api_key(&self) -> bool {
        match self.get_api_key() {
            Ok(key) => !key.is_empty() && key.len() > 10,
            Err(_) => false,
        }
    }

    /// Rotate API key - save new key and return old one for cleanup
    ///
    /// # Arguments
    /// * `new_key` - The new API key to store
    ///
    /// # Returns
    /// The old API key if it existed
    pub fn rotate_api_key(&self, new_key: &str) -> Result<Option<String>> {
        let old_key = self.get_api_key().ok();
        self.save_api_key(new_key)?;
        Ok(old_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keychain_storage_creation() {
        let storage = KeychainStorage::new("test-app");
        assert_eq!(storage.service, "test-app.api-key");
        assert_eq!(storage.username, "anthropic-api-key");
    }

    #[test]
    fn test_empty_key_validation() {
        let storage = KeychainStorage::new("test-app");
        let result = storage.save_api_key("");
        assert!(result.is_err());
    }

    // Note: Integration tests with actual keychain require platform-specific setup
    // and should be run with proper permissions
}
