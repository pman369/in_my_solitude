const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Wave 1 — Showcase 20 search terms
const SHOWCASE_SEARCHES = [
  'Kybalion',
  'Ancient Israel in Sinai',
  'Infinite Love',
  'Dark Matter',
  'War of the Gods',
  'Anderson',
  'Epic of Gilgamesh',
  'Man Search for Meaning',
  'Handbook of Solitude',
  'Philosophy of Consciousness',
  'Creativity',
  'Sufism',
  'Rosicrucian',
  'Sacred Magic',
  'Grimoire',
  'Demonology',
  'Book of Giants',
  'Fingerprints',
  'Untethered Soul',
  'Cosmic Consciousness',
];

async function run() {
  const results = [];
  const seen = new Set();

  for (const term of SHOWCASE_SEARCHES) {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, category_id, is_restricted, cover_url')
      .ilike('title', `%${term}%`)
      .limit(3);

    if (error) { console.error(`Error for "${term}":`, error.message); continue; }
    if (!data) continue;

    for (const book of data) {
      if (!seen.has(book.id)) {
        seen.add(book.id);
        results.push(book);
      }
    }
  }

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(__dirname, 'showcase-ids.json'), JSON.stringify(results, null, 2));
  console.error(`\n✓ Saved ${results.length} books to scripts/showcase-ids.json`);
}

run();
