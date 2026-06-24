const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixStoragePolicy() {
  const client = new Client({
    host: 'aws-1-eu-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.icwapvsvltnwgypstgkw',
    password: process.env.SOLITUDE_DB_POSTGRES_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to database. Modifying storage policies...");

    // 1. Drop existing broad Public Access policy
    await client.query(`
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    `);
    console.log("Dropped old 'Public Access' policy.");

    // 2. Recreate "Public Access" policy to only allow retrieval of objects, but not listing them.
    // In PostgreSQL, using 'SELECT' with RLS normally allows listing unless we restrict operations.
    // Specifically, for Supabase storage, preventing listing but allowing downloading is achieved by 
    // checking if the filename is specified (i.e. name is not empty or checking a specific request structure).
    // However, the standard Supabase recommended way to allow download-only but block listing (folder browsing) 
    // is to write:
    // (bucket_id = 'book-covers' AND (storage.foldername(name))[1] IS NOT NULL) or similar, or 
    // simply using the custom claim / header checks, or by setting the bucket itself to NOT public (public = false) 
    // and using signed URLs, OR by writing a RLS policy that checks for a specific file access.
    // Let's implement the recommended remediation:
    // To allow selecting individual objects (via direct link) but preventing directory listing:
    // We can restrict the SELECT policy by checking if a single object is requested. In SQL, we can't easily 
    // inspect the SQL LIMIT clause inside RLS, but we can verify if the name matches a file path directly.
    // A common Supabase trick to allow read but prevent listing in SELECT is:
    // USING (bucket_id = 'book-covers' AND (SELECT true)); -- this is still listing.
    // To strictly disable listing of files in the bucket:
    // We can change the bucket to be non-public and use getPublicUrl / download, or if it is public,
    // we can restrict SELECT policy to match:
    // USING (bucket_id = 'book-covers' AND (storage.foldername(name) IS NOT NULL OR name = name));
    // Actually, the database linter flags any policy on storage.objects FOR SELECT USING (bucket_id = 'bucket_name')
    // if the bucket is also marked as 'public' in storage.buckets, because public buckets automatically allow direct URL access 
    // without any RLS policies needed for downloading. The linter warning says:
    // "Public buckets don't need this [SELECT policy] for object URL access and it may expose more data than intended."
    // This means we can safely REMOVE the SELECT policy entirely for public buckets, and public download URLs will still work,
    // but users won't be able to list/enumerate the bucket files via the API client!
    
    console.log("No new SELECT policy is needed because the bucket is public. Object URL access works without it.");

    console.log("✅ Storage policy updated successfully!");
  } catch (err) {
    console.error("Error updating storage policy:", err);
  } finally {
    await client.end();
  }
}

fixStoragePolicy();
