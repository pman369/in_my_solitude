"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface ChatMessage {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  sources?:    { title: string; url: string }[];
  isStreaming?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isOpen: boolean;
  error: string | null;
  sessionId: string | null;
  
  // Context for the chat
  bookContext: {
    id?: string;
    title?: string;
    author?: string;
  };
  
  // Actions
  openChat: () => Promise<void>;
  closeChat: () => void;
  clearChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  setBookContext: (context: { id?: string; title?: string; author?: string }) => void;
}

const LibrarianChatContext = createContext<ChatContextType | undefined>(undefined);

export function LibrarianChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [bookContext, setBookContext] = useState<{ id?: string; title?: string; author?: string }>({});
  
  const abortRef = useRef<AbortController | null>(null);

  const initSession = useCallback(async (currentContext: { id?: string; page?: string }): Promise<string> => {
    if (sessionId) return sessionId;

    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextPage: currentContext.page,
          contextBookId: currentContext.id,
        }),
      });
      const json = await res.json();
      const newId = json.sessionId as string;
      setSessionId(newId);

      // Inject Librarian greeting
      setMessages([{
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Welcome, seeker. I am The Librarian — your guide through this archive. Whether you are searching for a book, trying to understand an idea, or simply wandering in the questions — I am here.\n\nWhat is on your mind?`,
      }]);

      return newId;
    } catch (err) {
      console.error("Failed to init chat session:", err);
      throw err;
    }
  }, [sessionId]);

  const openChat = useCallback(async () => {
    setIsOpen(true);
    if (!sessionId) {
      await initSession({ id: bookContext.id, page: pathname });
    }
  }, [sessionId, bookContext.id, pathname, initSession]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);

    let sid = sessionId;
    if (!sid) {
      try {
        sid = await initSession({ id: bookContext.id, page: pathname });
      } catch {
        setError("Could not establish a connection with The Librarian.");
        return;
      }
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const currentMessages = [...messages, userMsg];
    setMessages([...currentMessages, assistantMsg]);
    setIsLoading(true);
    setIsStreaming(true);

    const apiMessages = currentMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: sid,
          contextPage: pathname,
          contextBookTitle: bookContext.title,
          contextBookAuthor: bookContext.author,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "The Librarian encountered an unexpected issue.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let citations: any[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const raw = line.replace("data: ", "").trim();
          if (raw === "[DONE]") break;

          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            fullContent += delta;

            if (parsed.citations) citations = parsed.citations;

            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              )
            );
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Finalize
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: fullContent,
                isStreaming: false,
                sources: citations.map((c: { title?: string; url: string }) => ({
                  title: c.title ?? (() => { try { return new URL(c.url).hostname; } catch { return c.url; } })(),
                  url: c.url,
                })),
              }
            : m
        )
      );
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === "AbortError") return;

      const msg = e.message ?? "The Librarian encountered an unexpected issue. Please try again.";
      setError(msg);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages, sessionId, isLoading, initSession, bookContext, pathname]);

  return (
    <LibrarianChatContext.Provider value={{
      messages, isLoading, isStreaming, isOpen, error, sessionId, bookContext,
      openChat, closeChat, clearChat, sendMessage, setBookContext
    }}>
      {children}
    </LibrarianChatContext.Provider>
  );
}

export function useLibrarian() {
  const context = useContext(LibrarianChatContext);
  if (context === undefined) {
    throw new Error("useLibrarian must be used within a LibrarianChatProvider");
  }
  return context;
}
