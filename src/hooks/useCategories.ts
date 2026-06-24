"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type Category = { id: string; name: string };

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  return categories;
}
