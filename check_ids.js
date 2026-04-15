const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhreqyqjitoikoswtpvy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocmVxeXFqaXRvaWtvc3d0cHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQyMTcyOSwiZXhwIjoyMDkwOTk3NzI5fQ.uCbNerKmfuXQTGZztQrT5OjDlcQvcy3AYMTlqRHOoU4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  console.log("Checking User IDs...");
  const { data: profiles } = await supabase.from('user_profiles').select('id, role, display_name');
  profiles.forEach(p => console.log(`ID: ${p.id} | Role: ${p.role}`));
}
checkIds();
