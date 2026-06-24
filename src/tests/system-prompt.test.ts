import { describe, it, expect } from 'vitest';
import {
  LIBRARIAN_SYSTEM_PROMPT,
  LIBRARIAN_GREETING,
  SUGGESTED_PROMPTS,
} from '../lib/chat/system-prompt';

describe('Chat System Prompt', () => {
  describe('LIBRARIAN_SYSTEM_PROMPT', () => {
    it('is a non-empty string', () => {
      expect(typeof LIBRARIAN_SYSTEM_PROMPT).toBe('string');
      expect(LIBRARIAN_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('defines the character role', () => {
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('The Librarian');
    });

    it('includes core purposes section', () => {
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('CORE PURPOSES');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('CLARIFY');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('GUIDE');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('CONTEXTUALIZE');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('SUPPORT');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('ORIENT');
    });

    it('includes boundaries section', () => {
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('BOUNDARIES');
    });

    it('includes context awareness section', () => {
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('CONTEXT AWARENESS');
    });

    it('mentions library categories', () => {
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('Consciousness');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('Forbidden');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('Spirituality');
      expect(LIBRARIAN_SYSTEM_PROMPT).toContain('Esoteric');
    });
  });

  describe('LIBRARIAN_GREETING', () => {
    it('is a non-empty string', () => {
      expect(typeof LIBRARIAN_GREETING).toBe('string');
      expect(LIBRARIAN_GREETING.length).toBeGreaterThan(10);
    });

    it('introduces The Librarian', () => {
      expect(LIBRARIAN_GREETING).toContain('Librarian');
    });

    it('invites the user to interact', () => {
      expect(LIBRARIAN_GREETING).toContain('What is on your mind?');
    });
  });

  describe('SUGGESTED_PROMPTS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(SUGGESTED_PROMPTS)).toBe(true);
      expect(SUGGESTED_PROMPTS.length).toBeGreaterThan(0);
    });

    it('contains only strings', () => {
      for (const prompt of SUGGESTED_PROMPTS) {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      }
    });

    it('includes prompts related to core library features', () => {
      const promptsStr = SUGGESTED_PROMPTS.join(' ');
      expect(promptsStr).toContain('Vault');
      expect(promptsStr).toContain('consciousness');
    });
  });
});
