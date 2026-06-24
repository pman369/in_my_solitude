const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const searchTitles = [
    'Kybalion', 
    'Cosmic Consciousness', 
    'Fingerprints', 
    'Ancient Israel', 
    'Kabbalah',
    'Dark Matter',
    'Wormholes',
    'Infinite Love',
    'Antichrist',
    'Black\'s Law',
    'Criminal Law',
    'Man\'s Search',
    'Anxious',
    'War of the Gods',
    'Book of the Dead',
    'Computer Fundamentals',
    'Physics',
    'Creativity',
    'Handbook of Theories'
  ];

  let results = [];
  for (const title of searchTitles) {
    const { data } = await supabase
      .from('books')
      .select('id, title')
      .ilike('title', '%' + title + '%');
    
    if (data) {
      results.push(...data);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

run();
