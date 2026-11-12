import { describe, expect, it } from 'vitest';

import { fenceOpeningLines, mapTextSegments, splitCodeFences } from '.';

describe('splitCodeFences', () => {
  it('returns a single text segment when there is no fence', () => {
    const markdown = 'a\nb\nc';
    expect(splitCodeFences(markdown)).toEqual([{ kind: 'text', text: 'a\nb\nc' }]);
  });

  it('splits text / fence / text around an image-row fence', () => {
    const markdown = ['before', '```image-row', '![media:5](caption)', '```', 'after'].join('\n');
    expect(splitCodeFences(markdown)).toEqual([
      { kind: 'text', text: 'before' },
      { kind: 'fence', text: '```image-row\n![media:5](caption)\n```' },
      { kind: 'text', text: 'after' },
    ]);
  });

  it('splits multiple fences (image-row + ts)', () => {
    const markdown = ['intro', '```image-row', '![media:1]()', '```', 'middle', '```ts', 'const a = 1;', '```', 'outro'].join('\n');
    expect(splitCodeFences(markdown)).toEqual([
      { kind: 'text', text: 'intro' },
      { kind: 'fence', text: '```image-row\n![media:1]()\n```' },
      { kind: 'text', text: 'middle' },
      { kind: 'fence', text: '```ts\nconst a = 1;\n```' },
      { kind: 'text', text: 'outro' },
    ]);
  });

  it('treats an unclosed fence as fence through to the end', () => {
    const markdown = ['before', '```ts', 'const a = 1;', 'const b = 2;'].join('\n');
    expect(splitCodeFences(markdown)).toEqual([
      { kind: 'text', text: 'before' },
      { kind: 'fence', text: '```ts\nconst a = 1;\nconst b = 2;' },
    ]);
  });

  it('handles markdown that starts with a fence', () => {
    const markdown = ['```md', 'example', '```', 'after'].join('\n');
    expect(splitCodeFences(markdown)).toEqual([
      { kind: 'fence', text: '```md\nexample\n```' },
      { kind: 'text', text: 'after' },
    ]);
  });

  it('handles markdown that ends with a fence', () => {
    const markdown = ['before', '```md', 'example', '```'].join('\n');
    expect(splitCodeFences(markdown)).toEqual([
      { kind: 'text', text: 'before' },
      { kind: 'fence', text: '```md\nexample\n```' },
    ]);
  });
});

describe('mapTextSegments', () => {
  it('restores the input exactly with the identity transform (no fence)', () => {
    const markdown = 'a\nb\nc';
    expect(mapTextSegments(markdown, (text) => text)).toBe(markdown);
  });

  it('restores the input exactly with the identity transform (with fence)', () => {
    const markdown = ['before', '```image-row', '![media:5](caption)', '```', 'after'].join('\n');
    expect(mapTextSegments(markdown, (text) => text)).toBe(markdown);
  });

  it('transforms only text segments and leaves fence content untouched', () => {
    const markdown = ['![media:1](x)', '```image-row', '![media:1](x)', '```', '![media:1](x)'].join('\n');
    const result = mapTextSegments(markdown, (text) => text.replaceAll('![media:1](x)', 'REPLACED'));
    expect(result).toBe(['REPLACED', '```image-row', '![media:1](x)', '```', 'REPLACED'].join('\n'));
  });
});

describe('fenceOpeningLines', () => {
  it('returns no lines for markdown without fences', () => {
    expect(fenceOpeningLines('a\n\nb')).toEqual([]);
  });

  it('lists the opening line of each fence (info string included)', () => {
    const markdown = ['```typescript', 'const x = 1;', '```', '', 'text', '', '```image-row', '![media:5](x)', '```'].join('\n');
    expect(fenceOpeningLines(markdown)).toEqual(['```typescript', '```image-row']);
  });

  it('does not mistake a closing ``` for the opening of the next fence when fences are adjacent', () => {
    const markdown = ['```bash', 'echo hi', '```', '```json', '{}', '```'].join('\n');
    expect(fenceOpeningLines(markdown)).toEqual(['```bash', '```json']);
  });

  it('treats an unclosed fence opening as an opening line', () => {
    expect(fenceOpeningLines('```css\nbody {}')).toEqual(['```css']);
  });
});
