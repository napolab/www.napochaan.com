import { describe, expect, it } from 'vitest';

import { extractHeadings, headingText, slugifyHeading } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Helper to build a typed editor state from an untyped literal.
const state = (children: unknown[]): SerializedEditorState => {
  const raw: unknown = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  };
  return raw as unknown as SerializedEditorState;
};

const textNode = (value: string) => ({
  type: 'text',
  text: value,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const headingNode = (tag: string, children: unknown[]) => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
});

describe('slugifyHeading', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugifyHeading('Hello World')).toBe('hello-world');
  });

  it('strips unsafe URL characters (?#/\\%"\'<>)', () => {
    expect(slugifyHeading('foo?bar#baz/qux\\quux%a"b\'c<d>e')).toBe('foobarbazquxquuxabcde');
  });

  it('collapses multiple consecutive spaces into a single dash', () => {
    expect(slugifyHeading('hello   world')).toBe('hello-world');
  });

  it('collapses multiple consecutive dashes into a single dash', () => {
    expect(slugifyHeading('a--b---c')).toBe('a-b-c');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugifyHeading('  hello world  ')).toBe('hello-world');
  });

  it('preserves Japanese characters', () => {
    expect(slugifyHeading('静かな インターネット')).toBe('静かな-インターネット');
  });

  it('returns empty string for empty input', () => {
    expect(slugifyHeading('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(slugifyHeading('   ')).toBe('');
  });
});

describe('headingText', () => {
  it('concatenates text from direct children', () => {
    const node = { children: [textNode('a'), textNode('b')] };
    expect(headingText(node)).toBe('ab');
  });

  it('returns empty string when children is an empty array', () => {
    expect(headingText({ children: [] })).toBe('');
  });

  it('returns empty string when children is undefined', () => {
    expect(headingText({})).toBe('');
  });

  it('recursively collects text from nested children', () => {
    const nested = { children: [textNode('x'), textNode('y')] };
    const node = { children: [nested] };
    expect(headingText(node)).toBe('xy');
  });
});

describe('extractHeadings', () => {
  it('returns empty array for null content', () => {
    expect(extractHeadings(null)).toEqual([]);
  });

  it('returns only h2 and h3 headings', () => {
    const content = state([headingNode('h1', [textNode('Title')]), headingNode('h2', [textNode('Section')]), headingNode('h3', [textNode('Subsection')]), headingNode('h4', [textNode('Deep')])]);
    const result = extractHeadings(content);
    expect(result).toHaveLength(2);
  });

  it('maps h2 to level 2 and h3 to level 3', () => {
    const content = state([headingNode('h2', [textNode('Section')]), headingNode('h3', [textNode('Subsection')])]);
    const result = extractHeadings(content);
    expect(result[0]?.level).toBe(2);
    expect(result[1]?.level).toBe(3);
  });

  it('includes text and slug for each heading', () => {
    const content = state([headingNode('h2', [textNode('Hello World')])]);
    const result = extractHeadings(content);
    expect(result[0]?.text).toBe('Hello World');
    expect(result[0]?.slug).toBe('hello-world');
  });

  it('skips headings with empty text', () => {
    const content = state([headingNode('h2', [textNode('')]), headingNode('h2', [textNode('Real Section')])]);
    const result = extractHeadings(content);
    expect(result).toHaveLength(1);
    expect(result[0]?.text).toBe('Real Section');
  });

  it('returns empty array when there are no h2/h3 headings', () => {
    const content = state([headingNode('h1', [textNode('Title')])]);
    expect(extractHeadings(content)).toEqual([]);
  });

  it('returns readonly array with correct shape', () => {
    const content = state([headingNode('h2', [textNode('Section')])]);
    const result = extractHeadings(content);
    expect(result[0]).toMatchObject({ level: 2, text: 'Section', slug: 'section' });
  });
});
