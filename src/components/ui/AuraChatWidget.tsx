"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
  suggestions?: string[];
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Aura, your food assistant. I can help you find meals, track orders, or build your perfect box. What can I help you with?",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  "What's popular?",
  "Track my order",
  "Help me choose",
  "Dietary options",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
        <SparkleIcon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5" role="status" aria-label="Aura is typing">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2.5 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <SparkleIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1.5 tabular-nums",
            isUser ? "text-emerald-200 text-right" : "text-gray-400"
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function AuraChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const conversationHistory = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        conversationHistory.push({ role: "user", content: content.trim() });

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversationHistory,
          }),
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: ChatResponse = await res.json();

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Chat error:", err);
        setError("Something went wrong. Please try again.");
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble right now. Please try again in a moment.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-out",
          // Desktop positioning
          "bottom-6 right-6 w-[400px] h-[600px]",
          // Mobile: full screen overlay
          "max-md:inset-0 max-md:w-full max-md:h-full max-md:bottom-0 max-md:right-0",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        role="dialog"
        aria-label="Ask Aura chat"
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full bg-white rounded-2xl max-md:rounded-none shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <SparkleIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-none">Ask Aura</h2>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Your food assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors md:block hidden"
                aria-label="Minimize chat"
              >
                <MinimizeIcon className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Close chat"
              >
                <CloseIcon className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <p className="text-xs text-red-500 text-center mb-3">{error}</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura anything..."
              disabled={isLoading}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:opacity-50 transition-colors"
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="w-4.5 h-4.5" />
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-[10px] text-gray-400 text-center pb-2 px-4 max-md:pb-[env(safe-area-inset-bottom,8px)]">
            Press Enter to send
          </p>
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed z-50 bottom-6 right-6 max-md:bottom-20 max-md:right-4",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-emerald-500 to-emerald-600",
          "text-white shadow-lg shadow-emerald-500/25",
          "flex items-center justify-center",
          "hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30",
          "active:scale-95",
          "transition-all duration-200",
          isOpen && "max-md:hidden",
          !isOpen && "animate-pulse-subtle"
        )}
        aria-label={isOpen ? "Close Aura chat" : "Open Aura chat"}
        aria-expanded={isOpen}
        aria-controls="aura-chat-panel"
      >
        {isOpen ? (
          <CloseIcon className="w-5.5 h-5.5" />
        ) : (
          <SparkleIcon className="w-6 h-6" />
        )}
      </button>

      {/* Pulse animation style */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
