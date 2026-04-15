const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhreqyqjitoikoswtpvy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocmVxeXFqaXRvaWtvc3d0cHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQyMTcyOSwiZXhwIjoyMDkwOTk3NzI5fQ.uCbNerKmfuXQTGZztQrT5OjDlcQvcy3AYMTlqRHOoU4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCategories() {
  console.log("Checking categories...");
  const { data: existing, error: err1 } = await supabase.from('categories').select('*');
  
  if (err1) {
    console.error("Error fetching categories:", err1);
    return;
  }
  
  console.log(`Found ${existing.length} categories.`);
  
  if (existing.length === 0) {
    console.log("Seeding initial categories...");
    const baseCategories = [
      { name: "Esoterica & Mysticism", description: "Ancient teachings, hermetic philosophy, and occult texts." },
      { name: "Philosophy & Ethics", description: "Discourses on the nature of reality, morality, and thought." },
      { name: "History & Antiquity", description: "Chronicles of forgotten empires and civilizations." },
      { name: "Art & Architecture", description: "Studies of form, function, and aesthetic expression." },
      { name: "Science & Mathematics", description: "The foundational principles of the natural world." },
      { name: "Literature & Poetry", description: "Masterworks of human expression and storytelling." }
    ];
    
    const { error: err2 } = await supabase.from('categories').insert(baseCategories);
    if (err2) {
      console.error("Error seeding categories:", err2);
    } else {
      console.log("Categories seeded successfully!");
    }
  }
}
seedCategories();
