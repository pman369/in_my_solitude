const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixSecurityLints() {
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
    console.log("Connected to database. Applying security fixes...");

    // 1. Fix search_path on public.is_admin
    await client.query(`
      ALTER FUNCTION public.is_admin() SET search_path = public;
    `);
    console.log("Applied search_path to public.is_admin()");

    // 2. Fix search_path on public.handle_new_user
    try {
      await client.query(`
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
      `);
      console.log("Applied search_path to public.handle_new_user()");
    } catch (e) {
      console.log("Note: public.handle_new_user() does not exist or failed to modify:", e.message);
    }

    // 3. Fix search_path on public.handle_webhook
    await client.query(`
      ALTER FUNCTION public.handle_webhook() SET search_path = public;
    `);
    console.log("Applied search_path to public.handle_webhook()");

    // 4. Revoke EXECUTE from public/anon/authenticated roles for security definer functions
    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.handle_webhook() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.handle_webhook() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.handle_webhook() FROM authenticated;
    `);
    console.log("Revoked execution permissions for handle_webhook() from public/anon/authenticated.");

    try {
      await client.query(`
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
      `);
      console.log("Revoked execution permissions for handle_new_user() from public/anon/authenticated.");
    } catch (e) {
      console.log("Note: Could not revoke EXECUTE on handle_new_user():", e.message);
    }

    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
    `);
    console.log("Revoked execution permissions for is_admin() from public/anon/authenticated.");

    console.log("✅ Security improvements applied successfully!");
  } catch (err) {
    console.error("Error applying security fixes:", err);
  } finally {
    await client.end();
  }
}

fixSecurityLints();
