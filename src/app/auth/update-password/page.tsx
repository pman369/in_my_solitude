"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Moon, Lock, ArrowRight, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => router.push("/library"), 2500);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D0D0D" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.05)_0%,transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" style={{ color: "#C9A84C" }} />
            <span className="font-heading text-lg" style={{ color: "#C9A84C" }}>In My Solitude</span>
          </Link>
          <h1 className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>Set a new passage</h1>
          <p className="text-sm" style={{ color: "#9A9088" }}>
            {done ? "Password updated. Returning to the library…" : "Choose a new password for your account."}
          </p>
        </div>

        <div className="rounded border p-8" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
          {done ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
              >
                <Check className="w-6 h-6" style={{ color: "#C9A84C" }} />
              </div>
              <p className="text-sm" style={{ color: "#9A9088" }}>Your password has been updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label="Update password form" className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  />
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded text-sm"
                  style={{ background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.3)", color: "#F87171" }}
                  role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
                style={{ background: "#C9A84C", color: "#0D0D0D" }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <> Update Password <ArrowRight className="w-4 h-4" /> </>
                }
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
