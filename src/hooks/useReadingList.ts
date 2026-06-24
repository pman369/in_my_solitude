"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export interface ReadingListEntry {
  id: string;
  book_id: string;
  status: "want_to_read" | "reading" | "finished";
  added_at: string;
  updated_at: string;
}

export interface UseReadingListReturn {
  /** Reading list entries for the current user */
  entries: ReadingListEntry[];
  /** True if the given bookId is in the reading list */
  isSaved: boolean;
  /** Toggle save/unsave for the given bookId */
  toggle: () => Promise<void>;
  /** Update the status of the given bookId */
  setStatus: (status: ReadingListEntry["status"]) => Promise<void>;
  /** True while any operation is in flight */
  loading: boolean;
  /** True while the initial list is being fetched */
  fetching: boolean;
}

/**
 * useReadingList(bookId?)
 *
 * Subscribes to the authenticated user's reading_list table.
 * - If `bookId` is provided, `isSaved` and `toggle` operate on that specific book.
 * - Without `bookId`, only `entries` and `fetching` are meaningful.
 *
 * Usage:
 *   const { isSaved, toggle, loading } = useReadingList(book.id);
 *   const { entries, fetching }        = useReadingList();
 */
export function useReadingList(bookId?: string): UseReadingListReturn {
  const { user, isAuthenticated } = useUser();
  const supabase = useRef(createClient()).current;

  const [entries,  setEntries]  = useState<ReadingListEntry[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch the entire reading list for this user
  const fetchList = useCallback(async () => {
    if (!user) { setEntries([]); setFetching(false); return; }
    setFetching(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("reading_list")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }) as { data: ReadingListEntry[] | null; error: { message: string } | null };
    if (error) {
      console.error("Failed to fetch reading list:", error.message);
    }
    setEntries(data ?? []);
    setFetching(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Subscribe to realtime changes on the reading_list table for this user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`reading_list:${user.id}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "reading_list",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchList(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchList]);

  const isSaved = bookId ? entries.some((e) => e.book_id === bookId) : false;

  const toggle = useCallback(async () => {
    if (!isAuthenticated || !bookId || !user) return;
    setLoading(true);
    try {
      if (isSaved) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("reading_list")
          .delete()
          .eq("user_id", user.id)
          .eq("book_id", bookId);
        if (error) console.error("Failed to remove from reading list:", error.message);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("reading_list") as any)
          .insert({ user_id: user.id, book_id: bookId, status: "want_to_read" });
        if (error) console.error("Failed to add to reading list:", error.message);
      }
      await fetchList();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, bookId, user, isSaved, supabase, fetchList]);

  const setStatus = useCallback(async (status: ReadingListEntry["status"]) => {
    if (!isAuthenticated || !bookId || !user) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("reading_list") as any)
        .upsert(
          { user_id: user.id, book_id: bookId, status, updated_at: new Date().toISOString() },
          { onConflict: "user_id,book_id" }
        );
      if (error) console.error("Failed to update reading status:", error.message);
      await fetchList();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, bookId, user, supabase, fetchList]);

  return { entries, isSaved, toggle, setStatus, loading, fetching };
}
