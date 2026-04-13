"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Moon, Mail, Lock, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic" | "admin";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next   = params.get("next") ?? "/library";

  const [mode, setMode]         = useState<Mode>("password");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [sent, setSent]         = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "password" || mode === "admin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        
        // If signing in as admin, force go to /admin if they actually have the role
        // The middleware or useUser hook will handle the actual role check,
        // but we can try to redirect them there.
        const target = mode === "admin" ? "/admin" : next;
        router.push(target);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
        });
        if (error) { setError(error.message); return; }
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0D0D0D" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.05)_0%,transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group" aria-label="Home">
            <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" style={{ color: "#C9A84C" }} />
            <span className="font-heading text-lg" style={{ color: "#C9A84C" }}>In My Solitude</span>
          </Link>
          <h1 className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>
            {sent ? "Check your inbox" : "Return to the library"}
          </h1>
          <p className="text-sm" style={{ color: "#9A9088" }}>
            {sent
              ? "A passage has been sent. Follow it back."
              : "Sign in to access your shelf and the vault."}
          </p>
        </div>

        {sent ? (
          /* ── Magic link sent state ──────────────────── */
          <div
            className="rounded border p-8 text-center"
            style={{ background: "#141414", borderColor: "#2A2A2A" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
              <Mail className="w-5 h-5" style={{ color: "#C9A84C" }} />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9A9088" }}>
              A magic link was sent to <strong style={{ color: "#F0EDE6" }}>{email}</strong>.
              Open it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm transition-colors duration-200"
              style={{ color: "#9A9088" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Login form ─────────────────────────────── */
          <div
            className="rounded border p-8"
            style={{ background: "#141414", borderColor: mode === "admin" ? "rgba(201,168,76,0.3)" : "#2A2A2A" }}
          >
            {/* Mode toggle */}
            <div
              className="flex rounded overflow-hidden mb-8 text-sm"
              style={{ border: "1px solid #2A2A2A" }}
            >
              {(["password", "magic", "admin"] as Mode[]).map((m) => {
                const isAdmin = m === "admin";
                const isMagic = m === "magic";
                const isPassword = m === "password";
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(""); }}
                    className="flex-1 py-2.5 transition-all duration-300 text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-1.5"
                    style={{
                      background: mode === m ? (isAdmin ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)") : "transparent",
                      color:      mode === m ? "#C9A84C" : "#9A9088",
                      borderRight: m !== "admin" ? "1px solid #2A2A2A" : "none",
                    }}
                  >
                    {isAdmin && <ShieldAlert className="w-3 h-3" />}
                    {m === "password" ? "Pass" : m === "magic" ? "Magic" : "Admin"}
                  </button>
                );
              })}
            </div>

            {mode === "admin" && (
              <div className="mb-6 p-3 rounded bg-[#C9A84C]/5 border border-[#C9A84C]/20 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed text-[#9A9088] uppercase tracking-wider">
                  You are entering the <strong className="text-[#C9A84C]">Curator Portal</strong>. Only registered archivist credentials will be granted passage.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate aria-label="Sign in form">
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#9A9088" }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                    style={{
                      background: "#0D0D0D",
                      border: "1px solid #2A2A2A",
                      color: "#F0EDE6",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  />
                </div>
              </div>

              {/* Password (only in password mode) */}
              {mode === "password" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="text-xs uppercase tracking-widest"
                      style={{ color: "#9A9088" }}>
                      Password
                    </label>
                    <Link href="/auth/reset-password"
                      className="text-xs transition-colors duration-200"
                      style={{ color: "#9A9088" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                      style={{
                        background: "#0D0D0D",
                        border: "1px solid #2A2A2A",
                        color: "#F0EDE6",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                </div>
              )}

              {mode === "magic" && (
                <p className="text-xs mb-6 leading-relaxed" style={{ color: "#9A9088" }}>
                  We&apos;ll send a secure link to your email. Click it to sign in — no password required.
                </p>
              )}

              {/* Error */}
              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded text-sm"
                  style={{ background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.3)", color: "#F87171" }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300"
                style={{
                  background: loading ? "rgba(201,168,76,0.5)" : "#C9A84C",
                  color: "#0D0D0D",
                }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>
                      {mode === "admin" ? "Authenticate Curator" : mode === "password" ? "Sign In" : "Send Magic Link"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                }
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-xs mt-6" style={{ color: "#9A9088" }}>
              New to the library?{" "}
              <Link
                href="/auth/register"
                className="transition-colors duration-200"
                style={{ color: "#C9A84C" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Request access
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
