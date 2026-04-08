"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLibrarianChat } from "@/hooks/useLibrarianChat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SUGGESTED_PROMPTS } from "@/lib/chat/system-prompt";

interface Props {
  contextBookId?:    string;
  contextBookTitle?: string;
  contextBookAuthor?: string;
}

export function LibrarianChat({ contextBookId, contextBookTitle, contextBookAuthor }: Props) {
  const pathname      = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages, isLoading, isStreaming,
    isOpen, error, sendMessage, openChat, closeChat, clearChat,
  } = useLibrarianChat({
    contextPage:       pathname,
    contextBookId,
    contextBookTitle,
    contextBookAuthor,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={openChat}
            aria-label="Open chat with The Librarian"
            title="Ask The Librarian"
            className="librarian-trigger"
          >
            <span className="trigger-icon" aria-hidden="true">🕯</span>
            <span className="trigger-label">The Librarian</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1  }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="librarian-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Chat with The Librarian"
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="panel-header">
              <div className="header-identity">
                <span className="header-icon" aria-hidden="true">🕯</span>
                <div>
                  <h2>The Librarian</h2>
                  <p>Your guide through the archive</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    aria-label="Clear conversation"
                    title="Start over"
                    className="close-btn"
                    style={{ fontSize: "12px" }}
                  >
                    <RotateCcw style={{ width: 14, height: 14 }} />
                  </button>
                )}
                <button onClick={closeChat} aria-label="Close chat" className="close-btn">
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* ── Context banner (book page) ───────────── */}
            {contextBookTitle && (
              <div className="context-banner" aria-live="polite">
                <BookOpen style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span>Reading: <em>{contextBookTitle}</em></span>
              </div>
            )}

            {/* ── Messages ─────────────────────────────── */}
            <div
              className="messages-container"
              role="log"
              aria-label="Conversation with The Librarian"
              aria-live="polite"
            >
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Loading dots — shown between send and first token */}
              {isLoading && !isStreaming && (
                <div className="thinking-indicator" aria-label="The Librarian is thinking">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="error-bubble" role="alert">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggested prompts (first open only) ──── */}
            {messages.length === 1 && !isLoading && (
              <div className="suggested-prompts" aria-label="Suggested questions">
                <p>You might ask:</p>
                <div className="prompts-grid">
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="prompt-chip"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ────────────────────────────────── */}
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading}
              placeholder="Ask the librarian anything…"
            />

            {/* ── Footer ───────────────────────────────── */}
            <div className="panel-footer">
              Powered by Perplexity · Responses may contain inaccuracies
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
