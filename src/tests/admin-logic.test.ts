import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();

vi.mock('../lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { logActivity } from '../lib/admin/activity-logger';

describe('Admin Activity Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('should call supabase insert with correct activity parameters', async () => {
    const activityParams = {
      action: 'book_publish' as const,
      targetId: 'book-123',
      targetType: 'book' as const,
      details: { title: 'The Great Grimoire' }
    };

    await logActivity(activityParams);

    expect(mockGetUser).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('activity_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user-id',
      action: 'book_publish',
      target_id: 'book-123',
      target_type: 'book',
      details: { title: 'The Great Grimoire' },
    });
  });

  it('should handle missing user gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    await logActivity({ action: 'book_delete', targetId: '123' });
    
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should handle errors from supabase without throwing', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));

    // Should not throw
    await expect(logActivity({ action: 'book_edit', targetId: '456' })).resolves.toBeUndefined();
  });

  it('should use empty object for details when not provided', async () => {
    await logActivity({ action: 'vault_approve', targetId: 'req-1' });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ details: {} })
    );
  });
});
