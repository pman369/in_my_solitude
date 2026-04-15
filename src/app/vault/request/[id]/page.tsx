import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import VaultRequestContent from "./VaultRequestContent";
import type { Database } from "@/types/database";

type Book     = Database["public"]["Tables"]["books"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface BookWithCategory extends Book {
  categories: Category | null;
}

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("title, author")
    .eq("id", params.id)
    .single();
  const book = data as Pick<Book, "title" | "author"> | null;
  if (!book) return { title: "Book not found" };
  return {
    title: `Request Access — ${book.title}`,
    description: `Request access to "${book.title}"${book.author ? ` by ${book.author}` : ""} in the Vault.`,
  };
}

export default async function VaultRequestPage({ params }: Props) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select("*, categories(*)")
    .eq("id", params.id)
    .eq("is_restricted", true)
    .single();

  const book = data as BookWithCategory | null;
  if (!book) notFound();

  return (
    <Suspense>
      <VaultRequestContent book={book} />
    </Suspense>
  );
}
