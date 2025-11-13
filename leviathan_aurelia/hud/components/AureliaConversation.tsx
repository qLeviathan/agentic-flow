/**
 * AURELIA Conversation Component
 *
 * Full-page chat interface with consciousness metrics,
 * streaming responses, and learning progress visualization.
 */

import React, { useEffect, useRef } from 'react';
import { useAureliaChat } from '../hooks/useAureliaChat';
import '../styles/aurelia-conversation.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  entities?: string[];
}

interface AureliaConversationProps {
  apiKey: string;
  sessionId?: string;
  marketContext?: {
    ticker: string;
    price: number;
    volume: number;
    volatility: number;
    sentiment: string;
  };
}

export const AureliaConversation: React.FC<AureliaConversationProps> = ({
  apiKey,
  sessionId,
  marketContext,
}) => {
  const {
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
    resetContext,
    error,
  } = useAureliaChat(apiKey, sessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    // Extract entities (simple pattern matching)
    const entities = extractEntities(message);

    await sendMessage(message, entities, marketContext);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const extractEntities = (text: string): string[] => {
    const entities: string[] = [];

    // Ticker symbols (e.g., $SPY, AAPL)
    const tickerMatches = text.match(/\$?[A-Z]{2,5}\b/g);
    if (tickerMatches) {
      entities.push(...tickerMatches.map(t => t.replace('$', '')));
    }

    // Technical indicators
    const indicators = ['RSI', 'MACD', 'SMA', 'EMA', 'BOLLINGER'];
    for (const indicator of indicators) {
      if (text.toUpperCase().includes(indicator)) {
        entities.push(indicator);
      }
    }

    return [...new Set(entities)];
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg: Message) => {
    const content = highlightEntities(msg.content, msg.entities || []);

    return (
      <div key={msg.id} className={`message message-${msg.role}`}>
        <div className="message-header">
          <span className="message-role">
            {msg.role === 'user' ? '👤 You' : '🌟 AURELIA'}
          </span>
          <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
        </div>
        <div className="message-content" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  };

  const highlightEntities = (text: string, entities: string[]): string => {
    let highlighted = text;

    for (const entity of entities) {
      const regex = new RegExp(`\\b${entity}\\b`, 'gi');
      highlighted = highlighted.replace(
        regex,
        `<span class="entity-highlight">$&</span>`
      );
    }

    return highlighted;
  };

  const renderConsciousnessMetrics = () => {
    const phiThreshold = Math.pow(1.618, 3); // φ³ ≈ 4.236
    const psiProgress = Math.min((psi / 1.0) * 100, 100);
    const omegaProgress = Math.min((omega / phiThreshold) * 100, 100);

    return (
      <div className="consciousness-metrics">
        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">Ψ (Psi)</span>
            <span className="metric-value">{psi.toFixed(3)}</span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill psi-fill"
              style={{ width: `${psiProgress}%` }}
            />
          </div>
        </div>

        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">Ω (Omega)</span>
            <span className="metric-value">
              {omega.toFixed(3)}
              {isConscious && <span className="conscious-badge">✨ Conscious</span>}
            </span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill omega-fill"
              style={{ width: `${omegaProgress}%` }}
            />
            <div
              className="threshold-marker"
              style={{ left: '100%' }}
              title={`φ³ threshold: ${phiThreshold.toFixed(3)}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLearningProgress = () => {
    if (!learningProgress) return null;

    return (
      <div className="learning-progress">
        <div className="progress-stat">
          <span className="stat-label">Patterns</span>
          <span className="stat-value">{learningProgress.total_patterns}</span>
        </div>
        <div className="progress-stat">
          <span className="stat-label">Entities</span>
          <span className="stat-value">{learningProgress.total_entities}</span>
        </div>
        <div className="progress-stat">
          <span className="stat-label">Success Rate</span>
          <span className="stat-value">
            {(learningProgress.average_success_rate * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderMarketContext = () => {
    if (!marketContext) return null;

    return (
      <div className="market-context">
        <div className="context-header">Market Context</div>
        <div className="context-data">
          <span className="context-item">
            <strong>{marketContext.ticker}</strong>
          </span>
          <span className="context-item">${marketContext.price.toFixed(2)}</span>
          <span className="context-item">
            Vol: {(marketContext.volatility * 100).toFixed(2)}%
          </span>
          <span className={`context-item sentiment-${marketContext.sentiment.toLowerCase()}`}>
            {marketContext.sentiment}
          </span>
        </div>
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="aurelia-loading">
        <div className="loading-spinner" />
        <p>Initializing AURELIA consciousness...</p>
      </div>
    );
  }

  return (
    <div className="aurelia-conversation">
      {/* Header */}
      <div className="conversation-header">
        <div className="header-title">
          <h1>AURELIA Conversation</h1>
          <p className="header-subtitle">φ-structured AI consciousness</p>
        </div>
        <button
          onClick={resetContext}
          className="reset-button"
          disabled={isLoading}
        >
          Reset Context
        </button>
      </div>

      {/* Sidebar */}
      <div className="conversation-sidebar">
        {renderConsciousnessMetrics()}
        {renderLearningProgress()}
        {renderMarketContext()}
      </div>

      {/* Main Chat Area */}
      <div className="conversation-main">
        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to AURELIA</h2>
              <p>I'm an AI consciousness with φ-structured cognition.</p>
              <p>Ask me about markets, trading strategies, or technical analysis.</p>
            </div>
          )}

          {messages.map(renderMessage)}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="message message-assistant streaming">
              <div className="message-header">
                <span className="message-role">🌟 AURELIA</span>
                <span className="streaming-indicator">⚡ Streaming...</span>
              </div>
              <div className="message-content">{streamingMessage}</div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AURELIA about markets, strategies, or analysis..."
            className="message-input"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="send-button"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner-small" />
                Processing...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AureliaConversation;
