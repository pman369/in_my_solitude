"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Moon, BookOpen, Key, ArrowRight } from "lucide-react";

const fadeIn: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const HOUSE_RULES = [
  {
    heading: "Reading is free",
    body: "Every book in the open stacks can be read in-browser at no cost, with no account required. Downloads require a free account to prevent bulk harvesting.",
  },
  {
    heading: "The Vault requires honesty",
    body: "Restricted books are not hidden because they are dangerous. They are curated because they require context and readiness. A brief, honest request is reviewed personally. Requests that feel careless or extractive will be declined.",
  },
  {
    heading: "Donated books are reviewed",
    body: "Every donated PDF is read (or at least meaningfully sampled) before being added to the catalog. Quality and relevance matter. The library is not a dumping ground.",
  },
  {
    heading: "No monetisation — ever",
    body: "This library will never run ads, sell data, or introduce a subscription. If that ever changes, the current version will be forked and kept free.",
  },
  {
    heading: "Share the library, not just the files",
    body: "If a book matters to you, share the library itself. Help it reach the people who need it. The goal is not to distribute files — it is to build a place where seekers can find each other and the knowledge they need.",
  },
];

export default function AboutContent() {
  return (
    <div className="relative min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-36">

        {/* ── Brand mark ──────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-20"
        >
          <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
            <Moon className="w-5 h-5" style={{ color: "#C9A84C" }} />
            <span className="text-xs uppercase tracking-[0.35em]" style={{ color: "#9A9088" }}>
              In My Solitude — About This Place
            </span>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="font-heading text-5xl md:text-6xl mb-6"
            style={{ color: "#C9A84C" }}
          >
            The Manifesto
          </motion.h1>

          <motion.div
            variants={fadeIn}
            className="w-16 h-px"
            style={{ background: "linear-gradient(to right, #C9A84C55, transparent)" }}
          />
        </motion.div>

        {/* ── WHY ─────────────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="font-heading text-3xl mb-6" style={{ color: "#F0EDE6" }}>
            Why this library exists
          </motion.h2>
          <motion.div variants={fadeIn} className="space-y-5 text-base leading-relaxed" style={{ color: "#9A9088" }}>
            <p>
              Knowledge has always been the first thing the powerful seek to control. Entire categories
              of human understanding — real history, consciousness science, esoteric traditions,
              suppressed archaeology — have been buried, ridiculed, or locked behind paywalls and
              institutional gatekeeping.
            </p>
            <p>
              This library exists as an act of resistance and generosity. Not for profit. Not for
              prestige. For freedom.
            </p>
            <p>
              It was assembled book by book during one person's profound journey through a dark night
              of the soul. Every title in this archive played a role in that path toward consciousness,
              clarity, and liberation from mass mental conditioning. It is offered now because knowledge
              kept in the dark finds its light in solitude — and because solitude should not be
              suffered alone.
            </p>
          </motion.div>
        </motion.section>

        <div className="mb-20 w-full h-px" style={{ background: "#2A2A2A" }} />

        {/* ── WHAT ────────────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="font-heading text-3xl mb-6" style={{ color: "#F0EDE6" }}>
            What lives here
          </motion.h2>
          <motion.p variants={fadeIn} className="text-base leading-relaxed mb-8" style={{ color: "#9A9088" }}>
            A living, growing archive across disciplines that mainstream academia rarely touches
            honestly. These categories do not speak to each other in polite academic circles —
            but they speak constantly in the language of pattern and truth.
          </motion.p>
          <motion.ul variants={fadeIn} className="space-y-3">
            {[
              "The real story of human history and ancient civilisations",
              "The science of consciousness and the nature of mind",
              "Esoteric, mystical, and spiritual traditions from across cultures",
              "Suppressed and forbidden knowledge — the books they don't want you reading",
              "Physics, cosmology, and the deeper nature of reality",
              "Law, rights, and the hidden architecture of systems of control",
              "Psychology of awakening, healing, and breaking free from conditioning",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#9A9088" }}>
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#C9A84C", opacity: 0.6 }}
                />
                {item}
              </li>
            ))}
          </motion.ul>
        </motion.section>

        <div className="mb-20 w-full h-px" style={{ background: "#2A2A2A" }} />

        {/* ── HOW ─────────────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="font-heading text-3xl mb-6" style={{ color: "#F0EDE6" }}>
            How it works
          </motion.h2>
          <motion.div variants={fadeIn} className="space-y-5 text-base leading-relaxed" style={{ color: "#9A9088" }}>
            <p>
              Built by one person. Free for all. No ads. No algorithms. No gatekeeper deciding what
              you are ready to know.
            </p>
            <p>
              Certain books are held in <strong style={{ color: "#F0EDE6" }}>The Vault</strong> — a
              restricted section for materials that carry significant weight. Access is not blocked out
              of fear — it is managed out of care. A brief, honest request is all that is required. The
              curator reads every one personally.
            </p>
            <p>
              The library grows with the community. You can request books that are missing. You can
              donate books you believe belong here. You can simply read, in solitude, and find your
              own way home.
            </p>
          </motion.div>
        </motion.section>

        <div className="mb-20 w-full h-px" style={{ background: "#2A2A2A" }} />

        {/* ── CURATOR'S LETTER ────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>
            A letter from the curator
          </motion.h2>
          <motion.p variants={fadeIn} className="text-xs uppercase tracking-widest mb-8" style={{ color: "#9A9088" }}>
            For whoever finds their way here
          </motion.p>
          <motion.div
            variants={fadeIn}
            className="rounded p-8 border"
            style={{ background: "#141414", borderColor: "#2A2A2A" }}
          >
            <div className="space-y-5 text-sm leading-loose font-heading italic" style={{ color: "#9A9088" }}>
              <p>
                There was a period of my life when the only reliable compass I had was a book.
                Not a person. Not a community. Not a faith tradition as I had known it. A book.
              </p>
              <p>
                The right book, at the right moment, can do something that very few encounters in life
                can do — it can make you feel less alone in your understanding of how strange and
                terrible and beautiful this world actually is. It can confirm a suspicion you were
                afraid to voice. It can give you a framework for something you felt but could not
                articulate.
              </p>
              <p>
                This library is every book that did that for me, and every book that I believe
                could do it for someone else.
              </p>
              <p>
                I built it in solitude. I offer it freely. I ask only that you bring honesty — to
                the texts, to the ideas, and to yourself.
              </p>
              <p style={{ color: "#C9A84C" }}>— The Curator</p>
            </div>
          </motion.div>
        </motion.section>

        <div className="mb-20 w-full h-px" style={{ background: "#2A2A2A" }} />

        {/* ── HOUSE RULES ─────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-24"
        >
          <motion.h2 variants={fadeIn} className="font-heading text-3xl mb-8" style={{ color: "#F0EDE6" }}>
            The rules of the house
          </motion.h2>
          <motion.div variants={fadeIn} className="space-y-6">
            {HOUSE_RULES.map((rule, i) => (
              <div
                key={rule.heading}
                className="flex gap-5 p-5 rounded border"
                style={{ background: "#141414", borderColor: "#2A2A2A" }}
              >
                <span
                  className="font-heading text-lg flex-shrink-0 w-7 mt-0.5"
                  style={{ color: "#C9A84C", opacity: 0.5 }}
                >
                  {i + 1}.
                </span>
                <div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: "#F0EDE6" }}>
                    {rule.heading}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>
                    {rule.body}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="flex flex-col sm:flex-row gap-4 pt-4"
          style={{ borderTop: "1px solid #2A2A2A" }}
        >
          <motion.div variants={fadeIn}>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded font-semibold text-sm tracking-wide transition-all duration-300"
              style={{ background: "#C9A84C", color: "#0D0D0D" }}
            >
              <BookOpen className="w-4 h-4" />
              Enter the Library
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded text-sm tracking-wide transition-all duration-300"
              style={{ border: "1px solid rgba(153,27,27,0.4)", color: "#9A9088" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,27,27,0.7)";
                (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,27,27,0.4)";
                (e.currentTarget as HTMLElement).style.color = "#9A9088";
              }}
            >
              <Key className="w-4 h-4" />
              Enter the Vault
            </Link>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
