import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import config from '@/config';
import { clearStorage, loadFromStorage, saveToStorage } from './utils/Storage';

const suggestedPrompts = [
  'Explain quantum computing simply',
  'Write a professional email',
  'Brainstorm startup ideas',
  'Plan a healthy weekly routine',
];

export default function App() {
  const saved = loadFromStorage();
  const [messages, setMessages] = useState<Message[]>(saved.messages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<number[]>(saved.context);

  // Persist messages + context whenever they change
  useEffect(() => {
    saveToStorage(messages, contextRef.current);
  }, [messages]);

  // Auto-scroll to bottom when messages change (only if already at bottom)
  useEffect(() => {
    const chatElement = chatRef.current;
    if (chatElement && !showScrollButton) {
      chatElement.scrollTop = chatElement.scrollHeight;
    }
  }, [messages, showScrollButton]);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback(() => {
    const chatElement = chatRef.current;
    if (chatElement) {
      const { scrollTop, scrollHeight, clientHeight } = chatElement;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    }
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    const chatElement = chatRef.current;
    if (chatElement) {
      chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    contextRef.current = [];
    clearStorage();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch(`${config.botUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt: userMessage.content,
          context: contextRef.current,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line);
            accumulatedContent += chunk.response;

            // Update the assistant message incrementally
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulatedContent };
              return updated;
            });

            if (chunk.done && chunk.context) {
              contextRef.current = chunk.context;
            }
          } catch {
            // Skip partial/incomplete lines
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant' && updated[i].content === '') {
            updated[i] = { ...updated[i], content: '⚠️ Failed to get response. Is Ollama running?' };
            break;
          }
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
        <div className="flex flex-1 items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NativeMind</span>
        </div>
        {!isEmpty && (
          <button
            onClick={clearConversation}
            className="flex-shrink-0 rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
          >
            Clear
          </button>
        )}
      </header>

      {/* Chat area */}
      <main ref={chatRef} className="flex-1 overflow-y-auto relative" onScroll={handleScroll}>
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">How can I help you today?</h1>
            <p className="mt-2 text-sm text-zinc-500">Ask me anything, or try one of these:</p>
            <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[100%] rounded-3xl px-5 py-3 text-[15px] leading-relaxed ${message.role === 'user'
                    ? 'rounded-br-md bg-zinc-900 text-white'
                    : 'rounded-bl-md bg-zinc-100 text-zinc-900'
                    }`}
                >
                  {message.content ? (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-xl text-sm my-2"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-zinc-200 text-zinc-800 rounded px-1 py-0.5 text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-2 last:mb-0">{children}</p>;
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex gap-1.5 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Scroll to bottom button */}
      {!isEmpty && showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:bg-zinc-700 animate-fadeIn"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Input */}
      <footer className="border-t border-zinc-100 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white p-2 pl-5 shadow-sm transition-colors focus-within:border-zinc-400">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message NativeMind..."
              disabled={isStreaming}
              className="max-h-40 flex-1 resize-none border-0 bg-transparent py-2.5 text-[15px] placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white transition-all hover:bg-zinc-700 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-zinc-400">
            NativeMind can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>
    </div>
  );
}