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
  /** True if user exists in the newer admin_profiles registry */
  isAdminProfile: boolean;
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
  const [isAdminTable, setIsAdminTable] = useState(false);
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

  async function checkAdminTable(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    return !!data;
  }

  useEffect(() => {
    let cancelled = false;

    // 1. Resolve the current session immediately (avoids a flash of signed-out state)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      setUser(user);
      if (user) {
        const [p, isAdm] = await Promise.all([
          fetchProfile(user.id),
          checkAdminTable(user.id)
        ]);
        if (!cancelled) {
          setProfile(p);
          setIsAdminTable(isAdm);
        }
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
          const [p, isAdm] = await Promise.all([
            fetchProfile(nextUser.id),
            checkAdminTable(nextUser.id)
          ]);
          if (!cancelled) {
            setProfile(p);
            setIsAdminTable(isAdm);
          }
        } else {
          setProfile(null);
          setIsAdminTable(false);
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
    isAdmin: profile?.role === "admin" || profile?.role === "sub_admin" || isAdminTable,
    isAdminProfile: isAdminTable,
  };
}
