import { describe, expect, it } from 'vitest';

import { toLexicalJSON } from './index';

describe('toLexicalJSON', () => {
  it('stringifies a present editor state', () => {
    const state = { root: { type: 'root', children: [] } };
    expect(toLexicalJSON(state)).toBe(JSON.stringify(state));
  });

  it('returns undefined for NULL or undefined', () => {
    expect(toLexicalJSON(null)).toBeUndefined();
    expect(toLexicalJSON(undefined)).toBeUndefined();
  });
});
