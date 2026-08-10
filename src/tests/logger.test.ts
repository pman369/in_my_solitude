import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('in non-production mode (test env)', () => {
    it('logs info messages to console.info', async () => {
      const { logger } = await import('../lib/logger');
      logger.info('test info message');
      expect(console.info).toHaveBeenCalled();
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('test info message');
    });

    it('logs warn messages to console.warn', async () => {
      const { logger } = await import('../lib/logger');
      logger.warn('test warning');
      expect(console.warn).toHaveBeenCalled();
      const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[WARN]');
      expect(call[0]).toContain('test warning');
    });

    it('logs error messages to console.error', async () => {
      const { logger } = await import('../lib/logger');
      logger.error('test error');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('test error');
    });

    it('logs debug messages to console.debug', async () => {
      const { logger } = await import('../lib/logger');
      logger.debug('debug msg');
      expect(console.debug).toHaveBeenCalled();
      const call = (console.debug as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[DEBUG]');
      expect(call[0]).toContain('debug msg');
    });

    it('includes context object when provided', async () => {
      const { logger } = await import('../lib/logger');
      const ctx = { userId: '123', action: 'login' };
      logger.info('user action', ctx);
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toEqual(ctx);
    });

    it('includes error object when provided', async () => {
      const { logger } = await import('../lib/logger');
      const err = new Error('something broke');
      logger.error('failure', { op: 'test' }, err);
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[2]).toBe(err);
    });

    it('includes ISO timestamp in log output', async () => {
      const { logger } = await import('../lib/logger');
      logger.info('timestamp check');
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('in production mode', () => {
    it('does not log info messages in production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { logger } = await import('../lib/logger');
      logger.info('should not appear');
      expect(console.info).not.toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });

    it('does not log debug messages in production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { logger } = await import('../lib/logger');
      logger.debug('should not appear');
      expect(console.debug).not.toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });

    it('logs error messages in production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { logger } = await import('../lib/logger');
      logger.error('critical error');
      expect(console.error).toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });

    it('logs warn messages in production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { logger } = await import('../lib/logger');
      logger.warn('important warning');
      expect(console.warn).toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });
  });
});
