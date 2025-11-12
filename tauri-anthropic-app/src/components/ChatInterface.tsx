import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { Send, StopCircle, Loader2 } from 'lucide-react';
import type { Message, LoadingState, StreamChunk } from '@/types';
import { MessageList } from './MessageList';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Listen for streaming events
  useEffect(() => {
    const unlisten = listen<StreamChunk>('chat-stream', (event) => {
      const chunk = event.payload;

      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        setStreamingContent(prev => prev + chunk.delta!.text);
      } else if (chunk.type === 'message_stop') {
        // Finalize the message
        const finalMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, finalMessage]);
        setStreamingContent('');
        setLoadingState('idle');
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || loadingState !== 'idle') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingState('streaming');
    setStreamingContent('');

    try {
      // Use streaming API
      await invoke('send_chat_stream', {
        message: userMessage.content,
        history: messages.slice(-10), // Send last 10 messages for context
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setLoadingState('error');

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingContent('');
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setLoadingState('idle');

    if (streamingContent) {
      const partialMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: streamingContent + '\n\n[Generation stopped]',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, partialMessage]);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
    setLoadingState('idle');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claude Chat</h1>
          <p className="text-sm text-gray-500">Powered by Anthropic AI</p>
        </div>
        <Button
          onClick={clearChat}
          variant="outline"
          disabled={messages.length === 0 && !streamingContent}
        >
          Clear Chat
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Start a conversation
              </h2>
              <p className="text-gray-500">
                Type a message below to chat with Claude
              </p>
            </div>
          )}

          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={loadingState === 'streaming'}
          />

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full resize-none"
                rows={3}
                disabled={loadingState === 'streaming'}
              />
            </div>

            <div className="flex flex-col gap-2">
              {loadingState === 'streaming' ? (
                <Button
                  onClick={stopGeneration}
                  variant="destructive"
                  size="lg"
                  className="whitespace-nowrap"
                >
                  <StopCircle className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loadingState !== 'idle'}
                  size="lg"
                  className="whitespace-nowrap"
                >
                  {loadingState === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Claude can make mistakes. Please verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
