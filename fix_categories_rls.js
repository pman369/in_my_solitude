const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixCategoryRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database...");
    
    // Enable RLS on categories if not already done
    await client.query(`ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;`);

    // Create policy to allow anyone to read categories
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'categories' AND policyname = 'Enable public read access for categories'
          ) THEN
              CREATE POLICY "Enable public read access for categories"
              ON "public"."categories"
              FOR SELECT USING (true);
          END IF;
      END
      $$;
    `);
    
    console.log("Read policy ensured for categories.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixCategoryRLS();
