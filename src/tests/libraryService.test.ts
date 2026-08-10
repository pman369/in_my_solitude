import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build chainable mock query builder
function createMockQueryBuilder(resolvedData: unknown = [], resolvedCount: number | null = 0, resolvedError: unknown = null) {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = () => new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined; // prevent Promise-like behavior
      if (!qb[prop as string]) {
        qb[prop as string] = vi.fn().mockReturnThis();
      }
      // Terminal methods that return data
      if (prop === 'then') return undefined;
      return (...args: unknown[]) => {
        qb[prop as string](...args);
        return chainable();
      };
    }
  });

  // The final call simulates awaiting the query
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined as unknown,
  };

  // Make it thenable (awaitable) — returns data/count/error
  Object.defineProperty(builder, 'then', {
    get() {
      return (resolve: (val: unknown) => void) => {
        resolve({ data: resolvedData, count: resolvedCount, error: resolvedError });
      };
    }
  });

  return builder;
}

const mockFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { libraryService } from '../services/libraryService';

describe('libraryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('fetches categories ordered by sort_order', async () => {
      const mockCategories = [
        { id: '1', name: 'Consciousness', slug: 'consciousness', sort_order: 1 },
        { id: '2', name: 'History', slug: 'history', sort_order: 2 },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: mockCategories, error: null });

      mockFrom.mockReturnValue({
        select: selectMock,
        order: orderMock,
      });
      // Chain: from('categories').select('*').order('sort_order')
      selectMock.mockReturnValue({ order: orderMock });

      const result = await libraryService.getCategories();

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock).toHaveBeenCalledWith('sort_order');
      expect(result).toEqual(mockCategories);
    });

    it('throws on error from supabase', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });

      mockFrom.mockReturnValue({ select: selectMock });
      selectMock.mockReturnValue({ order: orderMock });

      await expect(libraryService.getCategories()).rejects.toThrow('Failed to fetch categories: DB error');
    });
  });

  describe('getBooks', () => {
    it('builds query with default params', async () => {
      const mockBooks = [{ id: '1', title: 'Test Book' }];

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({
        data: mockBooks,
        count: 1,
        error: null,
      });

      mockFrom.mockReturnValue({ select: selectMock });
      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ eq: eqMock, range: rangeMock });
      rangeMock.mockReturnValue({ order: orderMock });
      // Allow chaining for the order call
      orderMock.mockResolvedValue({ data: mockBooks, count: 1, error: null });

      const result = await libraryService.getBooks({});

      expect(mockFrom).toHaveBeenCalledWith('books');
      expect(result.books).toEqual(mockBooks);
      expect(result.total).toBe(1);
    });

    it('applies text search filter when query is provided', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnThis();
      const textSearchMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      mockFrom.mockReturnValue({ select: selectMock });
      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ eq: eqMock, range: rangeMock });
      rangeMock.mockReturnValue({ textSearch: textSearchMock });
      textSearchMock.mockReturnValue({ order: orderMock });

      await libraryService.getBooks({ query: 'consciousness' });

      expect(textSearchMock).toHaveBeenCalledWith('fts', 'consciousness', {
        type: 'websearch',
        config: 'english',
      });
    });

    it('throws on error from supabase', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        count: null,
        error: { message: 'Query failed' },
      });

      mockFrom.mockReturnValue({ select: selectMock });
      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ eq: eqMock, range: rangeMock });
      rangeMock.mockReturnValue({ order: orderMock });

      await expect(libraryService.getBooks({})).rejects.toThrow('Failed to fetch books: Query failed');
    });

    it('returns empty array when data is null', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: null,
      });

      mockFrom.mockReturnValue({ select: selectMock });
      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ eq: eqMock, range: rangeMock });
      rangeMock.mockReturnValue({ order: orderMock });

      const result = await libraryService.getBooks({});
      expect(result.books).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
