import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn (class name utility)', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes via clsx syntax', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    // twMerge should resolve p-4 vs px-2 → keeps px-2 + py from p-4
    const result = cn('p-4', 'px-2');
    expect(result).toContain('px-2');
  });

  it('handles undefined and null inputs gracefully', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty string inputs', () => {
    expect(cn('', 'test', '')).toBe('test');
  });

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object-style inputs (clsx feature)', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('returns empty string when no valid classes provided', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  it('deduplicates identical classes', () => {
    const result = cn('flex', 'flex');
    expect(result).toBe('flex');
  });
});
