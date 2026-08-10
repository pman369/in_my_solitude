"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/shared/ErrorAlert";

const READING_INTERESTS = [
  "Consciousness & Mind",
  "Spirituality & Mysticism",
  "Forbidden & Real History",
  "Esoteric & Occult",
  "Science & Cosmology",
  "Psychology & Inner Healing",
  "Law & Systems of Control",
  "Ancient Civilizations",
];

const fadeSlide = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.25 } },
};

export default function RegisterPage() {
  const supabase = createClient();

  const [step, setStep]              = useState(1);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState("");

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");

  // Step 2
  const [reason, setReason]          = useState("");
  const [interests, setInterests]    = useState<string[]>([]);

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Please tell us why you're here."); return; }
    setError("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name:    displayName,
            reason_joined:   reason,
            reading_focus:   interests,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (data.user) {
        setStep(3);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#0D0D0D",
    border: "1px solid #2A2A2A",
    color: "#F0EDE6",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "#0D0D0D" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.05)_0%,transparent_60%)]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" style={{ color: "#C9A84C" }} />
            <span className="font-heading text-lg" style={{ color: "#C9A84C" }}>In My Solitude</span>
          </Link>
          <h1 className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>
            {step < 3 ? "Join the library" : "Welcome, seeker"}
          </h1>
          <p className="text-sm" style={{ color: "#9A9088" }}>
            {step === 1 && "Create your account to begin."}
            {step === 2 && "Tell us a little about yourself."}
            {step === 3 && "Your account has been created. Check your email to confirm."}
          </p>
        </div>

        {/* Progress dots */}
        {step < 3 && (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: step === s ? "24px" : "8px",
                  height: "8px",
                  background: step >= s ? "#C9A84C" : "#2A2A2A",
                }}
              />
            ))}
          </div>
        )}

        <div className="rounded border overflow-hidden" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Account Details ───────────────── */}
            {step === 1 && (
              <motion.form
                key="step1"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={(e) => {
  e.preventDefault();
  if (!displayName || !email || !password) return;
  const pwdPattern = /^(?=.*\d)(?=.*[!@#$%^&*])/;
  if (!pwdPattern.test(password)) { setError("Password must contain at least one digit and one special character."); return; }
  setStep(2);
}}
                className="p-8 space-y-5"
                aria-label="Account details"
                noValidate
              >
                <div>
                  <label htmlFor="displayName" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="How shall we call you?"
                      className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A9088" }} />
                    <input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      className="w-full pl-10 pr-4 py-3 rounded text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!displayName || !email || password.length < 8}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
                  style={{ background: "#C9A84C", color: "#0D0D0D" }}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs pt-2" style={{ color: "#9A9088" }}>
                  Already a reader?{" "}
                  <Link href="/auth/login" style={{ color: "#C9A84C" }}>Sign in</Link>
                </p>
              </motion.form>
            )}

            {/* ── STEP 2: About You ─────────────────────── */}
            {step === 2 && (
              <motion.form
                key="step2"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleRegister}
                className="p-8 space-y-6"
                aria-label="About you"
                noValidate
              >
                <div>
                  <label htmlFor="reason" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
                    Why are you here?
                  </label>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "#9A9088" }}>
                    This isn&apos;t a trick question. What draws you to a library like this?
                    The curator reads every answer personally.
                  </p>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="I've been looking for a place that doesn't flinch..."
                    className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 resize-none"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#9A9088" }}>
                    Areas of interest (optional)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {READING_INTERESTS.map((interest) => {
                      const selected = interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded text-xs text-left transition-all duration-200"
                          style={{
                            background:   selected ? "rgba(201,168,76,0.1)" : "#0D0D0D",
                            border:       `1px solid ${selected ? "rgba(201,168,76,0.4)" : "#2A2A2A"}`,
                            color:        selected ? "#C9A84C" : "#9A9088",
                          }}
                          aria-pressed={selected}
                        >
                          {selected && <Check className="w-3 h-3 flex-shrink-0" />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <ErrorAlert message={error} variant="inline" />}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-3 rounded text-sm transition-all duration-200"
                    style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !reason.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
                    style={{ background: "#C9A84C", color: "#0D0D0D" }}
                  >
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <> Create Account <ArrowRight className="w-4 h-4" /> </>
                    }
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 3: Success ───────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                className="p-8 text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
                >
                  <Check className="w-7 h-7" style={{ color: "#C9A84C" }} />
                </div>
                <p className="text-sm leading-relaxed mb-8" style={{ color: "#9A9088" }}>
                  A confirmation has been sent to <strong style={{ color: "#F0EDE6" }}>{email}</strong>.
                  Open it to verify your account and enter the library.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-semibold tracking-wide transition-all duration-300"
                  style={{ background: "#C9A84C", color: "#0D0D0D" }}
                >
                  Back to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
