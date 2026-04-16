#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 *  In My Solitude — Bulk Book Import Script
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    node scripts/bulk-import.mjs --csv books.csv --covers ./covers --pdfs ./pdfs
 *
 *  Flags:
 *    --csv      Path to the CSV file (required)
 *    --covers   Directory containing cover images (required)
 *    --pdfs     Directory containing PDF files (required)
 *    --dry-run  Validate everything without uploading or inserting
 *    --delay    Milliseconds between each book upload (default: 300)
 *
 *  See scripts/README.md for full documentation and CSV format.
 * ═══════════════════════════════════════════════════════════════════
 */

import { readFile, readdir, stat, writeFile } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import { join, resolve, extname, basename } from "path";
import { createClient } from "@supabase/supabase-js";

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  gold:   "\x1b[33m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  grey:   "\x1b[90m",
  white:  "\x1b[37m",
};

const log   = (msg) => console.log(msg);
const info  = (msg) => console.log(`${C.cyan}  ℹ${C.reset}  ${msg}`);
const ok    = (msg) => console.log(`${C.green}  ✔${C.reset}  ${msg}`);
const fail  = (msg) => console.log(`${C.red}  ✘${C.reset}  ${msg}`);
const warn  = (msg) => console.log(`${C.gold}  ⚠${C.reset}  ${msg}`);
const dim   = (msg) => console.log(`${C.grey}     ${msg}${C.reset}`);

// ─── Arg parsing ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true; // boolean flag
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

// ─── .env.local loader ───────────────────────────────────────────────────────
async function loadEnv(projectRoot) {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) throw new Error(`No .env.local found at ${envPath}`);
  const raw = await readFile(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    // Strip inline comments and surrounding quotes
    let val = trimmed.slice(eqIdx + 1).split("#")[0].trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// ─── CSV parser (handles quoted fields containing commas/newlines) ────────────
function parseCsv(content) {
  const rows = [];
  let headers = null;
  let current = "";
  let inQuotes = false;
  let fields = [];

  const chars = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i <= chars.length; i++) {
    const ch = i < chars.length ? chars[i] : "\n"; // sentinel newline at end

    if (ch === '"') {
      if (inQuotes && chars[i + 1] === '"') {
        current += '"';
        i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else if (ch === "\n" && !inQuotes) {
      fields.push(current.trim());
      current = "";
      if (fields.some(f => f !== "")) {
        if (!headers) {
          headers = fields.map(h => h.toLowerCase().replace(/\s+/g, "_"));
        } else {
          const row = {};
          headers.forEach((h, idx) => { row[h] = fields[idx] ?? ""; });
          rows.push(row);
        }
      }
      fields = [];
    } else {
      current += ch;
    }
  }

  return rows;
}

// ─── Slugify for filename matching ───────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ─── Find a file in a directory (case-insensitive, tries common extensions) ─
async function findFile(dir, stem, allowedExts) {
  try {
    const files = await readdir(dir);
    // Exact match first
    for (const f of files) {
      if (f === stem) return join(dir, f);
    }
    // Case-insensitive + extension-flexible
    const stemLower = stem.toLowerCase();
    const stemNoExt = stemLower.replace(/\.[^.]+$/, "");
    for (const f of files) {
      const fLower = f.toLowerCase();
      const fNoExt = fLower.replace(/\.[^.]+$/, "");
      const fExt   = extname(f).slice(1).toLowerCase();
      if (fNoExt === stemNoExt && allowedExts.includes(fExt)) {
        return join(dir, f);
      }
    }
  } catch {
    // dir doesn't exist
  }
  return null;
}

// ─── Read file as Uint8Array (for Supabase storage upload) ──────────────────
async function readFileBytes(filePath) {
  const buf = await readFile(filePath);
  return new Uint8Array(buf);
}

// ─── Friendly file size ───────────────────────────────────────────────────────
function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function progressBar(done, total, width = 28) {
  const pct  = total === 0 ? 0 : done / total;
  const fill = Math.round(pct * width);
  const bar  = "█".repeat(fill) + "░".repeat(width - fill);
  return `${C.gold}[${bar}]${C.reset} ${done}/${total}`;
}

// ─── Sleep ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const isDryRun = !!args["dry-run"];
  const delayMs  = parseInt(args["delay"] ?? "300", 10);

  // ── Banner ─────────────────────────────────────────────────────────────────
  log("");
  log(`${C.gold}${C.bold}  ┌─────────────────────────────────────────┐${C.reset}`);
  log(`${C.gold}${C.bold}  │   In My Solitude — Bulk Import Script   │${C.reset}`);
  log(`${C.gold}${C.bold}  └─────────────────────────────────────────┘${C.reset}`);
  if (isDryRun) {
    log(`${C.gold}  ✦ DRY RUN mode — nothing will be uploaded or inserted${C.reset}`);
  }
  log("");

  // ── Validate args ──────────────────────────────────────────────────────────
  if (!args.csv || !args.covers || !args.pdfs) {
    fail("Usage: node scripts/bulk-import.mjs --csv books.csv --covers ./covers --pdfs ./pdfs");
    fail("       Add --dry-run to validate without uploading.");
    process.exit(1);
  }

  const csvPath    = resolve(args.csv);
  const coversDir  = resolve(args.covers);
  const pdfsDir    = resolve(args.pdfs);
  const projectRoot = resolve(new URL("../", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

  // ── Check paths ────────────────────────────────────────────────────────────
  for (const [label, p] of [["CSV", csvPath], ["Covers dir", coversDir], ["PDFs dir", pdfsDir]]) {
    if (!existsSync(p)) { fail(`${label} not found: ${p}`); process.exit(1); }
  }

  // ── Load env ───────────────────────────────────────────────────────────────
  info("Loading environment variables…");
  let env;
  try {
    env = await loadEnv(projectRoot);
  } catch (e) {
    fail(e.message);
    process.exit(1);
  }

  const supabaseUrl     = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey         = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) { fail("NEXT_PUBLIC_SUPABASE_URL missing from .env.local"); process.exit(1); }

  const supabaseKey = serviceRoleKey || anonKey;
  if (!supabaseKey) { fail("No Supabase key found (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)"); process.exit(1); }

  if (!serviceRoleKey) {
    warn("SUPABASE_SERVICE_ROLE_KEY not found — falling back to anon key.");
    warn("RLS policies may block inserts. Add the service role key for reliable imports.");
  } else {
    ok("Using service role key (bypasses RLS)");
  }

  // ── Connect to Supabase ────────────────────────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ── Verify connection + fetch categories ───────────────────────────────────
  info("Connecting to Supabase…");
  const { data: cats, error: catsErr } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (catsErr) { fail(`Could not fetch categories: ${catsErr.message}`); process.exit(1); }
  ok(`Connected — found ${cats.length} categories`);

  // Build lookup maps: slug → id, lowercased name → id
  const catBySlug = {};
  const catByName = {};
  for (const c of cats) {
    catBySlug[c.slug.toLowerCase()] = c.id;
    catByName[c.name.toLowerCase()] = c.id;
  }

  info("Available categories:");
  for (const c of cats) dim(`${c.id.slice(0,8)}…  ${c.slug}  (${c.name})`);
  log("");

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  info(`Parsing CSV: ${csvPath}`);
  const csvContent = await readFile(csvPath, "utf8");
  const rows = parseCsv(csvContent);
  if (rows.length === 0) { fail("CSV is empty or has no data rows."); process.exit(1); }
  ok(`Found ${rows.length} book row${rows.length === 1 ? "" : "s"} in CSV`);
  log("");

  // ── Validate all rows before starting uploads ──────────────────────────────
  info("Validating rows…");
  const validated  = [];
  const preErrors  = [];

  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const lineNo = i + 2; // +1 for 0-index, +1 for header row
    const rowErrors = [];

    // Required fields
    const title = row.title?.trim();
    if (!title) rowErrors.push("title is required");

    // Category lookup
    const catRaw  = row.category?.trim().toLowerCase() ?? "";
    const catId   = catBySlug[catRaw] || catByName[catRaw] || null;
    if (catRaw && !catId) rowErrors.push(`unknown category "${row.category}" (use slug or name)`);

    // Cover file lookup
    const coverStem = row.cover_file?.trim() || slugify(title || "book");
    const coverPath = await findFile(coversDir, coverStem,
      ["jpg", "jpeg", "png", "webp", "avif"]);
    if (!coverPath) rowErrors.push(`cover file not found for stem "${coverStem}" in ${coversDir}`);

    // PDF file lookup
    const pdfStem = row.pdf_file?.trim() || slugify(title || "book");
    const pdfPath = await findFile(pdfsDir, pdfStem, ["pdf"]);
    if (!pdfPath) rowErrors.push(`PDF file not found for stem "${pdfStem}" in ${pdfsDir}`);

    // Tags
    const tagRaw = row.tags?.trim() ?? "";
    const tags   = tagRaw ? tagRaw.split("|").map(t => t.trim()).filter(Boolean) : [];

    // is_restricted
    const isRestricted = ["true", "1", "yes"].includes(
      (row.is_restricted ?? "").trim().toLowerCase()
    );

    // is_published (defaults true)
    const isPublished = !["false", "0", "no"].includes(
      (row.is_published ?? "").trim().toLowerCase()
    );

    if (rowErrors.length) {
      preErrors.push({ lineNo, title: title || `(row ${lineNo})`, errors: rowErrors });
      fail(`Row ${lineNo}: ${title || "(no title)"}`);
      for (const e of rowErrors) dim(`  ↳ ${e}`);
    } else {
      // Get file sizes
      const coverStat = await stat(coverPath);
      const pdfStat   = await stat(pdfPath);
      validated.push({
        lineNo,
        title,
        author:       row.author?.trim() || null,
        category_id:  catId,
        description:  row.description?.trim() || null,
        curator_note: row.curator_note?.trim() || null,
        language:     row.language?.trim() || "English",
        publish_date: row.publish_date?.trim() || null,
        tags:         tags.length ? tags : null,
        is_restricted: isRestricted,
        is_published:  isPublished,
        download_enabled: true,
        coverPath,
        coverName:    basename(coverPath),
        coverSize:    coverStat.size,
        pdfPath,
        pdfName:      basename(pdfPath),
        pdfSize:      pdfStat.size,
      });
    }
  }

  log("");

  if (preErrors.length) {
    warn(`${preErrors.length} row${preErrors.length === 1 ? "" : "s"} failed validation.`);
    if (validated.length === 0) {
      fail("No valid rows to import. Fix the CSV and try again.");
      process.exit(1);
    }
    warn(`Proceeding with ${validated.length} valid row${validated.length === 1 ? "" : "s"}.`);
    log("");
  } else {
    ok(`All ${validated.length} rows are valid.`);
  }

  // ── Summary table ──────────────────────────────────────────────────────────
  const totalCoverSize = validated.reduce((s, r) => s + r.coverSize, 0);
  const totalPdfSize   = validated.reduce((s, r) => s + r.pdfSize, 0);
  info(`Total upload size: ${fmtBytes(totalCoverSize + totalPdfSize)}`);
  info(`  Covers: ${fmtBytes(totalCoverSize)}`);
  info(`  PDFs:   ${fmtBytes(totalPdfSize)}`);
  log("");

  if (isDryRun) {
    ok("Dry run complete — all rows validated, no data uploaded.");
    log("");
    for (const r of validated) {
      ok(`[DRY RUN] ${r.title}`);
      dim(`  ✦ Cover: ${r.coverName} (${fmtBytes(r.coverSize)})`);
      dim(`  ✦ PDF:   ${r.pdfName}   (${fmtBytes(r.pdfSize)})`);
      dim(`  ✦ Category: ${r.category_id ?? "(none)"} | Restricted: ${r.is_restricted}`);
    }
    log("");
    process.exit(0);
  }

  // ── Confirm before uploading ───────────────────────────────────────────────
  // (In non-interactive environments this is skipped automatically)
  if (process.stdin.isTTY) {
    process.stdout.write(
      `${C.gold}${C.bold}  Ready to import ${validated.length} books. Continue? [y/N]: ${C.reset}`
    );
    const answer = await new Promise(res => {
      process.stdin.setEncoding("utf8");
      process.stdin.once("data", chunk => res(chunk.trim().toLowerCase()));
    });
    if (answer !== "y" && answer !== "yes") {
      info("Aborted.");
      process.exit(0);
    }
    log("");
  }

  // ── Upload loop ────────────────────────────────────────────────────────────
  const results   = { ok: [], failed: [] };
  const startTime = Date.now();

  for (let i = 0; i < validated.length; i++) {
    const book = validated[i];

    process.stdout.write(
      `\r  ${progressBar(i, validated.length)} — ${C.white}${book.title.slice(0, 35)}${C.reset}  `
    );

    let bookId = null;

    try {
      // ── Step 1: Insert book record ─────────────────────────────────────────
      const insertPayload = {
        title:            book.title,
        author:           book.author,
        category_id:      book.category_id,
        description:      book.description,
        curator_note:     book.curator_note,
        language:         book.language,
        publish_date:     book.publish_date,
        tags:             book.tags,
        is_restricted:    book.is_restricted,
        is_published:     book.is_published,
        download_enabled: book.download_enabled,
        added_date:       new Date().toISOString(),
        views:            0,
        downloads:        0,
      };

      // eslint-disable-next-line no-undef
      const { data: inserted, error: insertErr } = await supabase
        .from("books")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr) throw new Error(`DB insert: ${insertErr.message} | ${insertErr.details ?? ""}`);
      bookId = inserted.id;

      // ── Step 2: Upload cover ───────────────────────────────────────────────
      const coverExt   = extname(book.coverPath).slice(1) || "jpg";
      const coverKey   = `covers/${bookId}.${coverExt}`;
      const coverBytes = await readFileBytes(book.coverPath);

      const { error: coverErr } = await supabase.storage
        .from("book-covers")
        .upload(coverKey, coverBytes, {
          contentType: `image/${coverExt === "jpg" ? "jpeg" : coverExt}`,
          upsert: true,
        });

      if (coverErr) throw new Error(`Cover upload: ${coverErr.message}`);

      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from("book-covers")
        .getPublicUrl(coverKey);

      // ── Step 3: Upload PDF ─────────────────────────────────────────────────
      const pdfBucket = book.is_restricted ? "vault-files" : "book-files";
      const pdfKey    = `${bookId}.pdf`;
      const pdfBytes  = await readFileBytes(book.pdfPath);

      const { error: pdfErr } = await supabase.storage
        .from(pdfBucket)
        .upload(pdfKey, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (pdfErr) throw new Error(`PDF upload: ${pdfErr.message}`);

      const fileUrl = `${pdfBucket}/${pdfKey}`;

      // ── Step 4: Update book with URLs ──────────────────────────────────────
      const { error: updateErr } = await supabase
        .from("books")
        .update({
          cover_url:       coverUrl,
          file_url:        fileUrl,
          file_size_bytes: book.pdfSize,
        })
        .eq("id", bookId);

      if (updateErr) throw new Error(`URL update: ${updateErr.message}`);

      results.ok.push({ title: book.title, id: bookId });

    } catch (err) {
      // If DB insert succeeded but uploads failed, try to clean up the orphan record
      if (bookId) {
        await supabase.from("books").delete().eq("id", bookId).catch(() => {});
      }
      results.failed.push({ lineNo: book.lineNo, title: book.title, error: err.message });
    }

    if (i < validated.length - 1) await sleep(delayMs);
  }

  // Clear progress line
  process.stdout.write("\r" + " ".repeat(80) + "\r");

  // ── Results ────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log("");
  log(`${C.gold}${C.bold}  ─── Results (${"" + elapsed}s) ──────────────────────────────${C.reset}`);
  log("");

  if (results.ok.length) {
    ok(`${C.bold}${results.ok.length} book${results.ok.length === 1 ? "" : "s"} imported successfully${C.reset}`);
    for (const r of results.ok) {
      dim(`✦ ${r.title}`);
    }
    log("");
  }

  if (results.failed.length) {
    fail(`${C.bold}${results.failed.length} book${results.failed.length === 1 ? "" : "s"} failed${C.reset}`);
    for (const r of results.failed) {
      fail(`  Row ${r.lineNo}: ${r.title}`);
      dim(`    ↳ ${r.error}`);
    }
    log("");

    // Write failed rows back to a CSV for retry
    const failedCsvPath = resolve("failed-import.csv");
    const failedLines   = ["row,title,error"];
    for (const r of results.failed) {
      failedLines.push(`${r.lineNo},"${r.title.replace(/"/g, '""')}","${r.error.replace(/"/g, '""')}"`);
    }
    await writeFile(failedCsvPath, failedLines.join("\n"), "utf8");
    info(`Failed rows written to: ${failedCsvPath}`);
  }

  log(`${C.gold}${C.bold}  ──────────────────────────────────────────────────${C.reset}`);
  log("");
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}\n`);
  process.exit(1);
});
