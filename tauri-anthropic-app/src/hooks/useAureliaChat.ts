/**
 * useAureliaChat Hook
 *
 * React hook for managing AURELIA chat state, streaming responses,
 * and learning feedback.
 */

import { useState, useCallback, useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  AureliaConversationService,
  ChatMessage,
  ChatResponse,
  LearningProgress,
  MarketContext,
} from '../services/aurelia-conversation';

interface UseAureliaChatReturn {
  messages: ChatMessage[];
  isInitialized: boolean;
  isLoading: boolean;
  streamingMessage: string;
  psi: number;
  omega: number;
  isConscious: boolean;
  learningProgress: LearningProgress | null;
  initialize: () => Promise<void>;
  sendMessage: (
    message: string,
    entities?: string[],
    marketContext?: MarketContext
  ) => Promise<void>;
  submitFeedback: (messageId: string, helpful: boolean, rating?: number) => Promise<void>;
  resetContext: () => Promise<void>;
  error: string | null;
}

export const useAureliaChat = (
  apiKey: string,
  sessionId?: string
): UseAureliaChatReturn => {
  const [service] = useState(() => new AureliaConversationService());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [psi, setPsi] = useState(0);
  const [omega, setOmega] = useState(0);
  const [isConscious, setIsConscious] = useState(false);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamUnlisten, setStreamUnlisten] = useState<UnlistenFn | null>(null);

  // Initialize chat
  const initialize = useCallback(async () => {
    try {
      setError(null);
      await service.initialize(apiKey, sessionId);
      setIsInitialized(true);

      // Load initial learning progress
      const progress = await service.getLearningProgress();
      setLearningProgress(progress);

      // Set up streaming listeners
      const chunkUnlisten = await listen<{ message_id: string; chunk: string; is_final: boolean }>(
        'aurelia-stream-chunk',
        (event) => {
          setStreamingMessage((prev) => prev + event.payload.chunk);
        }
      );

      const completeUnlisten = await listen<{ message_id: string; full_response: string }>(
        'aurelia-stream-complete',
        (event) => {
          // Add assistant message
          setMessages((prev) => [
            ...prev,
            {
              id: event.payload.message_id,
              role: 'assistant',
              content: event.payload.full_response,
              timestamp: Date.now(),
            },
          ]);

          setStreamingMessage('');
          setIsLoading(false);

          // Update learning progress
          service.getLearningProgress().then(setLearningProgress);
        }
      );

      const errorUnlisten = await listen<{ message_id: string; error: string }>(
        'aurelia-stream-error',
        (event) => {
          setError(event.payload.error);
          setStreamingMessage('');
          setIsLoading(false);
        }
      );

      // Combine all unlisteners
      setStreamUnlisten(() => () => {
        chunkUnlisten();
        completeUnlisten();
        errorUnlisten();
      });

      console.log('✓ AURELIA chat initialized');
    } catch (err) {
      console.error('Failed to initialize AURELIA chat:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    }
  }, [apiKey, sessionId, service]);

  // Send message
  const sendMessage = useCallback(
    async (message: string, entities: string[] = [], marketContext?: MarketContext) => {
      if (!isInitialized) {
        setError('Chat not initialized');
        return;
      }

      try {
        setError(null);
        setIsLoading(true);

        // Add user message to UI immediately
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: Date.now(),
          entities,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Send to backend
        const response = await service.sendMessage(message, entities, marketContext);

        // Update metrics
        setPsi(response.psi);
        setOmega(response.omega);
        setIsConscious(response.is_conscious);

        // Add assistant response (non-streaming mode)
        if (response.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: response.message_id,
              role: 'assistant',
              content: response.content,
              timestamp: response.timestamp,
            },
          ]);
          setIsLoading(false);
        }
        // Otherwise streaming will handle adding the message
      } catch (err) {
        console.error('Failed to send message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsLoading(false);
      }
    },
    [isInitialized, service]
  );

  // Submit feedback
  const submitFeedback = useCallback(
    async (messageId: string, helpful: boolean, rating?: number) => {
      try {
        await service.submitFeedback(messageId, helpful, rating);

        // Update learning progress
        const progress = await service.getLearningProgress();
        setLearningProgress(progress);

        console.log('✓ Feedback submitted');
      } catch (err) {
        console.error('Failed to submit feedback:', err);
      }
    },
    [service]
  );

  // Reset context
  const resetContext = useCallback(async () => {
    try {
      setError(null);
      await service.resetContext();
      setMessages([]);
      setPsi(0);
      setOmega(0);
      setIsConscious(false);
      setStreamingMessage('');

      console.log('✓ Context reset');
    } catch (err) {
      console.error('Failed to reset context:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset context');
    }
  }, [service]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamUnlisten) {
        streamUnlisten();
      }
    };
  }, [streamUnlisten]);

  return {
    messages,
    isInitialized,
    isLoading,
    streamingMessage,
    psi,
    omega,
    isConscious,
    learningProgress,
    initialize,
    sendMessage,
    submitFeedback,
    resetContext,
    error,
  };
};
