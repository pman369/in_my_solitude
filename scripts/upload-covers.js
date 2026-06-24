/**
 * upload-covers.js
 * Uploads generated covers to Supabase Storage and updates books.cover_url
 *
 * Usage: node scripts/upload-covers.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BRAIN_DIR = 'C:\\Users\\pmann\\.gemini\\antigravity\\brain\\3ffd4082-0e74-4aed-9b4e-d2301ce8f60f';

// Map: image filename (no ext) → array of book IDs to assign this cover to
const COVER_ASSIGNMENTS = [
  {
    image: 'cover_kybalion_1778276551700.png',
    // Kybalion / consciousness books — use for Kybalion and similar
    ids: [
      // The Kybalion (search result) — add real ID from showcase-ids.json
    ],
    label: 'The Kybalion',
  },
  {
    image: 'cover_ancient_israel_1778283945177.png',
    ids: [
      '22fd8c2b-e69c-4631-86da-1428121e0147', // Ancient Israel In Sinai
    ],
    label: 'Ancient Israel',
  },
  {
    image: 'cover_infinite_love_1778283961244.png',
    ids: [
      'b47a18c1-ac39-4608-b014-b4b5f0946952', // David Icke Infinite Love
    ],
    label: 'Infinite Love',
  },
  {
    image: 'cover_dark_matter_1778283985054.png',
    ids: [
      '789541a3-b483-4eda-9cb7-bb3bcafc8d3e', // Could Dark Matter Be Made Of
      '9adc1089-23ec-4ae1-b936-574f149d6af5', // Dark Matter And Dark Energy
      '02c1ad12-f373-4747-b7ed-62a1ac7b4ec4', // How Dark Matter Came To Matter
    ],
    label: 'Dark Matter',
  },
  {
    image: 'cover_gilgamesh_1778284003680.png',
    ids: [
      '325d0528-0b84-4190-899e-be02a7a4268b', // THE EPIC OF GILGAMESH
    ],
    label: 'Epic of Gilgamesh',
  },
  {
    image: 'cover_handbook_solitude_1778284022718.png',
    ids: [
      '3377c95d-7a00-4911-9aee-a48603a5209d', // The Handbook Of Solitude
      '2bc31d0f-7edc-46ae-b806-0ccc73140a2e', // The Handbook Of Solitude (dup)
    ],
    label: 'Handbook of Solitude',
  },
  {
    image: 'cover_philosophy_consciousness_1778284038084.png',
    ids: [
      '9dcf9cb5-21f2-4cf3-8e62-9c79fd6841e1', // The Philosophy Of Consciousness
    ],
    label: 'Philosophy of Consciousness',
  },
  {
    image: 'cover_sufism_1778284059692.png',
    ids: [
      'c36379dc-244d-4152-8ac1-ad159a7bc2f3', // A Guide To Sufism
    ],
    label: 'A Guide to Sufism',
  },
  {
    image: 'cover_rosicrucian_1778284077080.png',
    ids: [
      'b43cc313-c2d7-4f86-8711-4667bf3c821c', // THE ROSICRUCIAN
    ],
    label: 'The Rosicrucian',
  },
  {
    image: 'cover_sacred_magic_1778284094908.png',
    ids: [
      'bce19977-afdf-43da-ba67-a21ab3bade94', // The Sacred Magic Of Abramelin
      'cdc31d5d-925f-4d13-84cb-3f6e7eaa0bc9', // Grimoire Texts Geometric Symbols
      'e42cad95-9d2f-4cd0-a110-a71b4d28fc81', // Medieval Grimoires - Black Pullet
    ],
    label: 'Sacred Magic / Grimoires',
  },
  {
    image: 'cover_book_giants_1778284109142.png',
    ids: [
      '3a0edaa2-74bd-4b5a-abe8-a7cb713a3b74', // The Book Of Giants The Fallen Angels
      'f2a8945b-eb9f-4b71-bf74-25a9ed8068a2', // From The Book Of Giants
    ],
    label: 'Book of Giants',
  },
  {
    image: 'cover_untethered_soul_1778284131010.png',
    ids: [
      '64d361ca-4aea-48c6-b3f0-a6897eeb81f5', // The Untethered Soul
    ],
    label: 'The Untethered Soul',
  },
  {
    image: 'cover_demonology_1778284150746.png',
    ids: [
      '8492cc56-3813-4916-b586-5da199be5efa', // Demonology And Magic Ritual Texts
    ],
    label: 'Demonology & Magic',
  },
  {
    image: 'cover_war_gods_1778284167520.png',
    ids: [
      'f37007fe-b351-41be-9e0b-3d33e44e7d78', // Anderson, Poul - War Of The Gods
    ],
    label: 'War of the Gods',
  },
];

async function uploadCover(imagePath, bookId, label) {
  const imageBuffer = fs.readFileSync(imagePath);
  const storagePath = `covers/${bookId}.png`;

  // Upload to Supabase Storage (upsert)
  const { error: uploadError } = await supabase.storage
    .from('book-covers')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error(`  ✗ Upload failed for "${label}" (${bookId}): ${uploadError.message}`);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('book-covers')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Update books table
  const { error: updateError } = await supabase
    .from('books')
    .update({ cover_url: publicUrl })
    .eq('id', bookId);

  if (updateError) {
    console.error(`  ✗ DB update failed for "${label}" (${bookId}): ${updateError.message}`);
    return null;
  }

  return publicUrl;
}

async function run() {
  console.log('🎨 Starting cover upload to Supabase...\n');

  let uploaded = 0;
  let failed = 0;

  for (const assignment of COVER_ASSIGNMENTS) {
    const imagePath = path.join(BRAIN_DIR, assignment.image);

    if (!fs.existsSync(imagePath)) {
      console.warn(`  ⚠ Image not found: ${assignment.image}`);
      failed++;
      continue;
    }

    if (!assignment.ids || assignment.ids.length === 0) {
      console.warn(`  ⚠ No book IDs for: ${assignment.label}`);
      continue;
    }

    console.log(`📖 ${assignment.label} (${assignment.ids.length} book${assignment.ids.length > 1 ? 's' : ''})`);

    for (const bookId of assignment.ids) {
      const url = await uploadCover(imagePath, bookId, assignment.label);
      if (url) {
        console.log(`  ✓ ${bookId} → ${url}`);
        uploaded++;
      } else {
        failed++;
      }
    }
  }

  console.log(`\n✅ Done! ${uploaded} covers uploaded, ${failed} failed.`);
}

run();
