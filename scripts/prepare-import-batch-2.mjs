import { readdir, rename, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const DOCS_DIR = '.documents';
const PDFS_DIR = 'scripts/pdfs';
const COVERS_DIR = 'scripts/covers';
const OUTPUT_CSV = 'scripts/bulk-upload-batch-2.csv';

async function prepare() {
  console.log('--- Preparing Batch 2 files ---');

  const files = await readdir(DOCS_DIR).catch(() => []);
  if (files.length === 0) {
    console.log('No new files in .documents');
    return;
  }

  const csvRows = ['title,author,category,description,curator_note,tags,is_restricted,is_published,language,publish_date,cover_file,pdf_file'];
  const processedPdfs = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const fullPath = join(DOCS_DIR, file);
    
    if (['.pdf', '.docx'].includes(ext)) {
      const targetPath = join(PDFS_DIR, file);
      await rename(fullPath, targetPath);
      processedPdfs.push(file);
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const targetPath = join(COVERS_DIR, file);
      await rename(fullPath, targetPath);
    }
  }

  for (const pdf of processedPdfs) {
    let title = pdf.replace(/\.(pdf|docx)$/i, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
    title = title.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\s+/, '');
    title = title.replace(/^\d{4}-\d{2}-\d{2}\s+/, '');
    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let category = 'consciousness';
    const lt = title.toLowerCase();

    // Categorization logic
    if (lt.includes('cia') || lt.includes('rothschild') || lt.includes('paperclip') || lt.includes('titanic') || lt.includes('history')) category = 'forbidden-history';
    if (lt.includes('quantum') || lt.includes('physics') || lt.includes('matter') || lt.includes('energy') || lt.includes('theory') || lt.includes('space') || lt.includes('science')) category = 'science';
    if (lt.includes('magic') || lt.includes('grimoire') || lt.includes('solomon') || lt.includes('esoteric') || lt.includes('occult') || lt.includes('abramelin') || lt.includes('rosicrucian') || lt.includes('raziel')) category = 'esoteric';
    if (lt.includes('sufi') || lt.includes('quran') || lt.includes('bible') || lt.includes('gospel') || lt.includes('christ') || lt.includes('divine') || lt.includes('temple') || lt.includes('spirit')) category = 'spirituality';
    if (lt.includes('nlp') || lt.includes('seduction') || lt.includes('psychic') || lt.includes('mind') || lt.includes('human') || lt.includes('self')) category = 'psychology';
    if (lt.includes('philosophy') || lt.includes('fichte') || lt.includes('descartes') || lt.includes('leibniz') || lt.includes('subjective')) category = 'philosophy';
    if (lt.includes('world order') || lt.includes('elite') || lt.includes('law') || lt.includes('control') || lt.includes('family')) category = 'law';
    if (lt.includes('ancient') || lt.includes('gilgamesh') || lt.includes('enki') || lt.includes('giants') || lt.includes('israel')) category = 'ancient';

    const escapedTitle = `"${title.replace(/"/g, '""')}"`;
    csvRows.push(`${escapedTitle},,${category},,,,false,true,English,,,"${pdf}"`);
  }

  await writeFile(OUTPUT_CSV, csvRows.join('\n'));
  console.log(`Processed ${processedPdfs.length} files. CSV saved to ${OUTPUT_CSV}`);
}

prepare().catch(console.error);
