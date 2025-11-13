/**
 * Type definitions for Tauri Anthropic Chat Application
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiKeyStatus {
  hasKey: boolean;
  isValid?: boolean;
  model?: string;
}

export interface StreamChunk {
  type: 'content_block_delta' | 'content_block_start' | 'message_delta' | 'message_stop';
  delta?: {
    type: 'text_delta';
    text: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ChatConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

export interface TauriCommands {
  send_chat_message: (message: string) => Promise<string>;
  send_chat_stream: (message: string) => Promise<void>;
  save_api_key: (apiKey: string) => Promise<void>;
  check_api_key: () => Promise<boolean>;
  validate_api_key: (apiKey: string) => Promise<boolean>;
  get_chat_history: () => Promise<ChatSession[]>;
  save_chat_session: (session: ChatSession) => Promise<void>;
  delete_chat_session: (sessionId: string) => Promise<void>;
  get_config: () => Promise<ChatConfig>;
  update_config: (config: Partial<ChatConfig>) => Promise<void>;
}

export type LoadingState = 'idle' | 'loading' | 'streaming' | 'error';

export interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
}
