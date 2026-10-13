import { describe, expect, it } from 'vitest';
import { truncateWords, wordCount } from '../src/util/words';

describe('English word limits', () => {
  it('counts contractions and Unicode names without counting punctuation', () => {
    expect(wordCount("Don't stop, Zoë! ✨")).toBe(3);
    expect(wordCount('  ')).toBe(0);
  });
  it('preserves complete words and punctuation instead of cutting names', () => {
    expect(truncateWords('Alexandra guards the bridge.', 2)).toBe('Alexandra guards');
    expect(truncateWords('Alexandra, stay.', 1)).toBe('Alexandra,');
    expect(truncateWords('Alexandra, stay.', 2)).toBe('Alexandra, stay.');
    expect(truncateWords('Alexandra', 0)).toBe('');
  });
});
