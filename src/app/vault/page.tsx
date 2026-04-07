import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import VaultContent from "./VaultContent";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["books"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface VaultBook extends Book {
  categories: Category | null;
}

export const metadata: Metadata = {
  title: "The Vault",
  description:
    "A restricted archive of texts that require context, discernment, and readiness. Request access with honesty — the curator reviews every request personally.",
};

export default async function VaultPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("books")
    .select("*, categories(*)")
    .eq("is_restricted", true)
    .eq("is_published", true)
    .order("added_date", { ascending: false });

  const books = (data ?? []) as VaultBook[];

  return (
    <Suspense>
      <VaultContent books={books} />
    </Suspense>
  );
}
