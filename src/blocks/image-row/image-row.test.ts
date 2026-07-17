import { describe, expect, it } from 'vitest';

import { ImageRow } from '.';

describe('ImageRow.jsx.import', () => {
  it('parses a well-formed 2-cell fence', () => {
    const result = ImageRow.jsx.import({ children: '![media:79](left cap)\n![media:78]()' });
    if (result === false) throw new Error('expected cells, got false');

    const [first, second] = result.cells;
    if (first === undefined || second === undefined) throw new Error('expected exactly 2 cells');

    expect(first.image).toBe(79);
    expect(first.caption).toBe('left cap');
    expect(typeof first.id).toBe('string');
    expect(first.id.length > 0).toBe(true);

    expect(second.image).toBe(78);
    expect(second.caption).toBeUndefined();
    expect(typeof second.id).toBe('string');
    expect(second.id.length > 0).toBe(true);
  });

  it('rejects a single-line fence', () => {
    expect(ImageRow.jsx.import({ children: '![media:79](x)' })).toBe(false);
  });

  it('rejects a fence with a stray non-image line (3 lines total)', () => {
    expect(ImageRow.jsx.import({ children: '![media:79](x)\nnot a line\n![media:78]()' })).toBe(false);
  });

  it('rejects a fence with 3 valid cell lines', () => {
    expect(ImageRow.jsx.import({ children: '![media:79](x)\n![media:78]()\n![media:1]()' })).toBe(false);
  });

  it('rejects a line with a non-numeric media id', () => {
    expect(ImageRow.jsx.import({ children: '![media:abc](x)\n![media:78]()' })).toBe(false);
  });
});

describe('ImageRow.jsx.export', () => {
  it('serializes cells with raw numeric image ids', () => {
    const markdown = ImageRow.jsx.export({
      fields: { cells: [{ image: 79, caption: 'left cap' }, { image: 78 }] },
    });

    const expected = ['```image-row', '![media:79](left cap)', '![media:78]()', '```'].join('\n');
    expect(markdown).toBe(expected);
  });

  it('serializes cells with populated image docs ({ id })', () => {
    const markdown = ImageRow.jsx.export({
      fields: { cells: [{ image: { id: 79 }, caption: 'a' }, { image: { id: 78 } }] },
    });

    expect(markdown).toContain('![media:79](a)');
    expect(markdown).toContain('![media:78]()');
  });
});
