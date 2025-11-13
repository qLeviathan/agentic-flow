# Keychain Storage Module

## Overview

This module provides secure, cross-platform API key storage using system keychains. It ensures credentials are encrypted by the operating system and never stored in plaintext.

## Architecture

```
keychain/
├── mod.rs      - Module exports and initialization
└── storage.rs  - KeychainStorage implementation
```

## Platform Support

| Platform | Backend | Encryption |
|----------|---------|------------|
| macOS | Keychain Access | Hardware (Secure Enclave) |
| Windows | Credential Manager | DPAPI |
| Linux | Secret Service API | Master password |

## API Reference

### KeychainStorage

Main struct for interacting with system keychain.

```rust
pub struct KeychainStorage {
    service: String,    // App identifier
    username: String,   // Key identifier
}
```

### Methods

#### `new(app_name: &str) -> Self`

Create a new keychain storage instance.

```rust
let storage = KeychainStorage::new("tauri-anthropic-app");
```

#### `save_api_key(&self, key: &str) -> Result<()>`

Save API key to system keychain with OS-level encryption.

**Security:**
- Validates key format
- Never logs actual key
- Uses platform-specific secure storage

**Example:**
```rust
storage.save_api_key("sk-ant-api03-...")?;
```

#### `get_api_key(&self) -> Result<String>`

Retrieve API key from keychain.

**Returns:** Decrypted API key
**Errors:** Returns error if key not found

**Example:**
```rust
let key = storage.get_api_key()?;
```

#### `delete_api_key(&self) -> Result<()>`

Permanently delete API key from keychain.

**Example:**
```rust
storage.delete_api_key()?;
```

#### `has_api_key(&self) -> bool`

Check if API key exists without retrieving it.

**Example:**
```rust
if storage.has_api_key() {
    println!("Key is configured");
}
```

#### `validate_api_key(&self) -> bool`

Validate that stored key is accessible and properly formatted.

**Example:**
```rust
if !storage.validate_api_key() {
    eprintln!("Invalid or missing API key");
}
```

#### `rotate_api_key(&self, new_key: &str) -> Result<Option<String>>`

Atomically replace old key with new one.

**Returns:** Old key if it existed
**Example:**
```rust
let old_key = storage.rotate_api_key("sk-ant-new-key...")?;
```

## Security Principles

### ✅ DO

1. **Use keychain for production**
   ```rust
   #[cfg(not(debug_assertions))]
   fn get_api_key() -> Result<String> {
       let storage = KeychainStorage::new("app");
       storage.get_api_key()
   }
   ```

2. **Validate before storing**
   ```rust
   if key.starts_with("sk-ant-") && key.len() > 20 {
       storage.save_api_key(&key)?;
   }
   ```

3. **Handle errors gracefully**
   ```rust
   match storage.get_api_key() {
       Ok(key) => use_key(key),
       Err(_) => prompt_for_key(),
   }
   ```

4. **Log operations, not keys**
   ```rust
   log::info!("API key saved");     // ✅ Good
   log::info!("Key: {}", key);      // ❌ NEVER!
   ```

### ❌ DON'T

1. **Never log API keys**
   ```rust
   // ❌ DANGEROUS
   println!("API Key: {}", key);
   log::debug!("Using key: {}", key);
   ```

2. **Never store in files**
   ```rust
   // ❌ INSECURE
   std::fs::write("api_key.txt", key)?;
   ```

3. **Never hardcode keys**
   ```rust
   // ❌ NEVER DO THIS
   const API_KEY: &str = "sk-ant-...";
   ```

4. **Never send keys in GET requests**
   ```rust
   // ❌ Keys in URLs are logged
   let url = format!("https://api.com?key={}", key);
   ```

## Integration with Tauri

The keychain module integrates with Tauri commands in `lib.rs`:

```rust
#[tauri::command]
fn save_api_key(api_key: String, state: State<KeychainState>) -> Result<String, String> {
    let keychain = state.keychain.lock().unwrap();
    keychain.save_api_key(&api_key)?;
    Ok("Saved successfully".to_string())
}
```

Frontend can call these commands:

```javascript
await invoke('save_api_key', { apiKey: 'sk-ant-...' });
const key = await invoke('get_api_key');
```

## Testing

### Unit Tests

```bash
cargo test --package tauri-anthropic-app --lib keychain
```

### Integration Tests

```bash
# Requires keychain access permissions
cargo test --package tauri-anthropic-app --test keychain_integration
```

### Manual Testing

```bash
# Test save
cargo run -- save-key "sk-ant-test-key"

# Test retrieve
cargo run -- get-key

# Test delete
cargo run -- delete-key
```

## Platform-Specific Setup

### Linux Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-dev

# Fedora
sudo dnf install libsecret-devel

# Arch
sudo pacman -S libsecret
```

### macOS Permissions

Grant keychain access in System Preferences:
- Open **System Preferences** → **Security & Privacy**
- Allow app to access keychain when prompted

### Windows Configuration

No additional setup required. Uses Windows Credential Manager automatically.

## Troubleshooting

### Error: "Failed to access keychain"

**Cause:** Keychain is locked or permissions denied

**Solution:**
- macOS: Unlock keychain in Keychain Access.app
- Windows: Check Credential Manager permissions
- Linux: Verify Secret Service is running

### Error: "API key not found"

**Cause:** Key was never saved or was deleted

**Solution:**
```rust
if !storage.has_api_key() {
    storage.save_api_key(key)?;
}
```

### Error: "libsecret not found" (Linux)

**Cause:** Missing system library

**Solution:**
```bash
sudo apt-get install libsecret-1-dev
```

## Performance Considerations

- **Keychain access is I/O bound**: Cache keys in memory for repeated use
- **First access may prompt user**: Plan UX accordingly
- **Cross-platform differences**: Test on all target platforms

## Future Enhancements

- [ ] Support for multiple API keys (different services)
- [ ] Key rotation policies with expiration
- [ ] Audit logging of keychain access
- [ ] Biometric authentication integration
- [ ] Hardware security module (HSM) support

## References

- [keyring-rs Documentation](https://docs.rs/keyring/)
- [Tauri Security Guide](https://tauri.app/v1/guides/security/)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
