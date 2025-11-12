# Security Guidelines for Tauri Anthropic App

## Overview

This document outlines security best practices for handling API keys and sensitive data in the Tauri Anthropic application.

## Threat Model

### Threats We Protect Against

1. **Local Storage Exposure**
   - Threat: Malicious scripts reading localStorage
   - Mitigation: Use system keychain, never localStorage

2. **Log File Leakage**
   - Threat: API keys in log files
   - Mitigation: Never log sensitive data, sanitize logs

3. **Network Interception**
   - Threat: Man-in-the-middle attacks
   - Mitigation: HTTPS only, certificate pinning

4. **Memory Dumps**
   - Threat: Keys visible in process memory
   - Mitigation: OS-level encryption, minimal key lifetime

5. **File System Access**
   - Threat: Malware reading config files
   - Mitigation: Keychain encryption, no plaintext storage

### Threats Outside Scope

- Physical access to unlocked computer
- Compromised operating system
- Quantum computing attacks (not yet practical)

## Security Architecture

### Layered Security Model

```
┌─────────────────────────────────────┐
│  Frontend (TypeScript/React)        │
│  - No direct API key access         │
│  - Input validation                 │
└─────────────┬───────────────────────┘
              │ Tauri IPC
┌─────────────▼───────────────────────┐
│  Tauri Backend (Rust)               │
│  - Keychain commands                │
│  - API client management            │
└─────────────┬───────────────────────┘
              │ Keyring Library
┌─────────────▼───────────────────────┐
│  System Keychain                    │
│  - OS-level encryption              │
│  - Hardware security (when available)│
└─────────────────────────────────────┘
```

## API Key Management

### Storage Requirements

#### ✅ REQUIRED: Production

```rust
// Production: Always use keychain
#[cfg(not(debug_assertions))]
fn get_api_key() -> Result<String> {
    let storage = KeychainStorage::new("tauri-anthropic-app");
    storage.get_api_key()
}
```

#### ⚠️ ALLOWED: Development Only

```rust
// Development: Environment variables OK
#[cfg(debug_assertions)]
fn get_api_key() -> Result<String> {
    std::env::var("ANTHROPIC_API_KEY")
        .or_else(|_| {
            let storage = KeychainStorage::new("tauri-anthropic-app");
            storage.get_api_key()
        })
}
```

#### ❌ FORBIDDEN: Never Do This

```rust
// NEVER hardcode keys
const API_KEY: &str = "sk-ant-...";  // ❌

// NEVER store in files
fs::write("key.txt", api_key)?;  // ❌

// NEVER log keys
log::info!("Key: {}", api_key);  // ❌

// NEVER send in GET params
let url = format!("/?key={}", api_key);  // ❌
```

### Key Lifecycle

1. **Acquisition**
   - User enters key in secure input field
   - Validated before storage
   - Immediately saved to keychain

2. **Storage**
   - Encrypted by OS keychain
   - Never written to disk in plaintext
   - Accessible only to app process

3. **Usage**
   - Retrieved only when needed
   - Held in memory briefly
   - Never exposed to frontend

4. **Rotation**
   - Old key retrieved and deleted
   - New key saved atomically
   - No intermediate plaintext state

5. **Deletion**
   - Securely wiped from keychain
   - No remnants in memory or disk

## Input Validation

### API Key Validation

```rust
fn validate_anthropic_key(key: &str) -> bool {
    // Check format
    if !key.starts_with("sk-ant-") {
        return false;
    }

    // Check length (reasonable bounds)
    if key.len() < 20 || key.len() > 200 {
        return false;
    }

    // Check characters (alphanumeric + dash + underscore)
    key.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}
```

### User Input Sanitization

```typescript
// Frontend validation
function sanitizeInput(input: string): string {
  // Remove control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}

// Length limits
const MAX_MESSAGE_LENGTH = 10000;

function validateMessage(message: string): boolean {
  return message.length > 0 && message.length <= MAX_MESSAGE_LENGTH;
}
```

## Network Security

### HTTPS Requirements

```json
// tauri.conf.json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; connect-src 'self' https://api.anthropic.com"
    }
  }
}
```

### API Client Configuration

```rust
use reqwest::Client;

fn create_secure_client() -> Result<Client> {
    Client::builder()
        .use_rustls_tls()  // Use Rust TLS (secure)
        .https_only(true)   // Reject HTTP
        .timeout(Duration::from_secs(30))
        .build()
}
```

## Logging Security

### Secure Logging Practices

```rust
use tracing::{info, warn, error};

// ✅ GOOD: Log operations, not data
info!("API key saved to keychain");
info!("Authenticating with Anthropic API");
info!("Message sent, tokens used: {}", tokens);

// ❌ BAD: Never log sensitive data
error!("Failed with key: {}", api_key);  // ❌ NEVER!
```

### Log Sanitization

```rust
fn sanitize_error(error: &str) -> String {
    // Remove potential API keys from error messages
    let re = Regex::new(r"sk-ant-[a-zA-Z0-9_-]+").unwrap();
    re.replace_all(error, "sk-ant-***").to_string()
}

// Usage
error!("API error: {}", sanitize_error(&err.to_string()));
```

## Memory Security

### Sensitive Data Handling

```rust
use zeroize::Zeroize;

struct SecureString {
    data: String,
}

impl Drop for SecureString {
    fn drop(&mut self) {
        // Zero memory on drop
        self.data.zeroize();
    }
}
```

### Minimize Key Lifetime

```rust
// ✅ GOOD: Retrieve key only when needed
async fn make_api_call() -> Result<Response> {
    let api_key = get_api_key()?;
    let response = send_request(&api_key).await?;
    drop(api_key);  // Explicitly drop as soon as possible
    Ok(response)
}

// ❌ BAD: Holding key in memory unnecessarily
struct App {
    api_key: String,  // ❌ Don't store long-term
}
```

## Frontend Security

### Content Security Policy

```html
<!-- Strict CSP in index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://api.anthropic.com;">
```

### Secure State Management

```typescript
// ❌ NEVER store API key in frontend state
const [apiKey, setApiKey] = useState<string>('');  // ❌

// ✅ ONLY store status flags
const [hasApiKey, setHasApiKey] = useState<boolean>(false);  // ✅
const [isInitialized, setIsInitialized] = useState<boolean>(false);  // ✅
```

### XSS Prevention

```typescript
// Sanitize user content before rendering
import DOMPurify from 'dompurify';

function renderMessage(content: string) {
  const sanitized = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

## Dependency Security

### Audit Dependencies

```bash
# Regular security audits
cargo audit
npm audit

# Update dependencies
cargo update
npm update
```

### Pin Critical Dependencies

```toml
# Cargo.toml - Pin security-critical crates
keyring = "=2.3.0"  # Exact version
```

## Build Security

### Release Configuration

```toml
# Cargo.toml
[profile.release]
panic = "abort"        # No unwinding
codegen-units = 1      # Better optimization
lto = true             # Link-time optimization
opt-level = "z"        # Size optimization
strip = true           # Remove debug symbols
```

### Code Signing

```bash
# macOS
codesign --force --sign "Developer ID Application" app.app

# Windows
signtool sign /f cert.pfx /p password app.exe
```

## Incident Response

### Suspected Key Compromise

1. **Immediate Actions**
   ```bash
   # Delete compromised key
   cargo run -- delete-api-key

   # Revoke at Anthropic
   # Visit: https://console.anthropic.com/settings/keys
   ```

2. **Generate New Key**
   - Create new key at Anthropic Console
   - Save to keychain immediately
   - Test with simple API call

3. **Audit Logs**
   - Check application logs for suspicious activity
   - Review Anthropic usage logs
   - Document timeline of events

### Vulnerability Disclosure

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email: security@agentic-flow.io (if available)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Compliance

### Data Handling

- **API Keys**: Treated as secrets, never logged or transmitted insecurely
- **User Messages**: Sent only to Anthropic API, not stored locally
- **Responses**: Displayed to user, not persisted by default

### Privacy

- No telemetry collection
- No user tracking
- API usage visible only to user via Anthropic dashboard

## Security Checklist

Before deploying:

- [ ] API keys stored in system keychain only
- [ ] No hardcoded secrets in codebase
- [ ] All API calls use HTTPS
- [ ] CSP properly configured
- [ ] Dependencies audited
- [ ] Logging sanitized (no sensitive data)
- [ ] Release build optimized and stripped
- [ ] Code signing enabled
- [ ] Error messages don't leak secrets
- [ ] Input validation implemented
- [ ] Frontend sanitizes user content

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [Tauri Security](https://tauri.app/v1/guides/security/)
- [Anthropic API Security](https://docs.anthropic.com/claude/docs/api-security)
- [Rust Security Guidelines](https://anssi-fr.github.io/rust-guide/)

## Security Contacts

- Report vulnerabilities: security@agentic-flow.io
- Security questions: support@agentic-flow.io
- GitHub Security Advisories: https://github.com/ruvnet/agentic-flow/security
