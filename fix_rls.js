const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database...");
    
    // Check existing policies on user_profiles
    const res = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'user_profiles';
    `);
    console.log("Existing policies:", res.rows);

    // Create policy to allow users to read all profiles (or at least their own)
    // Often in apps, profiles need to be public or at least readable by authenticated users
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'user_profiles' AND policyname = 'Enable read access for all users'
          ) THEN
              CREATE POLICY "Enable read access for all users"
              ON "public"."user_profiles"
              FOR SELECT USING (true);
          END IF;
      END
      $$;
    `);
    
    // Also ensure users can read their own role!
    console.log("Read policy ensured for user_profiles.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixRLS();
