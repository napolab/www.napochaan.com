import { describe, expect, it } from 'vitest';

import { formatFrontmatter } from '.';

describe('formatFrontmatter', () => {
  it('renders --- fenced YAML with quoted strings and bare numbers', () => {
    const result = formatFrontmatter({ title: 'v3.0.0 制作記', date: '2026-01-01', readMin: 5 });
    expect(result).toBe(['---', 'title: "v3.0.0 制作記"', 'date: "2026-01-01"', 'readMin: 5', '---'].join('\n'));
  });

  it('omits undefined fields', () => {
    const result = formatFrontmatter({ title: 'a', category: undefined });
    expect(result).toBe(['---', 'title: "a"', '---'].join('\n'));
  });

  it('escapes double quotes and flattens newlines in values', () => {
    const result = formatFrontmatter({ title: 'say "hi"\nplease' });
    expect(result).toBe(['---', 'title: "say \\"hi\\" please"', '---'].join('\n'));
  });
});
