import { readdir, rename, stat, writeFile, mkdir } from 'fs/promises';
import { join, extname, basename, resolve } from 'path';
import { existsSync } from 'fs';

const DOCS_DIR = 'scripts/pdf'; // Updated to correct folder
const PDFS_DIR = 'scripts/pdf';
const COVERS_DIR = 'scripts/covers';
const OUTPUT_CSV = 'scripts/bulk-upload-documents.csv';

// Slugify function similar to the one in bulk-import.mjs
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function prepare() {
  console.log('--- Preparing files for upload (Source: scripts/pdfs) ---');

  const files = await readdir(DOCS_DIR).catch(() => []);
  if (files.length === 0) {
    console.log('No files found in scripts/pdf');
    return;
  }
  console.log(`Found ${files.length} files in ${DOCS_DIR}`);

  // ---------------------------------------------------
  // Copy any custom cover images from the /scratch folder into the covers directory
  // This allows bulk‑import.mjs to pick them up automatically.
  // ---------------------------------------------------
  const scratchDir = 'scratch';
  const allowedCoverExts = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  try {
    const scratchFiles = await readdir(scratchDir);
    for (const f of scratchFiles) {
      const ext = extname(f).slice(1).toLowerCase();
      if (allowedCoverExts.includes(ext)) {
        const src = join(scratchDir, f);
        const dest = join(COVERS_DIR, f);
        // Ensure the covers directory exists
        if (!existsSync(COVERS_DIR)) await mkdir(COVERS_DIR, { recursive: true });
        // Move (or copy) the file – rename works across same filesystem
        await rename(src, dest).catch(async () => {
          // Fallback to copy if rename fails (e.g., different drives)
          const { copyFile } = await import('fs/promises');
          await copyFile(src, dest);
          // Optionally delete the original after copy
          await rename(src, src); // no‑op to suppress unused warning
        });
        console.log(`Copied cover ${f} from ${scratchDir} to ${COVERS_DIR}`);
      }
    }
  } catch (e) {
    console.log('No custom covers found in /scratch or error copying them');
  }

  const processedPdfs = files.filter(f => f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.docx'));

  const csvRows = ['title,author,category,description,curator_note,tags,is_restricted,is_published,language,publish_date,cover_file,pdf_file'];

  for (const pdf of processedPdfs) {
    const originalStem = pdf.replace(/\.(pdf|docx)$/i, '');
    let title = originalStem
                   .replace(/_/g, ' ')
                   .replace(/-/g, ' ')
                   .trim();
    
    // Attempt cleaning but preserve if it becomes empty
    let cleanedTitle = title.replace(/^\d{4}-\d{2}-\d{2}[- \d:]*/, '');
    cleanedTitle = cleanedTitle.replace(/^[a-f0-9]{16,}\s*/i, '');
    
    if (cleanedTitle.trim().length > 0) {
        title = cleanedTitle.trim();
    }
    
    // Capitalize words
    title = title.split(' ').map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');

    // Categorization logic
    let category = 'consciousness';
    const lt = title.toLowerCase();
    const lf = pdf.toLowerCase();

    if (lf.includes('cia-rdp') || lt.includes('history') || lt.includes('elite') || lt.includes('family') || lt.includes('insider') || lt.includes('world order') || lt.includes('control') || lt.includes('rothschild') || lt.includes('paperclip')) {
       category = 'forbidden-history';
    } else if (lt.includes('quran') || lt.includes('sufi') || lt.includes('muhammad') || lt.includes('christ') || lt.includes('religious') || lt.includes('spirit') || lt.includes('meditation') || lt.includes('soul') || lt.includes('bible') || lt.includes('gospel') || lt.includes('divine') || lt.includes('temple') || lt.includes('theology')) {
       category = 'spirituality';
    } else if (lt.includes('magic') || lt.includes('grimoire') || lt.includes('solomon') || lt.includes('freemason') || lt.includes('rosicrucian') || lt.includes('cipher') || lt.includes('liber') || lt.includes('occult') || lt.includes('esoteric') || lt.includes('abramelin') || lt.includes('raziel') || lt.includes('hermetic')) {
       category = 'esoteric';
    } else if (lt.includes('quantum') || lt.includes('physics') || lt.includes('dark matter') || lt.includes('gauge') || lt.includes('theory') || lt.includes('cosmology') || lt.includes('spacetime') || lt.includes('geometry') || lt.includes('axion') || lt.includes('science') || lt.includes('energy') || lt.includes('space') || lt.includes('universal life')) {
       category = 'science';
    } else if (lt.includes('fichte') || lt.includes('leibniz') || lt.includes('philosophical') || lt.includes('interpretations') || lt.includes('philosophy') || lt.includes('descartes') || lt.includes('subjective') || lt.includes('creativity')) {
       category = 'philosophy';
    } else if (lt.includes('enki') || lt.includes('gilgamesh') || lt.includes('giants') || lt.includes('qumran') || lt.includes('testament') || lt.includes('ancient') || lt.includes('israel') || lt.includes('vikings') || lt.includes('atlantis') || lt.includes('lemuria')) {
       category = 'ancient';
    } else if (lt.includes('mind control') || lt.includes('remote viewing') || lt.includes('reincarnation') || lt.includes('matrix') || lt.includes('consciousness') || lt.includes('dream') || lt.includes('astral') || lt.includes('solitude')) {
       category = 'consciousness';
    } else if (lt.includes('seduce') || lt.includes('psychic') || lt.includes('nlp') || lt.includes('psychology') || lt.includes('healing') || lt.includes('self') || lt.includes('emotion')) {
       category = 'psychology';
    } else if (lt.includes('blackhat') || lt.includes('bank transfer') || lt.includes('payment') || lt.includes('numeracy') || lt.includes('technology') || lt.includes('digital') || lt.includes('cyber') || lt.includes('virtual actor')) {
       category = 'technology';
    } else if (lt.includes('law') || lt.includes('patent') || lt.includes('us4') || lt.includes('us5') || lt.includes('us6')) {
       category = 'law';
    }

    // Escape quotes for CSV
    const escapedTitle = `"${title.replace(/"/g, '""')}"`;
    
    // Default metadata
    const author = '';
    const description = '';
    const curator_note = '';
    const tags = '';
    const is_restricted = 'false';
    const is_published = 'true';
    const language = 'English';
    const publish_date = '';
    
    // Check if there's a matching cover (optional, bulk-import.mjs handles auto-matching if cover_file is empty)
    // But we'll leave it empty for auto-matching unless we find a direct hit
    const cover_file = '';

    csvRows.push(`${escapedTitle},${author},${category},${description},${curator_note},${tags},${is_restricted},${is_published},${language},${publish_date},${cover_file},"${pdf}"`);
  }

  await writeFile(OUTPUT_CSV, csvRows.join('\n'));
  console.log(`Created ${OUTPUT_CSV} with ${csvRows.length - 1} entries.`);
}

prepare().catch(console.error);
