import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { libraryService, type Book, type SortOption } from "@/services/libraryService";

const PAGE_SIZE = 24;

export function useLibrary() {
  const router = useRouter();
  const params = useSearchParams();

  // Filter state
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => libraryService.getCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour for categories
  });

  const queryKey = ['books', query, category, sort, page];
  
  const { data, isLoading: loading, isFetching: loadingMore } = useQuery({
    queryKey,
    queryFn: () => libraryService.getBooks({
      query,
      categorySlug: category,
      sort,
      page,
      pageSize: PAGE_SIZE
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes for archive results
    // Use placeholderData to keep old data visible while fetching new page
    placeholderData: (previousData) => previousData,
  });

  // We need to manage the accumulated books list for "Load More"
  // React Query's useInfiniteQuery is better for this, but for now we'll 
  // synchronize the accumulated books with the query result.
  const [accumulatedBooks, setAccumulatedBooks] = useState<Book[]>([]);
  const [prevQueryKey, setPrevQueryKey] = useState("");

  const currentQueryKey = JSON.stringify(['books', query, category, sort]);
  
  useMemo(() => {
    if (data) {
      if (currentQueryKey !== prevQueryKey) {
        // Reset list on filter change
        setAccumulatedBooks(data.books);
        setPrevQueryKey(currentQueryKey);
        setPage(0);
      } else {
        // Append on pagination
        setAccumulatedBooks(prev => {
          const newBooks = data.books.filter(nb => !prev.some(pb => pb.id === nb.id));
          return [...prev, ...newBooks];
        });
      }
    }
  }, [data, currentQueryKey, prevQueryKey]);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory("");
    setPage(0);
  }, []);

  // Update URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (category) p.set("category", category);
    router.replace(`/library${p.size ? `?${p}` : ""}`, { scroll: false });
  }, [query, category, router]);

  return {
    books: accumulatedBooks,
    categories,
    total: data?.total ?? 0,
    loading: loading && page === 0,
    loadingMore,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    filtersOpen,
    setFiltersOpen,
    loadMore,
    hasMore: accumulatedBooks.length < (data?.total ?? 0),
    clearFilters
  };
}
