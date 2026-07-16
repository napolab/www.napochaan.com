import { describe, expect, it } from 'vitest';

import { lexicalToMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const BASE = 'https://example.com';
const opts = { baseUrl: BASE };

// Minimal lexical state factory for tests. The runtime walker reads nodes
// structurally (type/children/text/...), so a plain object literal cast once
// here keeps every test case terse.
export const state = (...blocks: readonly unknown[]): SerializedEditorState => ({ root: { children: blocks } }) as unknown as SerializedEditorState;

const text = (value: string, format = 0) => ({ type: 'text', text: value, format });
const paragraph = (...children: readonly unknown[]) => ({ type: 'paragraph', children });

describe('lexicalToMarkdown: basics', () => {
  it('returns empty string for undefined body', () => {
    expect(lexicalToMarkdown(undefined, opts)).toBe('');
  });

  it('joins paragraphs with blank lines and skips empty ones', () => {
    const body = state(paragraph(text('一段落目')), paragraph(), paragraph(text('二段落目')));
    expect(lexicalToMarkdown(body, opts)).toBe('一段落目\n\n二段落目');
  });

  it('renders headings h1-h6 with # markers', () => {
    const body = state({ type: 'heading', tag: 'h2', children: [text('見出し')] }, { type: 'heading', tag: 'h4', children: [text('小見出し')] });
    expect(lexicalToMarkdown(body, opts)).toBe('## 見出し\n\n#### 小見出し');
  });

  it('applies bold/italic/strikethrough/inline-code format bitmasks', () => {
    // bitmasks mirror src/components/rich-text/converters/text: bold=1 italic=2 strike=4 code=16
    const body = state(paragraph(text('強い', 1), text(' と '), text('code', 16), text(' と '), text('全部', 1 | 2 | 4)));
    expect(lexicalToMarkdown(body, opts)).toBe('**強い** と `code` と **~~*全部*~~**');
  });

  it('renders linebreak as a newline inside a paragraph', () => {
    const body = state(paragraph(text('上'), { type: 'linebreak' }, text('下')));
    expect(lexicalToMarkdown(body, opts)).toBe('上\n下');
  });

  it('ignores unknown node types without throwing', () => {
    const body = state({ type: 'mystery-widget', children: [] }, paragraph(text('生存')));
    expect(lexicalToMarkdown(body, opts)).toBe('生存');
  });
});
