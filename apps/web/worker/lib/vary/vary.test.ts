import { describe, expect, it } from 'vitest';

import { appendVary } from './index';

describe('appendVary', () => {
  it('sets the field when there is no Vary', () => {
    expect(appendVary(null, 'Accept')).toBe('Accept');
    expect(appendVary('', 'Accept')).toBe('Accept');
  });

  it('appends to an existing Vary without clobbering it', () => {
    expect(appendVary('Accept-Encoding', 'Accept')).toBe('Accept-Encoding, Accept');
    expect(appendVary('Origin, Accept-Encoding', 'Accept')).toBe('Origin, Accept-Encoding, Accept');
  });

  it('does not duplicate a field already listed (case-insensitive)', () => {
    expect(appendVary('accept', 'Accept')).toBe('accept');
    expect(appendVary('Accept-Encoding, ACCEPT', 'Accept')).toBe('Accept-Encoding, ACCEPT');
  });

  it('leaves `*` alone (it already varies on everything)', () => {
    expect(appendVary('*', 'Accept')).toBe('*');
  });
});
