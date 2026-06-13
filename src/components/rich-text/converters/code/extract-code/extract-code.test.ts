import { describe, expect, it } from 'vitest';

import { extractCode } from './index';

describe('extractCode', () => {
  it('folds code-highlight children into a single string', () => {
    const node = {
      language: 'typescript',
      children: [
        { type: 'code-highlight', text: 'const x' },
        { type: 'code-highlight', text: ' = 1' },
      ],
    };

    expect(extractCode(node)).toEqual({ code: 'const x = 1', lang: 'typescript' });
  });

  it('turns linebreak children into newlines and tab into a tab', () => {
    const node = {
      language: 'css',
      children: [
        { type: 'code-highlight', text: 'a {' },
        { type: 'linebreak' },
        { type: 'tab' },
        { type: 'code-highlight', text: 'color: red;' },
        { type: 'linebreak' },
        { type: 'code-highlight', text: '}' },
      ],
    };

    expect(extractCode(node).code).toBe('a {\n\tcolor: red;\n}');
  });

  it('returns lang undefined when language is absent or null', () => {
    expect(extractCode({ children: [{ type: 'code-highlight', text: 'x' }] }).lang).toBeUndefined();
    expect(extractCode({ language: null, children: [] }).lang).toBeUndefined();
  });

  it('returns empty string for no children', () => {
    expect(extractCode({ language: 'json' })).toEqual({ code: '', lang: 'json' });
  });
});
