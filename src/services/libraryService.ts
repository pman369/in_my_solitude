import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type Book = Database["public"]["Tables"]["books"]["Row"] & {
  categories?: {
    slug: string;
    name: string;
  } | null;
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export type SortOption = "newest" | "oldest" | "az" | "za" | "popular";

export interface FetchBooksParams {
  query?: string;
  categorySlug?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface FetchBooksResult {
  books: Book[];
  total: number;
}

export const libraryService = {
  async getCategories(): Promise<Category[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data as Category[];
  },

  async getBooks(params: FetchBooksParams): Promise<FetchBooksResult> {
    const { 
      query = "", 
      categorySlug = "", 
      sort = "newest", 
      page = 0, 
      pageSize = 24 
    } = params;

    const supabase = createClient();
    
    let qb = supabase
      .from("books")
      .select("*, categories(slug, name)", { count: "exact" })
      .eq("is_published", true)
      .eq("is_restricted", false)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Full-text search
    if (query.trim()) {
      qb = qb.textSearch("fts", query.trim(), { 
        type: "websearch", 
        config: "english" 
      });
    }

    if (categorySlug) {
      // First get the category ID
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      
      if (catError) {
        console.error(`Failed to resolve category slug "${categorySlug}":`, catError.message);
      } else if (catData) {
        qb = qb.eq("category_id", catData.id);
      }
    }

    // Sorting
    switch (sort) {
      case "newest":  qb = qb.order("added_date", { ascending: false }); break;
      case "oldest":  qb = qb.order("added_date", { ascending: true });  break;
      case "az":      qb = qb.order("title",       { ascending: true });  break;
      case "za":      qb = qb.order("title",       { ascending: false }); break;
      case "popular": qb = qb.order("views",       { ascending: false }); break;
    }

    const { data, count, error } = await qb;

    if (error) {
      throw new Error(`Failed to fetch books: ${error.message}`);
    }

    return {
      books: (data as Book[]) || [],
      total: count || 0,
    };
  }
};
