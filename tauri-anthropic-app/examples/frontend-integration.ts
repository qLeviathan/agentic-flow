/**
 * Frontend Integration Example for Keychain Storage
 *
 * This file demonstrates how to integrate the secure keychain storage
 * with a React/TypeScript frontend in a Tauri application.
 */

import { invoke } from '@tauri-apps/api/tauri';

// ============================================================================
// Type Definitions
// ============================================================================

interface InitResponse {
  success: boolean;
  message: string;
}

interface SendMessageRequest {
  messages: MessageData[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

interface MessageData {
  role: 'user' | 'assistant';
  content: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ============================================================================
// Keychain Service
// ============================================================================

export class KeychainService {
  /**
   * Save API key to system keychain
   *
   * @param apiKey - Anthropic API key (sk-ant-...)
   * @returns Success message
   * @throws Error if save fails
   */
  static async saveApiKey(apiKey: string): Promise<string> {
    try {
      const result = await invoke<string>('save_api_key', { apiKey });
      console.log('API key saved successfully');
      return result;
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error(`Failed to save API key: ${error}`);
    }
  }

  /**
   * Retrieve API key from system keychain
   *
   * @returns The stored API key
   * @throws Error if key not found or retrieval fails
   */
  static async getApiKey(): Promise<string> {
    try {
      const key = await invoke<string>('get_api_key');
      console.log('API key retrieved successfully');
      return key;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      throw new Error('API key not found. Please configure your API key first.');
    }
  }

  /**
   * Delete API key from system keychain
   *
   * @returns Success message
   * @throws Error if deletion fails
   */
  static async deleteApiKey(): Promise<string> {
    try {
      const result = await invoke<string>('delete_api_key');
      console.log('API key deleted successfully');
      return result;
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw new Error(`Failed to delete API key: ${error}`);
    }
  }

  /**
   * Check if an API key exists in keychain
   *
   * @returns true if key exists, false otherwise
   */
  static async hasApiKey(): Promise<boolean> {
    try {
      return await invoke<boolean>('has_api_key');
    } catch (error) {
      console.error('Failed to check API key:', error);
      return false;
    }
  }

  /**
   * Validate the stored API key
   *
   * @returns true if key is valid, false otherwise
   */
  static async validateApiKey(): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_api_key');
    } catch (error) {
      console.error('Failed to validate API key:', error);
      return false;
    }
  }
}

// ============================================================================
// Anthropic Client Service
// ============================================================================

export class AnthropicClientService {
  /**
   * Initialize the Anthropic client with a provided API key
   *
   * @param apiKey - Anthropic API key
   * @returns Initialization response
   */
  static async initClient(apiKey: string): Promise<InitResponse> {
    try {
      const response = await invoke<InitResponse>('init_client', {
        request: { api_key: apiKey }
      });
      return response;
    } catch (error) {
      console.error('Failed to initialize client:', error);
      throw new Error(`Failed to initialize client: ${error}`);
    }
  }

  /**
   * Initialize the Anthropic client using API key from keychain
   *
   * @returns Initialization response
   * @throws Error if keychain key not found or initialization fails
   */
  static async initWithKeychain(): Promise<InitResponse> {
    try {
      const response = await invoke<InitResponse>('init_with_keychain');
      console.log('Client initialized from keychain');
      return response;
    } catch (error) {
      console.error('Failed to initialize from keychain:', error);
      throw new Error('Failed to initialize. Please configure your API key first.');
    }
  }

  /**
   * Check if the client is initialized
   *
   * @returns true if initialized, false otherwise
   */
  static async isInitialized(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_initialized');
    } catch (error) {
      console.error('Failed to check initialization:', error);
      return false;
    }
  }

  /**
   * Send a message to Claude
   *
   * @param request - Message request with conversation history
   * @returns Response from Claude
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await invoke<SendMessageResponse>('send_message', { request });
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Send a simple text message to Claude
   *
   * @param text - User message
   * @param system - Optional system prompt
   * @returns Response from Claude
   */
  static async sendText(text: string, system?: string): Promise<SendMessageResponse> {
    try {
      const response = await invoke<SendMessageResponse>('send_text', { text, system });
      return response;
    } catch (error) {
      console.error('Failed to send text:', error);
      throw new Error(`Failed to send text: ${error}`);
    }
  }
}

// ============================================================================
// React Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing API key configuration
 */
export function useApiKey() {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if key exists on mount
  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = useCallback(async () => {
    setLoading(true);
    try {
      const exists = await KeychainService.hasApiKey();
      setHasKey(exists);

      if (exists) {
        const valid = await KeychainService.validateApiKey();
        setIsValid(valid);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasKey(false);
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveKey = useCallback(async (apiKey: string) => {
    setLoading(true);
    try {
      await KeychainService.saveApiKey(apiKey);
      await checkApiKey();
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkApiKey]);

  const deleteKey = useCallback(async () => {
    setLoading(true);
    try {
      await KeychainService.deleteApiKey();
      setHasKey(false);
      setIsValid(false);
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hasKey,
    isValid,
    loading,
    saveKey,
    deleteKey,
    checkApiKey,
  };
}

/**
 * Hook for managing Anthropic client
 */
export function useAnthropicClient() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check initialization on mount
  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = useCallback(async () => {
    const isInit = await AnthropicClientService.isInitialized();
    setInitialized(isInit);
  }, []);

  const initializeFromKeychain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await AnthropicClientService.initWithKeychain();
      setInitialized(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!initialized) {
      throw new Error('Client not initialized');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await AnthropicClientService.sendMessage(request);
      if (!response.success && response.error) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  const sendText = useCallback(async (text: string, system?: string) => {
    if (!initialized) {
      throw new Error('Client not initialized');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await AnthropicClientService.sendText(text, system);
      if (!response.success && response.error) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  return {
    initialized,
    loading,
    error,
    initializeFromKeychain,
    sendMessage,
    sendText,
    checkInitialization,
  };
}

// ============================================================================
// React Component Example
// ============================================================================

/**
 * Example React component for API key configuration
 */
export function ApiKeySettings() {
  const { hasKey, isValid, loading, saveKey, deleteKey } = useApiKey();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter an API key');
      return;
    }

    const success = await saveKey(apiKeyInput);
    if (success) {
      setApiKeyInput('');
      alert('API key saved securely!');
    } else {
      alert('Failed to save API key');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete the API key?')) {
      const success = await deleteKey();
      if (success) {
        alert('API key deleted');
      } else {
        alert('Failed to delete API key');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="api-key-settings">
      <h2>API Key Configuration</h2>

      {hasKey ? (
        <div className="key-status">
          <p>
            {isValid ? '✓' : '⚠'} API key is {isValid ? 'configured' : 'invalid'}
          </p>
          <button onClick={handleDelete}>Delete Key</button>
        </div>
      ) : (
        <div className="key-input">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter Anthropic API key (sk-ant-...)"
          />
          <label>
            <input
              type="checkbox"
              checked={showKey}
              onChange={(e) => setShowKey(e.target.checked)}
            />
            Show key
          </label>
          <button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Key'}
          </button>
        </div>
      )}

      <div className="help-text">
        <p>Your API key is stored securely in the system keychain.</p>
        <p>Get your API key from: https://console.anthropic.com/</p>
      </div>
    </div>
  );
}

/**
 * Example React component for chat interface
 */
export function ChatInterface() {
  const { initialized, loading, error, initializeFromKeychain, sendText } = useAnthropicClient();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Auto-initialize from keychain on mount
    if (!initialized) {
      initializeFromKeychain();
    }
  }, [initialized, initializeFromKeychain]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MessageData = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendText(input);

      if (response.success && response.message) {
        const assistantMessage: MessageData = {
          role: 'assistant',
          content: response.message,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!initialized) {
    return (
      <div>
        <p>Initializing client...</p>
        {error && <p>Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}
