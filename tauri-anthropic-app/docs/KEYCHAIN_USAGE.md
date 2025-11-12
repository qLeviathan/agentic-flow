# Keychain Storage Usage Guide

## Overview

The Tauri Anthropic App uses secure, cross-platform keychain storage for API keys. This ensures credentials are encrypted by the operating system and never stored in plaintext.

## Platform Support

### macOS
- **Storage**: Keychain Access
- **Location**: User's login keychain
- **Security**: Hardware-encrypted on devices with Secure Enclave
- **Access**: Via Security Framework

### Windows
- **Storage**: Credential Manager
- **Location**: Windows Credential Store
- **Security**: DPAPI (Data Protection API) encryption
- **Access**: Via Credential Manager API

### Linux
- **Storage**: Secret Service API (libsecret)
- **Location**: GNOME Keyring or KWallet
- **Security**: Master password encryption
- **Access**: Via D-Bus Secret Service interface

## Rust API Usage

### Basic Operations

```rust
use keychain::KeychainStorage;

// Initialize storage
let storage = KeychainStorage::new("tauri-anthropic-app");

// Save API key
storage.save_api_key("sk-ant-api03-...")?;

// Check if key exists
if storage.has_api_key() {
    println!("API key is configured");
}

// Retrieve key
let api_key = storage.get_api_key()?;

// Validate key format
if storage.validate_api_key() {
    println!("API key is valid");
}

// Delete key
storage.delete_api_key()?;
```

### Advanced Operations

```rust
// Rotate API key
let old_key = storage.rotate_api_key("sk-ant-new-key...")?;
if let Some(old) = old_key {
    println!("Rotated from old key");
}
```

## Frontend Integration (JavaScript/TypeScript)

### Tauri Commands

```javascript
import { invoke } from '@tauri-apps/api/tauri';

// Save API key
try {
  await invoke('save_api_key', { apiKey: 'sk-ant-api03-...' });
  console.log('API key saved successfully');
} catch (error) {
  console.error('Failed to save API key:', error);
}

// Check if key exists
const hasKey = await invoke('has_api_key');
if (hasKey) {
  console.log('API key is configured');
}

// Retrieve API key
try {
  const apiKey = await invoke('get_api_key');
  // Use apiKey for API calls
} catch (error) {
  console.error('API key not found:', error);
}

// Validate API key
const isValid = await invoke('validate_api_key');
if (!isValid) {
  console.warn('API key may be invalid');
}

// Delete API key
try {
  await invoke('delete_api_key');
  console.log('API key deleted');
} catch (error) {
  console.error('Failed to delete API key:', error);
}
```

### React Example

```typescript
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function ApiKeySettings() {
  const [hasKey, setHasKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const exists = await invoke<boolean>('has_api_key');
    setHasKey(exists);
  };

  const saveKey = async () => {
    setLoading(true);
    try {
      await invoke('save_api_key', { apiKey });
      setHasKey(true);
      setApiKey(''); // Clear input
      alert('API key saved securely!');
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async () => {
    if (confirm('Delete API key from keychain?')) {
      try {
        await invoke('delete_api_key');
        setHasKey(false);
        alert('API key deleted');
      } catch (error) {
        alert(`Error: ${error}`);
      }
    }
  };

  return (
    <div>
      <h2>API Key Settings</h2>
      {hasKey ? (
        <div>
          <p>✓ API key is configured</p>
          <button onClick={deleteKey}>Delete Key</button>
        </div>
      ) : (
        <div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Anthropic API key"
          />
          <button onClick={saveKey} disabled={loading}>
            {loading ? 'Saving...' : 'Save Key'}
          </button>
        </div>
      )}
    </div>
  );
}
```

## Security Best Practices

### ✅ DO

1. **Always use keychain storage for production**
   - Never store API keys in localStorage or cookies
   - Never commit API keys to version control

2. **Validate before storing**
   ```rust
   if api_key.starts_with("sk-ant-") {
       storage.save_api_key(&api_key)?;
   }
   ```

3. **Handle errors gracefully**
   ```rust
   match storage.get_api_key() {
       Ok(key) => use_api_key(key),
       Err(e) => show_setup_wizard(),
   }
   ```

4. **Use HTTPS only**
   - Configure CSP in tauri.conf.json
   - Only connect to official Anthropic API endpoints

5. **Log operations, not keys**
   ```rust
   log::info!("API key saved");  // ✅ Good
   log::info!("Key: {}", key);   // ❌ NEVER do this
   ```

### ❌ DON'T

1. **Never log API keys**
   - Don't include keys in debug output
   - Don't send keys to analytics
   - Don't display keys in error messages

2. **Never use localStorage for production**
   ```javascript
   // ❌ NEVER DO THIS
   localStorage.setItem('apiKey', key);

   // ✅ DO THIS INSTEAD
   await invoke('save_api_key', { apiKey: key });
   ```

3. **Never hardcode API keys**
   ```rust
   // ❌ NEVER DO THIS
   const API_KEY: &str = "sk-ant-...";
   ```

4. **Never commit .env files with real keys**
   - Use .env.example with dummy values
   - Add .env to .gitignore

## Environment Variables (Development Only)

For development, you can use environment variables:

```bash
# .env.local (NEVER commit this file)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

```rust
// Development fallback only
#[cfg(debug_assertions)]
fn get_api_key_dev() -> Option<String> {
    std::env::var("ANTHROPIC_API_KEY").ok()
}
```

**Production builds should ALWAYS use keychain storage.**

## Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_save_and_retrieve() {
        let storage = KeychainStorage::new("test-app");
        let test_key = "sk-ant-test-key";

        storage.save_api_key(test_key).unwrap();
        assert!(storage.has_api_key());

        let retrieved = storage.get_api_key().unwrap();
        assert_eq!(retrieved, test_key);

        storage.delete_api_key().unwrap();
        assert!(!storage.has_api_key());
    }
}
```

### Integration Tests

```bash
# Run tests (requires keychain access)
cd src-tauri
cargo test

# Run with logging
RUST_LOG=debug cargo test
```

## Troubleshooting

### Linux: libsecret not found

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-dev

# Fedora
sudo dnf install libsecret-devel

# Arch
sudo pacman -S libsecret
```

### macOS: Permission denied

- Open **Keychain Access.app**
- Right-click on your keychain
- Select **Change Settings for Keychain**
- Ensure app has access permissions

### Windows: Credential not found

- Open **Credential Manager**
- Check **Windows Credentials**
- Look for entries under "tauri-anthropic-app"

## Migration from localStorage

If you previously stored keys in localStorage:

```javascript
// Migrate old keys to keychain
async function migrateApiKey() {
  const oldKey = localStorage.getItem('anthropic_api_key');
  if (oldKey) {
    await invoke('save_api_key', { apiKey: oldKey });
    localStorage.removeItem('anthropic_api_key');
    console.log('Migrated API key to secure storage');
  }
}
```

## References

- [keyring-rs Documentation](https://docs.rs/keyring/)
- [Tauri Security Best Practices](https://tauri.app/v1/guides/security/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
