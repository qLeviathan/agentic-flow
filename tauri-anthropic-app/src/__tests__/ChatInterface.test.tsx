// Frontend tests for Chat Interface component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

// Mock Chat Component
interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void;
}

function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [message, setMessage] = React.useState('');
  const [response, setResponse] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await mockInvoke('send_chat_message', { message });
      setResponse(result);
      onSendMessage?.(message);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="chat-interface">
      <textarea
        data-testid="message-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message..."
        disabled={isLoading}
      />
      <button
        data-testid="send-button"
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
      {response && <div data-testid="response-message">{response}</div>}
    </div>
  );
}

describe('ChatInterface', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it('renders chat interface', () => {
    render(<ChatInterface />);
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('updates message input on change', () => {
    render(<ChatInterface />);
    const input = screen.getByTestId('message-input') as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'Hello Claude' } });
    expect(input.value).toBe('Hello Claude');
  });

  it('disables send button when message is empty', () => {
    render(<ChatInterface />);
    const button = screen.getByTestId('send-button');
    expect(button).toBeDisabled();
  });

  it('enables send button when message is entered', () => {
    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(button).not.toBeDisabled();
  });

  it('sends message successfully', async () => {
    mockInvoke.mockResolvedValue('Mock response from Claude');

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send_chat_message', {
        message: 'Hello',
      });
    });

    expect(await screen.findByTestId('response-message')).toHaveTextContent(
      'Mock response from Claude'
    );
  });

  it('clears message input after sending', async () => {
    mockInvoke.mockResolvedValue('Response');

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('shows loading state while sending', async () => {
    mockInvoke.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('Response'), 100))
    );

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(button);

    expect(button).toHaveTextContent('Sending...');
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).toHaveTextContent('Send');
    });
  });

  it('displays error message on failure', async () => {
    mockInvoke.mockRejectedValue(new Error('API key not configured'));

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(button);

    expect(await screen.findByTestId('error-message')).toHaveTextContent(
      'API key not configured'
    );
  });

  it('calls onSendMessage callback', async () => {
    mockInvoke.mockResolvedValue('Response');
    const onSendMessage = vi.fn();

    render(<ChatInterface onSendMessage={onSendMessage} />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('does not send empty messages', async () => {
    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('handles multiple messages in sequence', async () => {
    mockInvoke
      .mockResolvedValueOnce('Response 1')
      .mockResolvedValueOnce('Response 2');

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    // First message
    fireEvent.change(input, { target: { value: 'Message 1' } });
    fireEvent.click(button);
    await waitFor(() => screen.findByText('Response 1'));

    // Second message
    fireEvent.change(input, { target: { value: 'Message 2' } });
    fireEvent.click(button);
    await waitFor(() => screen.findByText('Response 2'));

    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('disables input while loading', async () => {
    mockInvoke.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('Response'), 100))
    );

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(button);

    expect(input).toBeDisabled();

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });

  it('handles long messages', async () => {
    mockInvoke.mockResolvedValue('Long response');
    const longMessage = 'A'.repeat(1000);

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send_chat_message', {
        message: longMessage,
      });
    });
  });

  it('handles special characters in messages', async () => {
    mockInvoke.mockResolvedValue('Response');
    const specialMessage = 'Test with émojis 🎉 and symbols !@#$%';

    render(<ChatInterface />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: specialMessage } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send_chat_message', {
        message: specialMessage,
      });
    });
  });
});

// Add React import for the component
import React from 'react';
