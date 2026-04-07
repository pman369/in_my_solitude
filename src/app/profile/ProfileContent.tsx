"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Key, Inbox, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import MyShelfTab from "./tabs/MyShelfTab";
import MyVaultTab from "./tabs/MyVaultTab";
import MyRequestsTab from "./tabs/MyRequestsTab";
import SettingsTab from "./tabs/SettingsTab";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

type TabKey = "shelf" | "vault" | "requests" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "shelf",    label: "My Shelf",    icon: BookOpen },
  { key: "vault",    label: "The Vault",   icon: Key      },
  { key: "requests", label: "My Requests", icon: Inbox    },
  { key: "settings", label: "Settings",    icon: Settings },
];

interface Props {
  user: User;
  profile: UserProfile | null;
}

export default function ProfileContent({ user, profile }: Props) {
  const [tab, setTab] = useState<TabKey>("shelf");

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Reader";
  const initial     = displayName[0]?.toUpperCase() ?? "R";

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.05)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* ── Profile header ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-5 mb-12 pb-8"
          style={{ borderBottom: "1px solid #2A2A2A" }}
        >
          {/* Avatar */}
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid rgba(201,168,76,0.3)" }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-heading text-2xl"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "2px solid rgba(201,168,76,0.25)",
                color: "#C9A84C",
              }}
            >
              {initial}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl truncate" style={{ color: "#F0EDE6" }}>
              {displayName}
            </h1>
            <p className="text-sm truncate mt-0.5" style={{ color: "#9A9088" }}>
              {user.email}
            </p>
            {profile?.reason_joined && (
              <p className="text-xs mt-2 italic leading-relaxed line-clamp-2" style={{ color: "rgba(154,144,136,0.7)" }}>
                &ldquo;{profile.reason_joined}&rdquo;
              </p>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(154,144,136,0.5)" }}>Member since</span>
            <span className="text-xs" style={{ color: "#9A9088" }}>
              {new Date(profile?.created_at ?? user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
          </div>
        </motion.div>

        {/* ── Tab navigation ──────────────────────────────── */}
        <div
          className="flex gap-0 mb-10 rounded overflow-hidden"
          style={{ border: "1px solid #2A2A2A" }}
          role="tablist"
          aria-label="Profile sections"
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                id={`tab-${key}`}
                aria-selected={active}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm tracking-wide transition-all duration-200"
                style={{
                  background:  active ? "rgba(201,168,76,0.08)" : "transparent",
                  color:       active ? "#C9A84C" : "#9A9088",
                  borderRight: key !== "settings" ? "1px solid #2A2A2A" : "none",
                  fontWeight:  active ? 600 : 400,
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab panels ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "shelf"    && <MyShelfTab    userId={user.id} />}
            {tab === "vault"    && <MyVaultTab    userId={user.id} />}
            {tab === "requests" && <MyRequestsTab userId={user.id} />}
            {tab === "settings" && (
              <SettingsTab
                userId={user.id}
                profile={profile}
                userEmail={user.email ?? ""}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
