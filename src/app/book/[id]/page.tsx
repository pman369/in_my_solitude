import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import BookDetailContent from "./BookDetailContent";
import { LibrarianChat } from "@/components/chat/LibrarianChat";
import { notFound } from "next/navigation";
import type { Database } from "@/types/database";

type Book     = Database["public"]["Tables"]["books"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface BookWithCategory extends Book {
  categories: Category | null;
}

interface RelatedBook {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
}

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("books")
    .select("title, author, description")
    .eq("id", params.id)
    .single();

  const book = data as Pick<Book, "title" | "author" | "description"> | null;
  if (!book) return { title: "Book not found" };

  return {
    title: book.title,
    description:
      book.description ??
      `${book.title}${book.author ? ` by ${book.author}` : ""} — In My Solitude Library`,
  };
}

export default async function BookPage({ params }: Props) {
  const supabase = createClient();

  const { data } = await supabase
    .from("books")
    .select("*, categories(*)")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  const book = data as BookWithCategory | null;
  if (!book) notFound();

  const { data: relatedData } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .eq("category_id", book.category_id ?? "")
    .eq("is_published", true)
    .eq("is_restricted", false)
    .neq("id", book.id)
    .limit(6);

  const related = (relatedData ?? []) as RelatedBook[];

  return (
    <>
      <Suspense>
        <BookDetailContent book={book} related={related} />
      </Suspense>
    </>
  );
}

