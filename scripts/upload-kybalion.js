const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadOne(imagePath, bookId, label) {
  const imageBuffer = fs.readFileSync(imagePath);
  const storagePath = `covers/${bookId}.png`;

  const { error: uploadError } = await supabase.storage
    .from('book-covers')
    .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });

  if (uploadError) { console.error(`✗ Upload failed: ${uploadError.message}`); return; }

  const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from('books')
    .update({ cover_url: urlData.publicUrl })
    .eq('id', bookId);

  if (updateError) { console.error(`✗ DB update failed: ${updateError.message}`); return; }

  console.log(`✓ ${label} → ${urlData.publicUrl}`);
}

async function run() {
  const kybalionImage = 'C:\\Users\\pmann\\.gemini\\antigravity\\brain\\3ffd4082-0e74-4aed-9b4e-d2301ce8f60f\\cover_kybalion_1778284269389.png';

  // Search for Kybalion books
  const { data } = await supabase.from('books').select('id, title').ilike('title', '%kybalion%');
  console.log('Kybalion books found:', JSON.stringify(data));

  if (data && data.length > 0) {
    for (const book of data) {
      await uploadOne(kybalionImage, book.id, book.title);
    }
  }
}

run();
