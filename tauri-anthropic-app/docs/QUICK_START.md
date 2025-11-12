# Quick Start Guide - Keychain Storage

Get started with secure API key storage in 5 minutes.

## Installation

### 1. Install System Dependencies

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install libsecret-1-dev libgtk-3-dev libwebkit2gtk-4.0-dev
```

#### Linux (Fedora)
```bash
sudo dnf install libsecret-devel gtk3-devel webkit2gtk3-devel
```

#### macOS
```bash
xcode-select --install
```

#### Windows
- Install Visual Studio 2019+ with C++ build tools

### 2. Add Dependencies

Already configured in `Cargo.toml`:
```toml
[dependencies]
keyring = { version = "2.3", features = ["apple-native", "windows-native", "linux-native"] }
anyhow = "1.0"
```

### 3. Build Project

```bash
cd tauri-anthropic-app/src-tauri
cargo build
```

## Basic Usage

### Rust Backend

```rust
use tauri_anthropic_app::keychain::KeychainStorage;

// Create storage
let storage = KeychainStorage::new("tauri-anthropic-app");

// Save API key
storage.save_api_key("sk-ant-api03-...")?;

// Check if key exists
if storage.has_api_key() {
    println!("✓ API key configured");
}

// Retrieve key
let api_key = storage.get_api_key()?;

// Delete key
storage.delete_api_key()?;
```

### Frontend (TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Save API key
await invoke('save_api_key', { apiKey: 'sk-ant-api03-...' });

// Check if key exists
const hasKey = await invoke<boolean>('has_api_key');
console.log('Has key:', hasKey);

// Retrieve key
const apiKey = await invoke<string>('get_api_key');

// Initialize client from keychain
await invoke('init_with_keychain');

// Delete key
await invoke('delete_api_key');
```

### React Component

```tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function ApiKeySetup() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    const exists = await invoke<boolean>('has_api_key');
    setHasKey(exists);
  };

  const saveKey = async () => {
    try {
      await invoke('save_api_key', { apiKey });
      setApiKey('');
      setHasKey(true);
      alert('Key saved securely!');
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  if (hasKey) {
    return <div>✓ API key is configured</div>;
  }

  return (
    <div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter API key"
      />
      <button onClick={saveKey}>Save</button>
    </div>
  );
}
```

## Testing

### Run Unit Tests

```bash
cd src-tauri
cargo test --lib keychain
```

### Manual Test

```rust
#[test]
fn test_keychain_workflow() {
    let storage = KeychainStorage::new("test-app");

    // Save
    storage.save_api_key("sk-ant-test").unwrap();

    // Verify
    assert!(storage.has_api_key());

    // Retrieve
    let key = storage.get_api_key().unwrap();
    assert_eq!(key, "sk-ant-test");

    // Clean up
    storage.delete_api_key().unwrap();
}
```

## Common Tasks

### Check if Key Exists

```rust
if storage.has_api_key() {
    // Key is configured
} else {
    // Prompt user to configure
}
```

### Validate Key Format

```rust
if storage.validate_api_key() {
    // Key exists and is valid
} else {
    // Invalid or missing
}
```

### Rotate Key

```rust
let old_key = storage.rotate_api_key("sk-ant-new-key")?;
println!("Rotated from: {:?}", old_key);
```

### Initialize Client from Keychain

```typescript
// Frontend
await invoke('init_with_keychain');

// Now client is ready to use
const response = await invoke('send_text', {
  text: 'Hello, Claude!',
});
```

## Security Tips

### ✅ DO

- Use keychain for production
- Validate key format before saving
- Handle errors gracefully
- Log operations, not keys

### ❌ DON'T

- Never use localStorage for keys
- Never log API keys
- Never hardcode keys
- Never commit .env with real keys

## Example App Flow

```typescript
// 1. Check if key exists
const hasKey = await invoke<boolean>('has_api_key');

if (!hasKey) {
  // 2. Prompt user for key
  const userKey = prompt('Enter API key:');

  // 3. Save to keychain
  await invoke('save_api_key', { apiKey: userKey });
}

// 4. Initialize client from keychain
await invoke('init_with_keychain');

// 5. Use client
const response = await invoke('send_text', {
  text: 'Hello!',
});

console.log('Response:', response);
```

## Next Steps

- Read [KEYCHAIN_USAGE.md](./KEYCHAIN_USAGE.md) for detailed API reference
- Review [SECURITY.md](./SECURITY.md) for security best practices
- Check [frontend-integration.ts](../examples/frontend-integration.ts) for complete examples
- See [keychain README](../src-tauri/src/keychain/README.md) for implementation details

## Troubleshooting

### "Failed to access keychain"

- **macOS**: Unlock Keychain Access
- **Linux**: Install `libsecret-1-dev`
- **Windows**: Enable Credential Manager

### "API key not found"

```rust
// Check and save if missing
if !storage.has_api_key() {
    storage.save_api_key(key)?;
}
```

### Build errors

```bash
# Linux: Install dependencies
sudo apt-get install libsecret-1-dev

# macOS: Install Xcode tools
xcode-select --install
```

## Help & Support

- Documentation: `/docs` directory
- Examples: `/examples` directory
- Tests: `/src-tauri/tests` directory
- Issues: [GitHub Issues](https://github.com/ruvnet/agentic-flow/issues)
