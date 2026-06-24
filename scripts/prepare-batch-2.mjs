import { readdir, rename, stat, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const DOCS_DIR = '.documents';
const PDFS_DIR = 'scripts/pdfs';
const COVERS_DIR = 'scripts/covers';
const BATCH_SUFFIX = 'batch-2';
const OUTPUT_CSV = `scripts/bulk-upload-${BATCH_SUFFIX}.csv`;

async function prepare() {
  console.log(`--- Preparing ${BATCH_SUFFIX} for upload ---`);

  // 1. Get files from .documents
  const files = await readdir(DOCS_DIR).catch(() => []);
  if (files.length === 0) {
    console.log('No files found in .documents');
    return;
  }
  console.log(`Found ${files.length} files in ${DOCS_DIR}`);

  const processedFiles = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const fullPath = join(DOCS_DIR, file);
    
    if (['.pdf', '.docx'].includes(ext)) {
      const targetPath = join(PDFS_DIR, file);
      await rename(fullPath, targetPath);
      processedFiles.push({ name: file, type: 'pdf' });
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const targetPath = join(COVERS_DIR, file);
      await rename(fullPath, targetPath);
      processedFiles.push({ name: file, type: 'cover' });
    }
  }

  const csvRows = ['title,author,category,description,curator_note,tags,is_restricted,is_published,language,publish_date,cover_file,pdf_file'];

  for (const fileObj of processedFiles) {
    if (fileObj.type !== 'pdf') continue;
    const pdf = fileObj.name;

    // Clean up filename for title
    let title = pdf.replace(/\.(pdf|docx)$/i, '')
                   .replace(/_/g, ' ')
                   .replace(/-/g, ' ')
                   .trim();
    
    // Remove dates at start
    title = title.replace(/^\d{4}-\d{2}-\d{2}\s+/, '');
    
    // Capitalize words
    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Categorize
    let category = 'consciousness'; // default
    const lowerTitle = title.toLowerCase();
    const lowerFile = pdf.toLowerCase();
    
    if (lowerFile.includes('cia-rdp') || lowerTitle.includes('history') || lowerTitle.includes('elite') || lowerTitle.includes('family') || lowerTitle.includes(' insider') || lowerFile.includes('1954-11-15')) {
       category = 'forbidden-history';
    } else if (lowerTitle.includes('quran') || lowerTitle.includes('sufi') || lowerTitle.includes('muhammad') || lowerTitle.includes('christ') || lowerTitle.includes('religious') || lowerTitle.includes('spirit') || lowerTitle.includes('meditation') || lowerTitle.includes('soul')) {
       category = 'spirituality';
    } else if (lowerTitle.includes('magic') || lowerTitle.includes('grimoire') || lowerTitle.includes('solomon') || lowerTitle.includes('freemason') || lowerTitle.includes('rosicrucian') || lowerTitle.includes('cipher') || lowerTitle.includes('liber') || lowerTitle.includes('occult')) {
       category = 'esoteric';
    } else if (lowerTitle.includes('quantum') || lowerTitle.includes('physics') || lowerTitle.includes('dark matter') || lowerTitle.includes('gauge') || lowerTitle.includes('theory') || lowerTitle.includes('cosmology') || lowerTitle.includes('spacetime') || lowerTitle.includes('geometry') || lowerTitle.includes('axion')) {
       category = 'science';
    } else if (lowerTitle.includes('fichte') || lowerTitle.includes('leibniz') || lowerTitle.includes('philosophical') || lowerTitle.includes('interpretations')) {
       category = 'philosophy';
    } else if (lowerTitle.includes('enki') || lowerTitle.includes('gilgamesh') || lowerTitle.includes('giants') || lowerTitle.includes('qumran') || lowerTitle.includes('testament') || lowerTitle.includes('ancient') || lowerTitle.includes('israel')) {
       category = 'ancient';
    } else if (lowerTitle.includes('mind control') || lowerTitle.includes('remote viewing') || lowerTitle.includes('reincarnation') || lowerTitle.includes('matrix')) {
       category = 'consciousness';
    } else if (lowerTitle.includes('seduce') || lowerTitle.includes('psychic') || lowerTitle.includes('nlp')) {
       category = 'psychology';
    } else if (lowerTitle.includes('blackhat') || lowerTitle.includes('bank transfer') || lowerTitle.includes('payment') || lowerTitle.includes('numeracy')) {
       category = 'technology';
    }

    // Escape quotes for CSV
    const escapedTitle = `"${title.replace(/"/g, '""')}"`;
    
    csvRows.push(`${escapedTitle},,${category},,,,false,true,English,,,"${pdf}"`);
  }

  await writeFile(OUTPUT_CSV, csvRows.join('\n'));
  console.log(`Created ${OUTPUT_CSV} with ${csvRows.length - 1} entries.`);
}

prepare().catch(console.error);
