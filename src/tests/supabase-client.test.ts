import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @supabase/ssr
const mockCreateBrowserClient = vi.fn().mockReturnValue({ from: vi.fn() });
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe('Supabase Browser Client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    mockCreateBrowserClient.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('creates client with env variables when both are present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NODE_ENV = 'production';

    const { createClient } = await import('../lib/supabase/client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
  });

  it('uses placeholder values during build phase when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PHASE = 'phase-production-build';

    const { createClient } = await import('../lib/supabase/client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://placeholder-url.supabase.co',
      'placeholder-key'
    );
  });

  it('throws error in development when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PHASE;

    const { createClient } = await import('../lib/supabase/client');

    expect(() => createClient()).toThrow('Supabase environment variables are missing');
  });

  it('does not throw in development during build phase', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PHASE = 'phase-production-build';

    const { createClient } = await import('../lib/supabase/client');

    expect(() => createClient()).not.toThrow();
  });
});
