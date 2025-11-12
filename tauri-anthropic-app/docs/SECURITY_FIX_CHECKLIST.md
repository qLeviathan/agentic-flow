# Security Fix Implementation Checklist

This document provides step-by-step instructions to implement all security fixes identified in the security audit.

## Phase 1: Critical Fixes (Do First)

### 1. Implement Secure API Key Handling

- [ ] Add dependencies to `Cargo.toml`:
  ```toml
  secrecy = "0.8"
  zeroize = "1.7"
  ```

- [ ] Update `AnthropicClient` to use `SecretString`
  - [ ] Replace `String` with `SecretString` for `api_key` field
  - [ ] Implement custom `Debug` trait that redacts the key
  - [ ] Use `Zeroizing` wrapper when passing key to HTTP headers

- [ ] Update keychain storage validation
  - [ ] Add regex validation for API key format
  - [ ] Reject keys with control characters
  - [ ] Add logging (without exposing the key)

- [ ] Fix environment variable handling
  - [ ] Clear API key from environment after reading
  - [ ] Add warning messages in dev mode
  - [ ] Ensure production builds never use env vars

**Files to modify:**
- `src-tauri/src/anthropic/client.rs`
- `src-tauri/src/keychain/storage.rs`
- `src-tauri/src/main.rs`

### 2. Configure Tauri Security

- [ ] Copy secure `tauri.conf.json` from `/docs/security-configs/`
  ```bash
  cp docs/security-configs/tauri.conf.json src-tauri/tauri.conf.json
  ```

- [ ] Review and customize CSP settings
  - [ ] Verify `connect-src` only includes Anthropic API
  - [ ] Ensure `frame-src` is set to `'none'`
  - [ ] Confirm `script-src` includes `'wasm-unsafe-eval'` for WASM

- [ ] Review allowlist configuration
  - [ ] Confirm `fs.all` is `false`
  - [ ] Confirm `shell.all` is `false`
  - [ ] Verify HTTP scope is restricted to Anthropic API

- [ ] Set `fileDropEnabled: false` in windows config

**Files to modify:**
- `src-tauri/tauri.conf.json`

### 3. Add Input Validation to IPC Commands

- [ ] Create validation module `src-tauri/src/validation.rs`
  - [ ] Implement `validate_api_key()`
  - [ ] Implement `validate_message()`
  - [ ] Implement `validate_url()`
  - [ ] Implement `sanitize_input()`

- [ ] Add rate limiter
  - [ ] Create `RateLimiter` struct
  - [ ] Add to `AppState`
  - [ ] Implement rate limit checking

- [ ] Update `send_chat_message` command
  - [ ] Add rate limiting check
  - [ ] Add message length validation (max 10,000 chars)
  - [ ] Add content sanitization
  - [ ] Add timeout (30 seconds)
  - [ ] Validate model name against allowlist

- [ ] Update `save_api_key` command
  - [ ] Add format validation
  - [ ] Add length validation
  - [ ] Sanitize error messages

**Files to create/modify:**
- `src-tauri/src/validation.rs` (create)
- `src-tauri/src/commands/chat.rs` (modify)

### 4. Implement Proper Error Handling

- [ ] Add `thiserror` dependency
  ```toml
  thiserror = "1.0"
  ```

- [ ] Create error types in `src-tauri/src/error.rs`
  - [ ] Define `AppError` enum
  - [ ] Implement safe `Display` that never exposes secrets
  - [ ] Implement `From` conversions for external errors

- [ ] Update all functions to use `AppError`
  - [ ] Replace generic error strings
  - [ ] Ensure errors don't leak API keys or internal details

**Files to create/modify:**
- `src-tauri/src/error.rs` (create)
- All `src-tauri/src/**/*.rs` (modify)

### 5. Add Security Logging

- [ ] Add logging dependencies
  ```toml
  log = "0.4"
  env_logger = "0.11"
  ```

- [ ] Initialize logger in `main.rs`
  - [ ] Set appropriate log level (Info for production)
  - [ ] Implement log message filtering to redact secrets
  - [ ] Add structured logging for security events

- [ ] Add security event logging
  - [ ] Log API key access (without the key)
  - [ ] Log authentication failures
  - [ ] Log rate limit violations
  - [ ] Log validation failures

**Files to modify:**
- `src-tauri/src/main.rs`
- `src-tauri/src/commands/chat.rs`
- `src-tauri/src/keychain/storage.rs`

## Phase 2: High Priority Fixes

### 6. Set Up Dependency Scanning

- [ ] Copy `deny.toml` to project root
  ```bash
  cp docs/security-configs/deny.toml src-tauri/deny.toml
  ```

- [ ] Install cargo-audit and cargo-deny
  ```bash
  cargo install cargo-audit cargo-deny
  ```

- [ ] Copy audit configuration
  ```bash
  mkdir -p src-tauri/.cargo
  cp docs/security-configs/audit.toml src-tauri/.cargo/audit.toml
  ```

- [ ] Run initial scans
  ```bash
  cd src-tauri
  cargo audit
  cargo deny check
  ```

- [ ] Fix any vulnerabilities found

**Files to create:**
- `src-tauri/deny.toml`
- `src-tauri/.cargo/audit.toml`

### 7. Update Cargo.toml with Security Settings

- [ ] Replace `src-tauri/Cargo.toml` with secure version
  ```bash
  cp docs/security-configs/Cargo.toml src-tauri/Cargo.toml
  ```

- [ ] Review and customize dependencies
  - [ ] Ensure all versions are pinned (no wildcards)
  - [ ] Add security-focused dependencies
  - [ ] Configure release profile for security

- [ ] Add linting rules
  - [ ] Forbid unsafe code
  - [ ] Enable Clippy warnings

**Files to modify:**
- `src-tauri/Cargo.toml`

### 8. Implement WASM Security

- [ ] Add memory limits to WASM modules
  - [ ] Define maximum memory size (100MB)
  - [ ] Validate input size before processing
  - [ ] Check UTF-8 validity

- [ ] Add error handling to WASM calls
  - [ ] Wrap all WASM operations in try-catch
  - [ ] Sanitize error messages
  - [ ] Log WASM errors securely

**Files to modify:**
- `crates/reasoningbank-wasm/src/lib.rs`
- `src/wasm/reasoningbank.ts`

### 9. Add Security Tests

- [ ] Copy security test suite
  ```bash
  cp docs/security-configs/security-tests.rs src-tauri/tests/security_tests.rs
  ```

- [ ] Implement test helpers
  - [ ] Mock API client for testing
  - [ ] Test data generators

- [ ] Run tests
  ```bash
  cd src-tauri
  cargo test
  ```

- [ ] Ensure all tests pass

**Files to create:**
- `src-tauri/tests/security_tests.rs`

### 10. Set Up CI/CD Security Scanning

- [ ] Create GitHub Actions workflow
  ```bash
  mkdir -p .github/workflows
  cp docs/security-configs/github-security.yml .github/workflows/security.yml
  ```

- [ ] Configure branch protection
  - [ ] Require security checks to pass
  - [ ] Require code review
  - [ ] Prevent force push

- [ ] Set up security alerts
  - [ ] Enable Dependabot
  - [ ] Enable secret scanning
  - [ ] Enable CodeQL

**Files to create:**
- `.github/workflows/security.yml`

## Phase 3: Medium Priority Improvements

### 11. Add Request Timeouts

- [ ] Add timeout to all async operations
- [ ] Configure appropriate timeout values (30s for API calls)
- [ ] Handle timeout errors gracefully

### 12. Implement Key Rotation

- [ ] Add key expiration tracking
- [ ] Implement key rotation UI
- [ ] Add migration path for old keys

### 13. Add Audit Logging

- [ ] Implement structured audit logs
- [ ] Log all security-relevant events
- [ ] Add log rotation and retention

### 14. Security Documentation

- [ ] Document security architecture
- [ ] Create incident response plan
- [ ] Write security best practices guide
- [ ] Document vulnerability disclosure process

### 15. Penetration Testing

- [ ] Set up testing environment
- [ ] Conduct security testing
- [ ] Document findings
- [ ] Implement fixes

## Verification Steps

After implementing all fixes:

- [ ] Run all security tests: `cargo test`
- [ ] Run cargo audit: `cargo audit`
- [ ] Run cargo deny: `cargo deny check`
- [ ] Run npm audit: `npm audit`
- [ ] Run Clippy: `cargo clippy`
- [ ] Build release version: `cargo tauri build`
- [ ] Manual security testing
- [ ] Code review by security expert

## Sign-Off

- [ ] Security lead approval
- [ ] Development lead approval
- [ ] Final security audit completed
- [ ] Documentation updated
- [ ] Ready for production deployment

---

**Next Review Date:** [Set date 90 days from completion]

**Security Contact:** [Add contact information]
