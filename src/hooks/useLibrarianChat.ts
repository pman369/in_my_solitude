"use client";

import { useEffect } from "react";
import { useLibrarian } from "@/components/chat/LibrarianProvider";

interface UseChatOptions {
  contextPage?:       string;
  contextBookId?:     string;
  contextBookTitle?:  string;
  contextBookAuthor?: string;
}

export function useLibrarianChat(options: UseChatOptions = {}) {
  const librarian = useLibrarian();

  // Sync page-specific context to the global librarian state
  useEffect(() => {
    if (options.contextBookTitle) {
      librarian.setBookContext({
        id:     options.contextBookId,
        title:  options.contextBookTitle,
        author: options.contextBookAuthor,
      });
    } else {
      librarian.setBookContext({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.contextBookId, options.contextBookTitle, options.contextBookAuthor]);

  return {
    messages:     librarian.messages,
    isLoading:    librarian.isLoading,
    isStreaming:  librarian.isStreaming,
    isOpen:       librarian.isOpen,
    error:        librarian.error,
    sendMessage:  librarian.sendMessage,
    openChat:     librarian.openChat,
    closeChat:    librarian.closeChat,
    clearChat:    librarian.clearChat,
  };
}
