import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }));

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
    },
  };
});

import {
  sendWelcomeEmail,
  sendVaultRequestReceivedEmail,
  sendVaultRequestApprovedEmail,
  sendVaultRequestDeniedEmail,
} from '../lib/email';

describe('Email Service', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  describe('sendWelcomeEmail', () => {
    it('sends email with correct recipient and subject', async () => {
      await sendWelcomeEmail('seeker@example.com', 'Alice');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.to).toBe('seeker@example.com');
      expect(args.subject).toContain('desk in the library');
      expect(args.from).toContain('Curator');
    });

    it('includes the user name in HTML body', async () => {
      await sendWelcomeEmail('test@test.com', 'Marcus');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('Marcus');
    });

    it('includes HTML structure with doctype and styling', async () => {
      await sendWelcomeEmail('test@test.com', 'Reader');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('<!DOCTYPE html>');
      expect(args.html).toContain('<style>');
      expect(args.html).toContain('Solitary Curator');
    });
  });

  describe('sendVaultRequestReceivedEmail', () => {
    it('sends email with book title in subject and body', async () => {
      await sendVaultRequestReceivedEmail('user@test.com', 'The Book of Shadows');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.to).toBe('user@test.com');
      expect(args.subject).toContain('The Book of Shadows');
      expect(args.html).toContain('The Book of Shadows');
    });

    it('includes petition language in email body', async () => {
      await sendVaultRequestReceivedEmail('user@test.com', 'Grimoire');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('petition');
    });
  });

  describe('sendVaultRequestApprovedEmail', () => {
    it('sends approval email with book title', async () => {
      await sendVaultRequestApprovedEmail('user@test.com', 'Emerald Tablet');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toContain('Access Granted');
      expect(args.subject).toContain('Emerald Tablet');
      expect(args.html).toContain('Emerald Tablet');
    });

    it('includes admin note when provided', async () => {
      await sendVaultRequestApprovedEmail('user@test.com', 'Book X', 'Handle with care');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('Handle with care');
      expect(args.html).toContain("Curator's Note");
    });

    it('does not include admin note section when not provided', async () => {
      await sendVaultRequestApprovedEmail('user@test.com', 'Book Y');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).not.toContain("Curator's Note");
    });
  });

  describe('sendVaultRequestDeniedEmail', () => {
    it('sends denial email with book title', async () => {
      await sendVaultRequestDeniedEmail('user@test.com', 'Forbidden Text');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toContain('Access Denied');
      expect(args.subject).toContain('Forbidden Text');
      expect(args.html).toContain('Forbidden Text');
    });

    it('includes admin note when provided', async () => {
      await sendVaultRequestDeniedEmail('user@test.com', 'Book Z', 'Not ready yet');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('Not ready yet');
      expect(args.html).toContain("Curator's Note");
    });

    it('does not include admin note section when not provided', async () => {
      await sendVaultRequestDeniedEmail('user@test.com', 'Book W');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).not.toContain("Curator's Note");
    });

    it('includes language about future petitions', async () => {
      await sendVaultRequestDeniedEmail('user@test.com', 'Book');

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain('another petition');
    });
  });
});
