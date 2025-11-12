import { memo } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/utils/cn';

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
}

export const MessageList = memo(function MessageList({
  messages,
  streamingContent,
  isStreaming
}: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {streamingContent && (
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              {isStreaming && (
                <span className="inline-block ml-1 animate-pulse">▊</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-4 items-start',
      isUser && 'flex-row-reverse'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
          : 'bg-gradient-to-br from-purple-500 to-pink-500'
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={cn(
        'flex-1 rounded-2xl px-4 py-3 shadow-sm border',
        isUser
          ? 'bg-blue-500 text-white rounded-tr-none border-blue-600'
          : 'bg-white text-gray-900 rounded-tl-none border-gray-200'
      )}>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap m-0">{message.content}</p>
        </div>

        <div className={cn(
          'text-xs mt-2',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
