import { describe, expect, it } from 'vitest';

import { parseLexicalJSON } from './index';

describe('parseLexicalJSON', () => {
  it('parses a serialized editor state', () => {
    const state = parseLexicalJSON(JSON.stringify({ root: { type: 'root', children: [] } }));
    expect(state).toHaveProperty('root');
  });

  it('returns undefined when the JSON string is absent', () => {
    expect(parseLexicalJSON(undefined)).toBeUndefined();
  });
});
