// E2E tests for complete chat flow using Playwright
import { test, expect } from '@playwright/test';

test.describe('Chat Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display initial UI correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Anthropic Chat');
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('complete API key setup and chat flow', async ({ page }) => {
    // Step 1: Check if API key setup is required
    const setupForm = page.locator('[data-testid="api-key-setup"]');

    if (await setupForm.isVisible()) {
      // Enter API key
      await page.locator('[data-testid="api-key-input"]').fill('sk-ant-test-key-12345');
      await page.locator('[data-testid="save-button"]').click();

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Wait for chat interface to appear
      await page.waitForTimeout(500);
    }

    // Step 2: Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello, can you help me?');

    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // Step 3: Wait for response
    await expect(page.locator('[data-testid="response-message"]')).toBeVisible({ timeout: 10000 });

    // Verify response contains text
    const response = page.locator('[data-testid="response-message"]');
    await expect(response).not.toBeEmpty();
  });

  test('should validate empty messages', async ({ page }) => {
    const sendButton = page.locator('[data-testid="send-button"]');

    // Button should be disabled with empty input
    await expect(sendButton).toBeDisabled();

    // Type and delete message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test');
    await expect(sendButton).toBeEnabled();

    await messageInput.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('should show loading state while sending', async ({ page }) => {
    // Ensure API key is configured
    await page.evaluate(() => {
      localStorage.setItem('api_key_configured', 'true');
    });

    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Test message');
    await sendButton.click();

    // Check loading state
    await expect(sendButton).toContainText('Sending...');
    await expect(sendButton).toBeDisabled();
    await expect(messageInput).toBeDisabled();

    // Wait for completion
    await expect(sendButton).toContainText('Send', { timeout: 10000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error by removing API key
    await page.evaluate(() => {
      localStorage.removeItem('api_key');
    });

    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Test message');
    await sendButton.click();

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle multiple messages in sequence', async ({ page }) => {
    // Ensure API key is configured
    await page.evaluate(() => {
      localStorage.setItem('api_key_configured', 'true');
    });

    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Send first message
    await messageInput.fill('First message');
    await sendButton.click();
    await expect(page.locator('[data-testid="response-message"]').first()).toBeVisible({ timeout: 10000 });

    // Send second message
    await messageInput.fill('Second message');
    await sendButton.click();
    await expect(page.locator('[data-testid="response-message"]').last()).toBeVisible({ timeout: 10000 });

    // Verify both responses exist
    const responses = page.locator('[data-testid="response-message"]');
    await expect(responses).toHaveCount(2);
  });

  test('should clear input after sending', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Test message');
    await sendButton.click();

    // Wait for send to complete
    await page.waitForTimeout(1000);

    // Input should be cleared
    await expect(messageInput).toHaveValue('');
  });

  test('API key setup validates format', async ({ page }) => {
    const apiKeySetup = page.locator('[data-testid="api-key-setup"]');

    if (await apiKeySetup.isVisible()) {
      const input = page.locator('[data-testid="api-key-input"]');
      const saveButton = page.locator('[data-testid="save-button"]');

      // Try invalid format
      await input.fill('invalid-key-format');
      await saveButton.click();

      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');

      // Try valid format
      await input.fill('sk-ant-valid-key-12345');
      await saveButton.click();

      // Should succeed
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle long messages', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    const longMessage = 'This is a very long message. '.repeat(50);
    await messageInput.fill(longMessage);
    await sendButton.click();

    // Should handle without errors
    await expect(page.locator('[data-testid="response-message"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle special characters in messages', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    const specialMessage = 'Test with émojis 🎉🚀 and symbols !@#$%^&*()';
    await messageInput.fill(specialMessage);
    await sendButton.click();

    await expect(page.locator('[data-testid="response-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should persist API key across page reloads', async ({ page }) => {
    // Configure API key
    const apiKeySetup = page.locator('[data-testid="api-key-setup"]');

    if (await apiKeySetup.isVisible()) {
      await page.locator('[data-testid="api-key-input"]').fill('sk-ant-test-key-12345');
      await page.locator('[data-testid="save-button"]').click();
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }

    // Reload page
    await page.reload();

    // API key setup should not be shown again
    await expect(page.locator('[data-testid="api-key-setup"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');

    await messageInput.fill('Test message');

    // Press Enter to send (if implemented)
    await messageInput.press('Enter');

    // Should trigger send
    await expect(page.locator('[data-testid="send-button"]')).toContainText('Sending...');
  });

  test('responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check elements are still visible and functional
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();

    // Should be able to interact
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Mobile test');
    await expect(page.locator('[data-testid="send-button"]')).toBeEnabled();
  });
});

test.describe('WASM Integration E2E Tests', () => {
  test('WASM modules load correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for WASM to initialize
    await page.waitForTimeout(2000);

    // Check WASM is loaded via console or page state
    const wasmLoaded = await page.evaluate(() => {
      return typeof (window as any).reasoningBank !== 'undefined';
    });

    expect(wasmLoaded).toBeTruthy();
  });

  test('WASM memory operations work', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Test WASM context storage
    const result = await page.evaluate(() => {
      const bank = (window as any).reasoningBank;
      if (!bank) return false;

      try {
        bank.store_context('test-key', 'test-value');
        const retrieved = bank.get_context('test-key');
        return retrieved === 'test-value';
      } catch (e) {
        return false;
      }
    });

    expect(result).toBeTruthy();
  });
});

test.describe('Performance Tests', () => {
  test('application loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('message sending responds within acceptable time', async ({ page }) => {
    await page.goto('/');

    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Quick test');

    const startTime = Date.now();
    await sendButton.click();
    await expect(page.locator('[data-testid="response-message"]')).toBeVisible({ timeout: 15000 });
    const responseTime = Date.now() - startTime;

    // Should respond within 15 seconds
    expect(responseTime).toBeLessThan(15000);
  });
});
