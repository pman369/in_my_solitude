"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { BookOpen, Key, Library } from "lucide-react";

const CATEGORIES = [
  { name: "Consciousness & Mind",     count: 42, icon: "🧠",  color: "#4F46E5", slug: "consciousness" },
  { name: "Forbidden & Real History", count: 38, icon: "🏛️",  color: "#B45309", slug: "forbidden-history" },
  { name: "Spirituality & Mysticism", count: 64, icon: "🔮",  color: "#7C3AED", slug: "spirituality" },
  { name: "Science & Cosmology",      count: 21, icon: "🌌",  color: "#1D4ED8", slug: "science" },
  { name: "Esoteric & Occult",        count: 53, icon: "⚗️",  color: "#991B1B", slug: "esoteric" },
  { name: "Law & Systems of Control", count: 18, icon: "⚖️",  color: "#374151", slug: "law" },
  { name: "Psychology & Inner Healing", count: 35, icon: "🌿", color: "#065F46", slug: "psychology" },
  { name: "Ancient Civilizations",    count: 29, icon: "🗿",  color: "#92400E", slug: "ancient" },
];

const fadeIn: Variants = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function HomeAnimations() {
  return (
    <div
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{ background: "#0D0D0D" }}
    >
      {/* ── Ambient glow ───────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.07)_0%,transparent_60%)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(124,58,237,0.04)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] text-center px-6 w-full"
      >
        <motion.span
          variants={fadeIn}
          className="text-xs uppercase tracking-[0.4em] mb-4"
          style={{ color: "#9A9088" }}
        >
          A Free Archive of Awakening Knowledge
        </motion.span>

        <motion.h1
          variants={fadeIn}
          className="font-heading text-6xl md:text-8xl lg:text-9xl tracking-tight mb-6"
          style={{
            color: "#C9A84C",
            textShadow: "0 0 60px rgba(201, 168, 76, 0.15)",
          }}
        >
          In My Solitude
        </motion.h1>

        <motion.div
          variants={fadeIn}
          className="w-20 h-px mb-8"
          style={{ background: "linear-gradient(to right, transparent, #C9A84C55, transparent)" }}
        />

        <motion.p
          variants={fadeIn}
          className="text-lg md:text-xl max-w-2xl leading-relaxed font-heading italic mb-12"
          style={{ color: "#9A9088" }}
        >
          &ldquo;Knowledge kept in the dark finds its light in solitude.&rdquo;
        </motion.p>

        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5 items-center">
          <Link
            href="/library"
            className="group flex items-center gap-2 px-8 py-4 rounded font-semibold text-sm tracking-wide transition-all duration-300"
            style={{
              background: "#C9A84C",
              color: "#0D0D0D",
              boxShadow: "0 0 20px rgba(201, 168, 76, 0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(201, 168, 76, 0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(201, 168, 76, 0.2)";
            }}
          >
            <BookOpen className="w-4 h-4" />
            Enter the Library
          </Link>
          <Link
            href="/about"
            className="text-sm uppercase tracking-[0.25em] pb-0.5 transition-colors duration-200"
            style={{ color: "#9A9088", borderBottom: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#C9A84C";
              (e.currentTarget as HTMLElement).style.borderBottomColor = "#C9A84C";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#9A9088";
              (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
            }}
          >
            About this place
          </Link>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          THE THREE TRUTHS
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="relative z-10 max-w-5xl w-full px-6 py-28"
        style={{ borderTop: "1px solid #2A2A2A" }}
      >
        <div className="grid md:grid-cols-3 gap-16">
          {[
            {
              title: "Why",
              body: "Knowledge has always been the first thing the powerful seek to control. This archive exists as an act of resistance and generosity. Not for profit. Not for prestige. For freedom.",
            },
            {
              title: "What",
              body: "Over three hundred volumes gathered across disciplines that do not speak to each other in polite academic circles but that speak constantly in the language of pattern and truth.",
            },
            {
              title: "How",
              body: "Built by one person. Free for all. No ads. No algorithms. No gatekeeper deciding what you are ready to know. Some books reside in The Vault — reserved for those who seek with care.",
            },
          ].map((item) => (
            <motion.div key={item.title} variants={fadeIn} className="flex flex-col items-center text-center">
              <h3 className="font-heading text-2xl mb-5" style={{ color: "#C9A84C" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>{item.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          LIVING NUMBERS
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="relative z-10 w-full py-14"
        style={{ background: "#141414", borderTop: "1px solid #2A2A2A", borderBottom: "1px solid #2A2A2A" }}
      >
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-16 gap-y-8 text-center">
          {[
            { stat: "312", label: "Books" },
            { stat: "10",  label: "Disciplines" },
            { stat: "0",   label: "Paywalls" },
            { stat: "1",   label: "Curator" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="font-heading text-4xl" style={{ color: "#C9A84C" }}>{item.stat}</span>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#9A9088" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          CATEGORY PORTAL
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="relative z-10 max-w-6xl w-full px-6 py-32"
      >
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl mb-4" style={{ color: "#C9A84C" }}>
            The Stacks
          </h2>
          <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "#9A9088" }}>
            Explore the disciplines that speak to each other in the language of pattern and truth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={fadeIn}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Link
                href={`/library?category=${cat.slug}`}
                className="flex flex-col h-full p-6 rounded border transition-all duration-300"
                style={{
                  background: "#141414",
                  borderColor: "#2A2A2A",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
                  (e.currentTarget as HTMLElement).style.background = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                  (e.currentTarget as HTMLElement).style.background = "#141414";
                }}
              >
                <span
                  className="text-3xl mb-4 block"
                  style={{ textShadow: `0 0 20px ${cat.color}50` }}
                >
                  {cat.icon}
                </span>
                <h4
                  className="font-heading text-base mb-2 transition-colors duration-200"
                  style={{ color: "#F0EDE6" }}
                >
                  {cat.name}
                </h4>
                <p className="text-xs mt-auto pt-4" style={{ color: "#9A9088" }}>
                  {cat.count} volumes
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          THE VAULT TEASER
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative z-10 w-full py-32 overflow-hidden"
        style={{ borderTop: "1px solid rgba(153,27,27,0.2)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(153,27,27,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            variants={fadeIn}
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-8"
            style={{
              background: "rgba(153,27,27,0.1)",
              border: "1px solid rgba(153,27,27,0.3)",
              color: "#991B1B",
            }}
          >
            <Key className="w-6 h-6" />
          </motion.div>

          <motion.h2
            variants={fadeIn}
            className="font-heading text-5xl mb-6"
            style={{
              color: "#F0EDE6",
              textShadow: "0 0 40px rgba(153,27,27,0.3)",
            }}
          >
            The Vault
          </motion.h2>

          <motion.p variants={fadeIn} className="text-base italic mb-4 leading-relaxed" style={{ color: "#9A9088" }}>
            These books are not restricted because they are dangerous.
            They are here because they require context, discernment, and readiness.
          </motion.p>
          <motion.p variants={fadeIn} className="text-sm mb-12" style={{ color: "#9A9088" }}>
            Request access with honesty. The curator reviews every request personally.
          </motion.p>

          <motion.div variants={fadeIn}>
            <Link
              href="/vault"
              className="inline-block px-8 py-3 rounded text-sm tracking-widest transition-all duration-300"
              style={{
                border: "1px solid rgba(153,27,27,0.5)",
                color: "#F0EDE6",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(153,27,27,0.15)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(153,27,27,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              Enter the Vault
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          REQUEST DESK TEASER
      ══════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="relative z-10 max-w-3xl w-full mx-auto px-6 py-28 text-center"
        style={{ borderTop: "1px solid #2A2A2A" }}
      >
        <Library className="w-10 h-10 mx-auto mb-6" style={{ color: "rgba(201,168,76,0.6)" }} />
        <h2 className="font-heading text-4xl mb-4" style={{ color: "#C9A84C" }}>
          The Request Desk
        </h2>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: "#9A9088" }}>
          This library grows with the community. Ask for what you need. Share what you have.
          Can&apos;t find what you&apos;re searching for? The curator will try to source it.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/desk"
            className="px-6 py-3 rounded text-sm tracking-wide transition-all duration-300"
            style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
            }}
          >
            Request a Book
          </Link>
          <Link
            href="/desk"
            className="px-6 py-3 rounded text-sm tracking-wide transition-all duration-300"
            style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
            }}
          >
            Donate a Book
          </Link>
        </div>
      </motion.section>

    </div>
  );
}
