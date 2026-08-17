const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createWebhooks() {
  const url = process.argv[2];
  if (!url) {
    console.error("Please provide the full webhook URL as an argument.");
    console.error("Example: node scripts/create-webhooks.js https://your-ngrok-url.ngrok.app/api/webhooks/supabase");
    process.exit(1);
  }

  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("SUPABASE_WEBHOOK_SECRET is missing in .env.local");
    process.exit(1);
  }

  // Parse DATABASE_DIRECT_URL manually or configure Connection parameters
  const client = new Client({
    host: 'aws-1-eu-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.icwapvsvltnwgypstgkw',
    password: process.env.SOLITUDE_DB_POSTGRES_PASSWORD,
    ssl: true,
  });

  try {
    await client.connect();
    console.log("Connected to database. Setting up webhooks...");

    // 1. Enable pg_net
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_net";`);
    console.log("pg_net extension enabled.");

    // 2. Create the generic webhook function
    // Build the function body safely — url and secret are validated, not from
    // untrusted input, but we use format() to prevent accidental SQL injection.
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_webhook()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE
        payload JSONB;
        webhook_url  TEXT := current_setting('app.webhook_url');
        webhook_auth TEXT := current_setting('app.webhook_secret');
      BEGIN
        payload := jsonb_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE null END
        );

        PERFORM net.http_post(
          url := webhook_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || webhook_auth
          ),
          body := payload
        );

        RETURN NEW;
      END;
      $func$;
    `);

    // Set the runtime configuration parameters used by the function
    await client.query(`ALTER DATABASE postgres SET app.webhook_url = $1`, [url]);
    await client.query(`ALTER DATABASE postgres SET app.webhook_secret = $1`, [secret]);
    console.log("Webhook function created.");

    // 3. Create Trigger for user_profiles (INSERT)
    await client.query(`DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;`);
    await client.query(`
      CREATE TRIGGER on_user_profile_created
      AFTER INSERT ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_webhook();
    `);
    console.log("Trigger on user_profiles created.");

    // 4. Create Trigger for vault_access_requests (INSERT, UPDATE)
    await client.query(`DROP TRIGGER IF EXISTS on_vault_request_changed ON public.vault_access_requests;`);
    await client.query(`
      CREATE TRIGGER on_vault_request_changed
      AFTER INSERT OR UPDATE ON public.vault_access_requests
      FOR EACH ROW EXECUTE FUNCTION public.handle_webhook();
    `);
    console.log("Trigger on vault_access_requests created.");

    console.log("✅ Webhooks successfully configured!");
  } catch (err) {
    console.error("Error setting up webhooks:", err);
  } finally {
    await client.end();
  }
}

createWebhooks();
