"use client";

import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type UserProfile =
  Database["public"]["Tables"]["user_profiles"]["Row"];

export interface UseUserReturn {
  /** Supabase Auth user object — null when signed out */
  user: User | null;
  /** Extended profile row from user_profiles — null when signed out or not yet loaded */
  profile: UserProfile | null;
  /** True on the very first load before auth state is known */
  loading: boolean;
  /** Convenience boolean */
  isAuthenticated: boolean;
  /** Convenience boolean */
  isAdmin: boolean;
}

/**
 * useUser
 *
 * Subscribes to Supabase auth state changes and keeps the current user and
 * their extended profile in sync. Use anywhere in Client Components that need
 * to know who is signed in (Navbar, profile gate components, etc.).
 *
 * Singleton pattern: a single Supabase client is shared across the hook to
 * avoid creating multiple auth listeners in the same browser session.
 */
export function useUser(): UseUserReturn {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable client ref so the subscription isn't torn down / re-created on renders
  const supabase = useRef(createClient()).current;

  /**
   * Fetches the user_profiles row for a given user id.
   * Returns null gracefully if no row exists yet (e.g. trigger hasn't fired).
   */
  async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows — expected if the db trigger hasn't created the row yet
      if (error.code !== "PGRST116") {
        console.warn("[useUser] profile fetch error:", error.message);
      }
      return null;
    }
    return data;
  }

  useEffect(() => {
    let cancelled = false;

    // 1. Resolve the current session immediately (avoids a flash of signed-out state)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      setUser(user);
      if (user) {
        const p = await fetchProfile(user.id);
        if (!cancelled) setProfile(p);
      }
      setLoading(false);
    });

    // 2. Subscribe to future auth changes (sign-in, sign-out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          const p = await fetchProfile(nextUser.id);
          if (!cancelled) setProfile(p);
        } else {
          setProfile(null);
        }

        // Only keep loading true until the very first resolution
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "admin",
  };
}
