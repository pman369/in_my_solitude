"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  onSend:       (message: string) => void;
  disabled?:    boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea up to 3 lines (≈120px)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [value]);

  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Ask the librarian…"}
        disabled={disabled}
        aria-label="Message to The Librarian"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="send-btn"
      >
        <ArrowUp style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}
