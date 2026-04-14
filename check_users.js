const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhreqyqjitoikoswtpvy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocmVxeXFqaXRvaWtvc3d0cHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQyMTcyOSwiZXhwIjoyMDkwOTk3NzI5fQ.uCbNerKmfuXQTGZztQrT5OjDlcQvcy3AYMTlqRHOoU4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus() {
  console.log("Fetching auth users...");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  console.log(`Found ${users.length} users in Auth system.`);
  
  console.log("Fetching user profiles...");
  const { data: profiles, error: profileError } = await supabase.from('user_profiles').select('id, role, display_name');
  
  if (profileError) {
    console.error("Profile Error:", profileError);
    return;
  }
  
  users.forEach(user => {
    const profile = profiles.find(p => p.id === user.id);
    console.log(`Email: ${user.email} | Role: ${profile ? profile.role : 'NO PROFILE RECORD'} | Display Name: ${profile?.display_name || 'N/A'}`);
  });
}

checkAdminStatus();
