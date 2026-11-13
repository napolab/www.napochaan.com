import { describe, expect, it } from 'vitest';

import { extractPlainText } from '.';

import { richTextFromBlocks, richTextFromParagraphs } from '@utils/sample-rich-text';

describe('extractPlainText', () => {
  it('joins paragraph blocks with a single space and trims', () => {
    const body = richTextFromParagraphs(['  hello  ', 'world']);

    expect(extractPlainText(body)).toBe('hello   world');
  });

  it('collects text from nested inline link nodes', () => {
    const body = richTextFromBlocks([{ type: 'p', text: ['see ', { text: 'the site', href: 'https://example.com' }, ' now'] }]);

    expect(extractPlainText(body)).toBe('see the site now');
  });

  it('returns an empty string for an undefined body', () => {
    expect(extractPlainText(undefined)).toBe('');
  });

  it('returns an empty string when the body yields no text', () => {
    const body = richTextFromParagraphs([]);

    expect(extractPlainText(body)).toBe('');
  });
});
