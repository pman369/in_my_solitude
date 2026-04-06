"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Moon, Mail, ArrowLeft, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) { setError(error.message); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0D0D0D" }}
    >
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
          <h1 className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>Reset your passage</h1>
          <p className="text-sm" style={{ color: "#9A9088" }}>
            {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        <div className="rounded border p-8" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
          {sent ? (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
              >
                <Check className="w-5 h-5" style={{ color: "#C9A84C" }} />
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#9A9088" }}>
                A reset link was sent to <strong style={{ color: "#F0EDE6" }}>{email}</strong>.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm transition-colors duration-200"
                style={{ color: "#9A9088" }}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label="Password reset form">
              <label htmlFor="reset-email" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                Email Address
              </label>
              <div className="relative mb-5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                  style={{ background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded text-sm"
                  style={{ background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.3)", color: "#F87171" }}
                  role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300"
                style={{ background: "#C9A84C", color: "#0D0D0D" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </button>

              <div className="text-center mt-5">
                <Link href="/auth/login"
                  className="inline-flex items-center gap-1 text-xs transition-colors duration-200"
                  style={{ color: "#9A9088" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
