# Tauri Anthropic App - Rust Backend

Complete Rust backend implementation for Anthropic Claude API integration in Tauri.

## Architecture

```
src-tauri/
├── src/
│   ├── anthropic/          # Anthropic API client module
│   │   ├── client.rs       # HTTP client implementation
│   │   ├── types.rs        # API request/response types
│   │   ├── error.rs        # Error handling
│   │   └── mod.rs          # Module exports
│   ├── keychain/           # Secure API key storage
│   │   ├── storage.rs      # Keychain operations
│   │   └── mod.rs          # Module exports
│   ├── commands.rs         # Tauri commands
│   ├── lib.rs              # Library entry point
│   └── main.rs             # Application entry point
├── Cargo.toml              # Dependencies
└── tauri.conf.json         # Tauri configuration
```

## Features

### Anthropic API Client (`src/anthropic/`)

#### Types (`types.rs`)
- **Message**: User/Assistant messages with content blocks
- **MessageRequest**: API request configuration
- **MessageResponse**: API response with usage metrics
- **StreamEvent**: Server-Sent Events for streaming
- **ContentBlock**: Text and image content support

#### Client (`client.rs`)
- **AnthropicClient**: Main API client
  - `send_message()`: Send message and get complete response
  - `stream_message()`: Stream response with SSE
  - `send_text()`: Convenience method for simple text
  - `send_with_system()`: Send with system prompt
  - Automatic retry logic with exponential backoff
  - Rate limit handling
  - Request timeout (120s)

#### Error Handling (`error.rs`)
- **AnthropicError**: Comprehensive error types
  - `RequestFailed`: HTTP request errors
  - `ApiError`: API-specific errors
  - `InvalidApiKey`: Authentication failures
  - `RateLimitExceeded`: Rate limiting
  - `StreamError`: Streaming issues
  - Retryable error detection
  - Automatic retry delay calculation

### Tauri Commands (`src/commands.rs`)

#### API Key Management (via Keychain)
```rust
// Save API key securely
save_api_key(api_key: String) -> Result<String, String>

// Retrieve API key
get_api_key() -> Result<String, String>

// Delete API key
delete_api_key() -> Result<String, String>

// Check if key exists
has_api_key() -> Result<bool, String>

// Validate key format
validate_api_key() -> Result<bool, String>
```

#### Anthropic Client Commands
```rust
// Initialize client with API key
init_client(request: InitRequest) -> Result<InitResponse, String>

// Initialize using keychain
init_with_keychain() -> Result<InitResponse, String>

// Send message to Claude
send_message(request: SendMessageRequest) -> Result<SendMessageResponse, String>

// Send simple text message
send_text(text: String, system: Option<String>) -> Result<SendMessageResponse, String>

// Check if client is initialized
is_initialized() -> Result<bool, String>
```

## API Configuration

### Default Settings
```rust
Model: claude-3-5-sonnet-20241022
API Endpoint: https://api.anthropic.com/v1/messages
API Version: 2023-06-01
Max Tokens: 1024 (configurable)
Timeout: 120 seconds
Max Retries: 3
```

### Required Headers
```
Content-Type: application/json
x-api-key: <your-api-key>
anthropic-version: 2023-06-01
```

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
import { invoke } from '@tauri-apps/api/tauri';

// 1. Save API key to keychain
await invoke('save_api_key', { apiKey: 'sk-ant-...' });

// 2. Initialize client
await invoke('init_client', {
  request: { api_key: 'sk-ant-...' }
});

// 3. Send a message
const response = await invoke('send_message', {
  request: {
    messages: [
      { role: 'user', content: 'Hello, Claude!' }
    ],
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.7,
    system: 'You are a helpful assistant'
  }
});

console.log(response.message); // Claude's response
console.log(response.usage);   // Token usage

// 4. Simple text message
const textResponse = await invoke('send_text', {
  text: 'What is Rust?',
  system: 'You are a programming expert'
});

// 5. Check if client is ready
const isReady = await invoke('is_initialized');
```

### Rust Backend Usage

```rust
use anthropic::{AnthropicClient, Message, MessageRequest};

// Create client
let client = AnthropicClient::new("sk-ant-...")?;

// Send message
let message = Message::user("Hello!");
let request = MessageRequest::new(vec![message])
    .model("claude-3-5-sonnet-20241022")
    .max_tokens(1024)
    .temperature(0.7)
    .system("You are helpful");

let response = client.send_message(request).await?;
println!("Response: {}", response.text());
println!("Tokens: {} input, {} output",
    response.usage.input_tokens,
    response.usage.output_tokens);

// Stream response
let mut stream = client.stream_message(request).await?;
while let Some(event) = stream.next().await {
    match event? {
        StreamEvent::ContentBlockDelta { delta, .. } => {
            if let ContentDelta::TextDelta { text } = delta {
                print!("{}", text);
            }
        }
        StreamEvent::MessageStop => break,
        _ => {}
    }
}
```

## Security Features

### Keychain Storage
- **macOS**: Keychain Access
- **Windows**: Credential Manager
- **Linux**: Secret Service API (libsecret)
- OS-level encryption
- Never logs API keys
- Secure retrieval only when needed

### Best Practices
1. Never hardcode API keys in source code
2. Use keychain for production storage
3. Environment variables only for development
4. Always use HTTPS for API calls
5. Implement request timeouts
6. Handle rate limiting gracefully
7. Log errors, never keys

## Error Handling

### Client Errors
```rust
match client.send_message(request).await {
    Ok(response) => {
        // Handle successful response
    }
    Err(AnthropicError::InvalidApiKey) => {
        // Invalid or missing API key
    }
    Err(AnthropicError::RateLimitExceeded) => {
        // Wait and retry
    }
    Err(AnthropicError::RequestFailed(e)) => {
        // Network or HTTP error
    }
    Err(e) => {
        // Other errors
    }
}
```

### Automatic Retry Logic
- **Rate Limit**: 60 second delay
- **Network Error**: 1 second delay
- **Stream Error**: 2 second delay
- Maximum 3 retries before failing

## Dependencies

```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "stream"] }
anyhow = "1.0"
thiserror = "1.0"
futures = "0.3"
async-stream = "0.3"
eventsource-stream = "0.2"
tokio-stream = "0.1"
tracing = "0.1"
tracing-subscriber = "0.3"
keyring = "2.0"
log = "0.4"
env_logger = "0.11"
```

## Build and Run

```bash
# Build
cargo build --release

# Run tests
cargo test

# Run application
cargo tauri dev

# Build for production
cargo tauri build
```

## Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Test specific module
cargo test anthropic::client

# Run integration tests
cargo test --test integration
```

## Performance

- **Async/Await**: Non-blocking I/O
- **Connection Pooling**: Reusable HTTP connections
- **Streaming**: Memory-efficient response handling
- **Retry Logic**: Automatic error recovery
- **Timeout Management**: Prevents hanging requests

## API Models

### Available Models
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### Model Capabilities
- Text generation
- Code generation
- Analysis and reasoning
- Multi-turn conversations
- System prompts
- Vision (image input)

## Rate Limits

Anthropic API rate limits vary by tier:
- **Free Tier**: Limited requests per minute
- **Paid Tiers**: Higher limits with burst capacity

The client automatically handles rate limiting with:
- 429 status code detection
- 60-second retry delay
- Automatic request queuing

## Logging

```rust
// Initialize logger
env_logger::Builder::from_env(
    env_logger::Env::default().default_filter_or("info")
).init();

// Log levels
log::debug!("Detailed debug information");
log::info!("General information");
log::warn!("Warning messages");
log::error!("Error messages");
```

## Troubleshooting

### Common Issues

1. **Invalid API Key**
   - Verify key starts with `sk-ant-`
   - Check keychain storage
   - Re-save key if needed

2. **Rate Limit Exceeded**
   - Wait 60 seconds
   - Implement request queuing
   - Upgrade API tier

3. **Connection Timeout**
   - Check network connectivity
   - Verify firewall settings
   - Increase timeout if needed

4. **Streaming Errors**
   - Ensure stable connection
   - Handle partial responses
   - Implement reconnection logic

## License

See project LICENSE file.

## Support

For issues and questions:
- Anthropic API Docs: https://docs.anthropic.com
- Tauri Docs: https://tauri.app
- Project Issues: [Your GitHub Issues]
