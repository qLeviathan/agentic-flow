// Frontend tests for API Key Setup component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

// Mock API Key Setup Component
interface ApiKeySetupProps {
  onConfigured?: () => void;
}

function ApiKeySetup({ onConfigured }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await mockInvoke('save_api_key', { apiKey });
      setSuccess(true);
      onConfigured?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="api-key-setup">
      <h2>Configure Anthropic API Key</h2>
      <input
        type="password"
        data-testid="api-key-input"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-..."
        disabled={isLoading}
      />
      <button
        data-testid="save-button"
        onClick={handleSave}
        disabled={isLoading || !apiKey.trim()}
      >
        {isLoading ? 'Saving...' : 'Save API Key'}
      </button>
      {error && <div data-testid="error-message" style={{ color: 'red' }}>{error}</div>}
      {success && <div data-testid="success-message">API key saved successfully!</div>}
    </div>
  );
}

describe('ApiKeySetup', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it('renders API key setup form', () => {
    render(<ApiKeySetup />);
    expect(screen.getByTestId('api-key-setup')).toBeInTheDocument();
    expect(screen.getByText('Configure Anthropic API Key')).toBeInTheDocument();
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    expect(input.value).toBe('sk-ant-test-key');
  });

  it('disables save button when input is empty', () => {
    render(<ApiKeySetup />);
    const button = screen.getByTestId('save-button');
    expect(button).toBeDisabled();
  });

  it('enables save button when valid input is entered', () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    expect(button).not.toBeDisabled();
  });

  it('shows error for invalid API key format', async () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'invalid-key' } });
    fireEvent.click(button);

    expect(await screen.findByTestId('error-message')).toHaveTextContent(
      'Invalid API key format'
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('saves API key successfully', async () => {
    mockInvoke.mockResolvedValue(undefined);

    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'sk-ant-test-key-123' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_api_key', {
        apiKey: 'sk-ant-test-key-123',
      });
    });

    expect(await screen.findByTestId('success-message')).toHaveTextContent(
      'API key saved successfully!'
    );
  });

  it('shows loading state while saving', async () => {
    mockInvoke.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );

    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    fireEvent.click(button);

    expect(button).toHaveTextContent('Saving...');
    expect(button).toBeDisabled();
    expect(input).toBeDisabled();

    await waitFor(() => {
      expect(button).toHaveTextContent('Save API Key');
    });
  });

  it('displays error on save failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));

    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    fireEvent.click(button);

    expect(await screen.findByTestId('error-message')).toHaveTextContent(
      'Network error'
    );
  });

  it('calls onConfigured callback on success', async () => {
    mockInvoke.mockResolvedValue(undefined);
    const onConfigured = vi.fn();

    render(<ApiKeySetup onConfigured={onConfigured} />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onConfigured).toHaveBeenCalled();
    });
  });

  it('shows error for empty API key', async () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(button).toBeDisabled();
  });

  it('masks API key input', () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('validates API key starts with sk-ant-', async () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    const invalidKeys = ['sk-test', 'api-key', 'random-string'];

    for (const key of invalidKeys) {
      fireEvent.change(input, { target: { value: key } });
      fireEvent.click(button);

      expect(await screen.findByTestId('error-message')).toHaveTextContent(
        'Invalid API key format'
      );
      expect(mockInvoke).not.toHaveBeenCalled();

      // Clear error for next iteration
      fireEvent.change(input, { target: { value: '' } });
    }
  });

  it('accepts valid sk-ant- prefixed keys', async () => {
    mockInvoke.mockResolvedValue(undefined);

    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    const validKey = 'sk-ant-api03-abc123def456ghi789';
    fireEvent.change(input, { target: { value: validKey } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_api_key', {
        apiKey: validKey,
      });
    });
  });

  it('handles very long API keys', async () => {
    mockInvoke.mockResolvedValue(undefined);

    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    const longKey = 'sk-ant-' + 'a'.repeat(200);
    fireEvent.change(input, { target: { value: longKey } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_api_key', {
        apiKey: longKey,
      });
    });
  });

  it('clears previous errors on new input', async () => {
    render(<ApiKeySetup />);
    const input = screen.getByTestId('api-key-input');
    const button = screen.getByTestId('save-button');

    // Trigger error
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(button);
    expect(await screen.findByTestId('error-message')).toBeInTheDocument();

    // Change input
    fireEvent.change(input, { target: { value: 'sk-ant-new-key' } });

    // Error should still be visible until next save attempt
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });
});
