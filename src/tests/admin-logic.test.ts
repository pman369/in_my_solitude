import { describe, it, expect, vi } from 'vitest';
import { logActivity } from '../lib/admin/activity-logger';
import { createClient } from '../lib/supabase/client';

// Mock Supabase client
vi.mock('../lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

describe('Admin Activity Logger', () => {
  it('should call supabase insert with correct activity parameters', async () => {
    const activityParams = {
      action: 'book_publish' as const,
      targetId: 'book-123',
      targetType: 'book' as const,
      details: { title: 'The Great Grimoire' }
    };

    await logActivity(activityParams);

    const supabase = createClient();
    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
  });

  it('should handle missing user gracefully', async () => {
    const supabase = createClient();
    // @ts-ignore
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    await logActivity({ action: 'book_delete', targetId: '123' });
    
    // Should return early without calling .from()
    expect(supabase.from).not.toHaveBeenCalledWith('activity_logs');
  });
});
