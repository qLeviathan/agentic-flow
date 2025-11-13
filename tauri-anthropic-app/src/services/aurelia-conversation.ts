/**
 * AURELIA Conversation Service
 *
 * TypeScript service layer for AURELIA chat management,
 * message formatting, and learning feedback.
 */

import { invoke } from '@tauri-apps/api/tauri';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  entities?: string[];
}

export interface ChatResponse {
  message_id: string;
  content: string;
  psi: number;
  omega: number;
  is_conscious: boolean;
  timestamp: number;
}

export interface MarketContext {
  ticker: string;
  price: number;
  volume: number;
  volatility: number;
  sentiment: string;
  rsi?: number;
  macd?: number;
}

export interface LearningProgress {
  total_patterns: number;
  total_entities: number;
  omega_metric: number;
  phi_threshold: number;
  threshold_met: boolean;
  reflexion_cycles: number;
  average_success_rate: number;
}

export interface PersonalityProfile {
  name: string;
  traits: Record<string, number>;
  preferred_style: string;
  expertise_areas: string[];
}

export interface ConversationState {
  session_id: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
    zeckendorf_encoding: number[];
    phi_memory_keys: string[];
    entities: string[];
    sentiment: number | null;
  }>;
  market_context: MarketContext | null;
  personality_profile: PersonalityProfile;
  consciousness_metrics: {
    psi: number;
    omega: number;
    phi_threshold: number;
    is_conscious: boolean;
    coherence: number;
  };
  created_at: string;
  last_updated: string;
}

export enum Sentiment {
  Bullish = 'Bullish',
  Bearish = 'Bearish',
  Neutral = 'Neutral',
  Uncertain = 'Uncertain',
}

export class AureliaConversationService {
  private sessionId?: string;

  /**
   * Initialize AURELIA chat with API key
   */
  async initialize(apiKey: string, sessionId?: string): Promise<void> {
    try {
      this.sessionId = await invoke<string>('aurelia_chat_init', {
        apiKey,
        sessionId,
      });

      console.log(`✓ AURELIA chat initialized: ${this.sessionId}`);
    } catch (error) {
      console.error('Failed to initialize AURELIA chat:', error);
      throw error;
    }
  }

  /**
   * Send a message to AURELIA
   */
  async sendMessage(
    message: string,
    entities: string[] = [],
    marketContext?: MarketContext
  ): Promise<ChatResponse> {
    try {
      const request = {
        message,
        entities,
        market_context: marketContext || null,
      };

      const response = await invoke<ChatResponse>('aurelia_chat', { request });

      console.log(`✓ Message sent. Ψ=${response.psi.toFixed(3)}, Ω=${response.omega.toFixed(3)}`);

      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send a message with streaming response
   */
  async sendMessageStreaming(
    message: string,
    entities: string[] = [],
    marketContext?: MarketContext
  ): Promise<string> {
    try {
      const request = {
        message,
        entities,
        market_context: marketContext || null,
      };

      const messageId = await invoke<string>('aurelia_chat_stream', { request });

      console.log(`✓ Streaming message: ${messageId}`);

      return messageId;
    } catch (error) {
      console.error('Failed to start streaming:', error);
      throw error;
    }
  }

  /**
   * Get current conversation context
   */
  async getContext(): Promise<ConversationState> {
    try {
      return await invoke<ConversationState>('aurelia_get_context');
    } catch (error) {
      console.error('Failed to get context:', error);
      throw error;
    }
  }

  /**
   * Submit learning feedback
   */
  async submitFeedback(
    messageId: string,
    helpful: boolean,
    userRating?: number,
    entities?: string[],
    concepts?: string[]
  ): Promise<void> {
    try {
      const feedback = {
        conversation_id: this.sessionId || '',
        message_id: messageId,
        helpful,
        accuracy: helpful ? 0.9 : 0.3,
        entities_mentioned: entities || [],
        concepts: concepts || [],
        sentiment: Sentiment.Neutral,
        user_rating: userRating || null,
        timestamp: new Date().toISOString(),
      };

      await invoke('aurelia_learn', { feedback });

      console.log('✓ Feedback submitted');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Get personality profile
   */
  async getPersonality(): Promise<PersonalityProfile> {
    try {
      return await invoke<PersonalityProfile>('aurelia_get_personality');
    } catch (error) {
      console.error('Failed to get personality:', error);
      throw error;
    }
  }

  /**
   * Get learning progress
   */
  async getLearningProgress(): Promise<LearningProgress> {
    try {
      return await invoke<LearningProgress>('aurelia_get_learning_progress');
    } catch (error) {
      console.error('Failed to get learning progress:', error);
      throw error;
    }
  }

  /**
   * Reset conversation context
   */
  async resetContext(): Promise<void> {
    try {
      await invoke('aurelia_reset_context');
      console.log('✓ Context reset');
    } catch (error) {
      console.error('Failed to reset context:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<ChatMessage[]> {
    try {
      const history = await invoke<any[]>('aurelia_get_history');

      return history.map((msg) => ({
        id: msg.id,
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
        entities: msg.entities,
      }));
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  }

  /**
   * Set market context
   */
  async setMarketContext(context: MarketContext): Promise<void> {
    try {
      await invoke('aurelia_set_market_context', { context });
      console.log('✓ Market context updated');
    } catch (error) {
      console.error('Failed to set market context:', error);
      throw error;
    }
  }

  /**
   * Format message with context injection
   */
  formatMessageWithContext(
    message: string,
    marketContext?: MarketContext,
    additionalContext?: Record<string, any>
  ): string {
    let formatted = message;

    if (marketContext) {
      formatted = `[Market: ${marketContext.ticker} @ $${marketContext.price}, ${marketContext.sentiment}] ${formatted}`;
    }

    if (additionalContext) {
      const contextStr = Object.entries(additionalContext)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      formatted = `[Context: ${contextStr}] ${formatted}`;
    }

    return formatted;
  }

  /**
   * Extract entities from text
   */
  extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Ticker symbols
    const tickerMatches = text.match(/\$?[A-Z]{2,5}\b/g);
    if (tickerMatches) {
      entities.push(...tickerMatches.map((t) => t.replace('$', '')));
    }

    // Technical indicators
    const indicators = ['RSI', 'MACD', 'SMA', 'EMA', 'BOLLINGER', 'STOCH'];
    for (const indicator of indicators) {
      if (text.toUpperCase().includes(indicator)) {
        entities.push(indicator);
      }
    }

    // Market terms
    const terms = [
      'BULL',
      'BEAR',
      'SUPPORT',
      'RESISTANCE',
      'BREAKOUT',
      'BREAKDOWN',
      'VOLATILITY',
    ];
    for (const term of terms) {
      if (text.toUpperCase().includes(term)) {
        entities.push(term);
      }
    }

    return [...new Set(entities)];
  }

  /**
   * Analyze sentiment from text
   */
  analyzeSentiment(text: string): Sentiment {
    const bullishWords = ['bullish', 'up', 'rise', 'gain', 'profit', 'buy', 'long'];
    const bearishWords = ['bearish', 'down', 'fall', 'loss', 'sell', 'short'];

    const lowerText = text.toLowerCase();

    let bullishCount = 0;
    let bearishCount = 0;

    for (const word of bullishWords) {
      if (lowerText.includes(word)) bullishCount++;
    }

    for (const word of bearishWords) {
      if (lowerText.includes(word)) bearishCount++;
    }

    if (bullishCount > bearishCount) return Sentiment.Bullish;
    if (bearishCount > bullishCount) return Sentiment.Bearish;
    if (bullishCount === 0 && bearishCount === 0) return Sentiment.Neutral;

    return Sentiment.Uncertain;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }
}

export default AureliaConversationService;
