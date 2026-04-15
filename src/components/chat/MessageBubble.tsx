"use client";

import type { ChatMessage } from "./LibrarianProvider";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Props { message: ChatMessage }

export function MessageBubble({ message }: Props) {
  const isAssistant = message.role === "assistant";
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`message-bubble ${isAssistant ? "assistant" : "user"}`}
    >
      {isAssistant && (
        <div className={`avatar librarian-avatar ${message.isStreaming ? 'is-streaming' : ''}`} aria-hidden="true">🕯</div>
      )}

      <div className="bubble-content">
        <div className="bubble-text">
          {formatMessage(message.content)}
          {message.isStreaming && (
            <span className="streaming-cursor" aria-hidden="true">▋</span>
          )}
        </div>

        {/* Citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="sources" aria-label="Sources">
            <p className="sources-label">Sources</p>
            <ul>
              {message.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Source: ${source.title}`}
                  >
                    <ExternalLink style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Minimal markdown renderer: bold, italic, newlines → paragraphs */
function formatMessage(content: string) {
  if (!content) return null;
  return content.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Inline code
            .replace(/`(.*?)`/g, "<code>$1</code>"),
        }}
      />
    );
  });
}
