# Tauri Anthropic App - Secure API Key Storage

A secure Tauri application with cross-platform keychain storage for Anthropic API keys.

## Features

- Secure API key storage using system keychain
- Cross-platform support (macOS, Windows, Linux)
- Hardware-encrypted storage (when available)
- Complete TypeScript/React integration
- Comprehensive security measures

## Platform Support

| Platform | Storage Backend | Encryption |
|----------|----------------|------------|
| macOS | Keychain Access | Hardware (Secure Enclave) |
| Windows | Credential Manager | DPAPI |
| Linux | Secret Service API | Master Password |

## Quick Start

### Installation

```bash
# Linux (Ubuntu/Debian)
sudo apt-get install libsecret-1-dev libgtk-3-dev libwebkit2gtk-4.0-dev

# macOS
xcode-select --install

# Build
cd src-tauri
cargo build
```

### Usage

#### Rust Backend
```rust
use keychain::KeychainStorage;

let storage = KeychainStorage::new("tauri-anthropic-app");
storage.save_api_key("sk-ant-...")?;
let key = storage.get_api_key()?;
```

#### TypeScript Frontend
```typescript
import { invoke } from '@tauri-apps/api/tauri';

await invoke('save_api_key', { apiKey: 'sk-ant-...' });
const key = await invoke<string>('get_api_key');
```

## Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Complete Usage Guide](docs/KEYCHAIN_USAGE.md)
- [Security Guidelines](docs/SECURITY.md)
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)
- [API Reference](src-tauri/src/keychain/README.md)

## Security

- Never stores keys in localStorage or plaintext files
- OS-level encryption for all stored keys
- No logging of sensitive data
- HTTPS-only API communication
- Comprehensive input validation

See [SECURITY.md](docs/SECURITY.md) for complete security documentation.

## Project Structure

```
tauri-anthropic-app/
├── src-tauri/
│   ├── src/
│   │   ├── keychain/
│   │   │   ├── storage.rs    # Core keychain implementation
│   │   │   ├── mod.rs        # Module exports
│   │   │   └── README.md     # API documentation
│   │   ├── lib.rs            # Tauri commands integration
│   │   ├── main.rs           # Application entry point
│   │   └── commands.rs       # Anthropic API commands
│   ├── tests/
│   │   └── unit/
│   │       └── keychain_test.rs
│   └── Cargo.toml
├── docs/
│   ├── QUICK_START.md
│   ├── KEYCHAIN_USAGE.md
│   ├── SECURITY.md
│   └── IMPLEMENTATION_SUMMARY.md
├── examples/
│   └── frontend-integration.ts
└── README.md
```

## API Reference

### KeychainStorage

```rust
pub struct KeychainStorage {
    service: String,
    username: String,
}

impl KeychainStorage {
    pub fn new(app_name: &str) -> Self
    pub fn save_api_key(&self, key: &str) -> Result<()>
    pub fn get_api_key(&self) -> Result<String>
    pub fn delete_api_key(&self) -> Result<()>
    pub fn has_api_key(&self) -> bool
    pub fn validate_api_key(&self) -> bool
    pub fn rotate_api_key(&self, new_key: &str) -> Result<Option<String>>
}
```

### Tauri Commands

- `save_api_key(api_key: String) -> Result<String, String>`
- `get_api_key() -> Result<String, String>`
- `delete_api_key() -> Result<String, String>`
- `has_api_key() -> Result<bool, String>`
- `validate_api_key() -> Result<bool, String>`
- `init_with_keychain() -> Result<InitResponse, String>`

## Dependencies

```toml
keyring = { version = "2.3", features = ["apple-native", "windows-native", "linux-native"] }
anyhow = "1.0"
tauri = "1.6"
serde = { version = "1.0", features = ["derive"] }
```

## Testing

```bash
cd src-tauri

# Run unit tests
cargo test --lib keychain

# Run all tests
cargo test
```

## Building

```bash
# Development
cargo build

# Release
cargo build --release

# Tauri app
npm run tauri build
```

## Troubleshooting

### Linux: libsecret not found
```bash
sudo apt-get install libsecret-1-dev
```

### macOS: Permission denied
Open Keychain Access and grant permissions when prompted.

### Windows: Credential not found
Check Credential Manager in Control Panel.

## Contributing

1. Follow security best practices in [SECURITY.md](docs/SECURITY.md)
2. Add tests for new features
3. Update documentation
4. Run `cargo fmt` and `cargo clippy`

## License

MIT License - see LICENSE file for details

## Security Contacts

- Report vulnerabilities: security@agentic-flow.io
- Security questions: support@agentic-flow.io

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Tauri Documentation](https://tauri.app/)
- [keyring-rs Documentation](https://docs.rs/keyring/)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
