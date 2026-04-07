"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  sources?:    { title: string; url: string }[];
  isStreaming?: boolean;
}

interface UseChatOptions {
  contextPage?:       string;
  contextBookId?:     string;
  contextBookTitle?:  string;
  contextBookAuthor?: string;
}

export function useLibrarianChat(options: UseChatOptions = {}) {
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [sessionId,  setSessionId]  = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [isOpen,     setIsOpen]     = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /** Create a Supabase session record and show the greeting message */
  const initSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contextPage:    options.contextPage,
        contextBookId:  options.contextBookId,
      }),
    });
    const json = await res.json();
    const newId = json.sessionId as string;
    setSessionId(newId);

    // Inject Librarian greeting
    setMessages([{
      id:      crypto.randomUUID(),
      role:    "assistant",
      content: `Welcome, seeker. I am The Librarian — your guide through this archive. Whether you are searching for a book, trying to understand an idea, or simply wandering in the questions — I am here.\n\nWhat is on your mind?`,
    }]);

    return newId;
  }, [sessionId, options.contextPage, options.contextBookId]);

  const openChat = useCallback(async () => {
    setIsOpen(true);
    await initSession();
  }, [initSession]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);

    const sid = sessionId ?? await initSession();

    const userMsg: ChatMessage = {
      id:      crypto.randomUUID(),
      role:    "user",
      content: content.trim(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id:          assistantId,
      role:        "assistant",
      content:     "",
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    setIsStreaming(true);

    // Build messages for API (exclude the empty streaming placeholder)
    const apiMessages = [...messages, userMsg].map(m => ({
      role:    m.role,
      content: m.content,
    }));

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          messages:           apiMessages,
          sessionId:          sid,
          contextPage:        options.contextPage,
          contextBookTitle:   options.contextBookTitle,
          contextBookAuthor:  options.contextBookAuthor,
        }),
      });

      if (!response.ok) {
        const { error: errMsg } = await response.json();
        throw new Error(errMsg ?? "The Librarian encountered an unexpected issue.");
      }

      // Parse SSE stream
      const reader  = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent  = "";
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
            const delta  = parsed.choices?.[0]?.delta?.content ?? "";
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

      // Finalize — remove streaming flag, attach citations
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content:     fullContent,
                isStreaming: false,
                sources:     citations.map((c: { title?: string; url: string }) => ({
                  title: c.title ?? (() => { try { return new URL(c.url).hostname; } catch { return c.url; } })(),
                  url:   c.url,
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
  }, [messages, sessionId, isLoading, initSession, options]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    isOpen,
    error,
    sendMessage,
    openChat,
    closeChat,
    clearChat,
  };
}
