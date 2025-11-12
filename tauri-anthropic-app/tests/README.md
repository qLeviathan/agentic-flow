# Tauri Anthropic App - Test Suite

Comprehensive test suite for the Tauri Anthropic application with 80%+ coverage target.

## Test Structure

```
tests/
├── unit/                    # Rust unit tests
│   ├── anthropic_client_test.rs
│   └── keychain_test.rs
├── integration/             # Rust integration tests
│   ├── tauri_commands_test.rs
│   └── wasm_integration_test.rs
└── e2e/                     # End-to-end tests
    └── chat-flow.spec.ts

src/__tests__/               # Frontend unit tests
├── setup.ts
├── ChatInterface.test.tsx
└── ApiKeySetup.test.tsx
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Rust Tests
```bash
# Run all Rust tests
npm run test:rust

# Run specific test file
cd src-tauri && cargo test --test anthropic_client_test

# Run with output
cd src-tauri && cargo test -- --nocapture

# Run tests in parallel
cd src-tauri && cargo test -- --test-threads=4
```

### Frontend Tests (Vitest)
```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test file
npm test -- ChatInterface.test.tsx
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test chat-flow.spec.ts

# Debug mode
npx playwright test --debug
```

## Test Coverage

### Current Coverage Targets
- **Overall**: 80%+
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### View Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Test Categories

### 1. Rust Unit Tests

**Anthropic Client Tests** (`anthropic_client_test.rs`):
- Client creation and initialization
- Message sending with mocked HTTP responses
- Error handling (invalid API keys, network errors)
- Request/response serialization
- Multiple message conversations
- Token limit handling

**Keychain Tests** (`keychain_test.rs`):
- API key storage and retrieval
- Keychain creation and deletion
- Concurrent access handling
- Edge cases (empty keys, special characters, long keys)
- Multiple keychain instances

### 2. Rust Integration Tests

**Tauri Commands** (`tauri_commands_test.rs`):
- save_api_key command
- send_chat_message command
- check_api_key command
- get_api_key command
- delete_api_key command
- Full workflow integration
- Concurrent API calls
- State management

**WASM Integration** (`wasm_integration_test.rs`):
- ReasoningBank module integration
- AgentBooster module integration
- Context storage and retrieval
- Pattern storage and similarity search
- Response caching
- Memory-efficient operations
- Cross-module workflows

### 3. Frontend Unit Tests

**ChatInterface Tests** (`ChatInterface.test.tsx`):
- Component rendering
- Message input handling
- Send button states
- Loading states
- Error handling
- Response display
- Empty message validation
- Special characters handling
- Long message handling

**ApiKeySetup Tests** (`ApiKeySetup.test.tsx`):
- API key input and validation
- Save functionality
- Error display
- Success confirmation
- Loading states
- Format validation (sk-ant- prefix)
- Callback handling

### 4. E2E Tests

**Chat Flow** (`chat-flow.spec.ts`):
- Complete user workflows
- API key configuration flow
- Message sending and receiving
- Error scenarios
- Multi-message conversations
- Keyboard shortcuts
- Mobile responsiveness
- Performance benchmarks

**WASM Integration**:
- Module loading verification
- Memory operations
- Context storage

**Performance Tests**:
- Application load time (<3s)
- Message response time (<15s)

## Mock Data and Utilities

### Rust Mocks
- MockKeychainStorage: In-memory keychain simulation
- MockAnthropicClient: Simulated API responses
- MockReasoningBank: WASM module simulation
- MockAgentBooster: Performance optimization simulation

### Frontend Mocks
- Tauri API mocking via Vitest
- Component mocking for isolation
- LocalStorage mocking

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Rust tests
      - name: Run Rust tests
        run: cd src-tauri && cargo test

      # Frontend tests
      - name: Run frontend tests
        run: npm run test:coverage

      # E2E tests
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      # Upload coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Writing New Tests

### Rust Unit Test Template
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_feature_name() {
        // Arrange
        let input = setup_test_data();

        // Act
        let result = function_under_test(input);

        // Assert
        assert_eq!(result, expected_value);
    }

    #[tokio::test]
    async fn test_async_feature() {
        // Test async code
    }
}
```

### Frontend Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  it('should do something', () => {
    // Arrange
    render(<Component />);

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test('feature description', async ({ page }) => {
  // Navigate
  await page.goto('/');

  // Interact
  await page.click('[data-testid="button"]');

  // Assert
  await expect(page.locator('.result')).toBeVisible();
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Fast**: Unit tests should run quickly (<100ms)
3. **Reliable**: Tests should not be flaky
4. **Descriptive**: Use clear test names
5. **Arrange-Act-Assert**: Follow AAA pattern
6. **Mock External Dependencies**: Don't make real API calls
7. **Test Edge Cases**: Include boundary conditions
8. **Coverage**: Aim for 80%+ but focus on critical paths

## Troubleshooting

### Common Issues

**Rust tests failing:**
```bash
# Clean and rebuild
cd src-tauri
cargo clean
cargo test
```

**Frontend tests timing out:**
```bash
# Increase timeout in vitest.config.ts
test: {
  testTimeout: 10000
}
```

**E2E tests failing:**
```bash
# Update browsers
npx playwright install

# Run in headed mode to debug
npx playwright test --headed
```

**Coverage not meeting threshold:**
```bash
# Identify uncovered code
npm run test:coverage
open coverage/index.html
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Testing Library Documentation](https://testing-library.com/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
